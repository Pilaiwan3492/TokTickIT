import { describe, it, expect } from "vitest";
import { Priority, Role, TicketStatus } from "@prisma/client";
import {
  REQUESTER_OPEN_STATUSES,
  TERMINAL_TICKET_STATUSES,
  REQUESTER_DRILL_DOWN_PATHS,
  STAFF_DRILL_DOWN_PATHS,
  buildRequesterOwnershipWhere,
  buildRequesterDashboardQueries,
  aggregateRequesterStatusCounts,
  buildStaffDashboardQueries,
  aggregateStaffStatusCounts,
  aggregateAdminUserStats,
} from "../../src/utils/dashboardMetrics.js";

describe("Dashboard Metrics Unit Tests (Lab 4 — Issue 36: UNIT-03, BR-13, BR-14, BR-15, BR-16)", () => {
  describe("UNIT-03a: Requester Dashboard SQL Query Builders & Aggregations (BR-13, BR-16)", () => {
    it("should build strict ownership filter using userId when requesterProfileId is absent", () => {
      const where = buildRequesterOwnershipWhere("usr-req-001", null);
      expect(where).toEqual({ userId: "usr-req-001" });
    });

    it("should build ownership filter with legacy requesterId fallback when requesterProfileId is provided", () => {
      const where = buildRequesterOwnershipWhere("usr-req-001", 42);
      expect(where).toEqual({
        OR: [
          { userId: "usr-req-001" },
          { AND: [{ userId: null }, { requesterId: 42 }] },
        ],
      });
    });

    it("should generate Requester Dashboard Prisma where clauses matching BR-13 status definitions", () => {
      const queries = buildRequesterDashboardQueries("usr-req-001", 42);

      expect(queries.openTicketsWhere).toEqual({
        AND: [
          queries.ownershipWhere,
          { status: { in: REQUESTER_OPEN_STATUSES } },
        ],
      });
      expect(queries.waitingForRequesterWhere).toEqual({
        AND: [
          queries.ownershipWhere,
          { status: TicketStatus.WAITING_FOR_REQUESTER },
        ],
      });
      expect(queries.resolvedWhere).toEqual({
        AND: [queries.ownershipWhere, { status: TicketStatus.RESOLVED }],
      });
      expect(queries.closedWhere).toEqual({
        AND: [queries.ownershipWhere, { status: TicketStatus.CLOSED }],
      });
    });

    it("should accurately aggregate Requester status counts from SQL GROUP BY rows", () => {
      const rows = [
        { status: TicketStatus.NEW, _count: { _all: 2 } },
        { status: TicketStatus.OPEN, _count: { _all: 3 } },
        { status: TicketStatus.IN_PROGRESS, _count: { _all: 4 } },
        { status: TicketStatus.WAITING_FOR_REQUESTER, _count: { _all: 1 } },
        { status: TicketStatus.RESOLVED, _count: { _all: 5 } },
        { status: TicketStatus.CLOSED, _count: { _all: 7 } },
        { status: TicketStatus.CANCELLED, _count: { _all: 2 } },
      ];

      const metrics = aggregateRequesterStatusCounts(rows);

      // openTickets = NEW (2) + OPEN (3) + IN_PROGRESS (4) + WAITING_FOR_REQUESTER (1) = 10
      expect(metrics).toEqual({
        openTickets: 10,
        waitingForRequester: 1,
        resolved: 5,
        closed: 7,
      });
    });

    it("should return all zeros when Requester has no tickets", () => {
      expect(aggregateRequesterStatusCounts([])).toEqual({
        openTickets: 0,
        waitingForRequester: 0,
        resolved: 0,
        closed: 0,
      });
    });

    it("should expose canonical Requester drill-down paths", () => {
      expect(REQUESTER_DRILL_DOWN_PATHS).toEqual({
        openTickets: "/my-tickets?status=open_all",
        waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
        resolved: "/my-tickets?status=RESOLVED",
        closed: "/my-tickets?status=CLOSED",
      });
    });
  });

  describe("UNIT-03b: Staff & Admin Dashboard SQL Query Builders & Aggregations (BR-14, BR-15, BR-16)", () => {
    it("should generate Staff Dashboard Prisma where clauses excluding terminal tickets for active operational counters", () => {
      const queries = buildStaffDashboardQueries("usr-staff-01");

      expect(queries.myAssignedWhere).toEqual({
        ownerId: "usr-staff-01",
        status: { notIn: TERMINAL_TICKET_STATUSES },
      });
      expect(queries.unassignedWhere).toEqual({
        ownerId: null,
        status: { notIn: TERMINAL_TICKET_STATUSES },
      });
      expect(queries.urgentWhere).toEqual({
        itPriority: Priority.URGENT,
        status: { notIn: TERMINAL_TICKET_STATUSES },
      });
      expect(queries.highWhere).toEqual({
        itPriority: Priority.HIGH,
        status: { notIn: TERMINAL_TICKET_STATUSES },
      });
      expect(queries.myActionsWhere).toEqual({
        performedById: "usr-staff-01",
      });
    });

    it("should aggregate all 8 statuses and primary status metrics from SQL GROUP BY rows", () => {
      const rows = [
        { status: TicketStatus.NEW, _count: { _all: 4 } },
        { status: TicketStatus.OPEN, _count: { _all: 6 } },
        { status: TicketStatus.IN_PROGRESS, _count: { _all: 3 } },
        { status: TicketStatus.WAITING_FOR_REQUESTER, _count: { _all: 2 } },
        { status: TicketStatus.RESOLVED, _count: { _all: 8 } },
        { status: TicketStatus.CLOSED, _count: { _all: 11 } },
      ];

      const { byStatus, statusMetrics } = aggregateStaffStatusCounts(rows);

      expect(byStatus).toEqual({
        NEW: 4,
        OPEN: 6,
        IN_PROGRESS: 3,
        WAITING_FOR_REQUESTER: 2,
        RESOLVED: 8,
        CLOSED: 11,
        REOPENED: 0,
        CANCELLED: 0,
      });

      expect(statusMetrics).toEqual({
        newCount: 4,
        openCount: 6,
        inProgressCount: 3,
        waitingForRequesterCount: 2,
      });
    });

    it("should aggregate active user statistics by role for Administrators (BR-15)", () => {
      const roleRows = [
        { role: Role.REQUESTER, _count: { _all: 40 } },
        { role: Role.IT_STAFF, _count: { _all: 6 } },
        { role: Role.ADMIN, _count: { _all: 2 } },
      ];

      expect(aggregateAdminUserStats(roleRows)).toEqual({
        activeUsers: 48,
        activeStaff: 6,
        activeAdmins: 2,
      });
    });

    it("should expose canonical Staff drill-down paths", () => {
      expect(STAFF_DRILL_DOWN_PATHS).toEqual({
        newCount: "/staff/tickets?status=NEW",
        openCount: "/staff/tickets?status=OPEN",
        inProgressCount: "/staff/tickets?status=IN_PROGRESS",
        waitingForRequesterCount: "/staff/tickets?status=WAITING_FOR_REQUESTER",
        myAssignedCount: "/staff/tickets?ownership=assigned_to_me",
        unassignedCount: "/staff/tickets?ownership=unassigned",
        urgentCount: "/staff/tickets?priority=URGENT",
        highCount: "/staff/tickets?priority=HIGH",
      });
    });
  });
});
