import { Response } from "express";
import { getPrisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import {
  REQUESTER_DRILL_DOWN_PATHS,
  STAFF_DRILL_DOWN_PATHS,
  buildRequesterDashboardQueries,
  aggregateRequesterStatusCounts,
  buildStaffDashboardQueries,
  aggregateStaffStatusCounts,
  aggregateAdminUserStats,
} from "../utils/dashboardMetrics.js";

/**
 * GET /api/v1/dashboard/requester
 * Retrieve authoritative summary metrics, recent tickets, and recently resolved tickets
 * scoped strictly to the authenticated Requester (FR-13, BR-13, BR-16, AC-15, AC-16).
 */
export const getRequesterDashboardHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    // Strict role boundary: Requester Dashboard is strictly for REQUESTER role (Section 6, api-spec.md Section 4.1)
    if (user.role !== "REQUESTER") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Only Requesters are permitted to access the Requester Dashboard.",
        },
      });
    }

    // Resolve optional legacy RequesterUser projection linked to this authenticated user
    const requesterProfile = await prisma.requesterUser.findFirst({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
      select: {
        id: true,
        userId: true,
      },
    });

    const requesterProfileId =
      requesterProfile &&
      (requesterProfile.userId === user.id || requesterProfile.userId === null)
        ? requesterProfile.id
        : null;

    const queries = buildRequesterDashboardQueries(user.id, requesterProfileId);

    // Execute authoritative PostgreSQL SQL aggregations and top-5 bounded queries in parallel (BR-13, BR-16)
    const [statusGroupRows, recentTicketsRaw, recentlyResolvedRaw] =
      await Promise.all([
        prisma.ticket.groupBy({
          by: ["status"],
          where: queries.ownershipWhere,
          _count: { _all: true },
        }),
        prisma.ticket.findMany({
          where: queries.ownershipWhere,
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: 5,
          select: {
            id: true,
            ticketNo: true,
            summary: true,
            status: true,
            requestedPriority: true,
            itPriority: true,
            updatedAt: true,
          },
        }),
        prisma.ticket.findMany({
          where: queries.resolvedWhere,
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: 5,
          select: {
            id: true,
            ticketNo: true,
            summary: true,
            status: true,
            requestedPriority: true,
            itPriority: true,
            updatedAt: true,
          },
        }),
      ]);

    const metrics = aggregateRequesterStatusCounts(statusGroupRows);

    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNo,
      title: t.summary,
      status: t.status,
      priority: t.itPriority || t.requestedPriority,
      updatedAt: t.updatedAt.toISOString(),
    }));

    const recentlyResolvedTickets = recentlyResolvedRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNo,
      title: t.summary,
      status: t.status,
      priority: t.itPriority || t.requestedPriority,
      updatedAt: t.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        requesterName: user.name,
        metrics,
        recentTickets,
        recentlyResolvedTickets,
        drillDownPaths: REQUESTER_DRILL_DOWN_PATHS,
      },
    });
  } catch (error) {
    console.error("Error in getRequesterDashboardHandler:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message:
          "An unexpected error occurred while loading the Requester Dashboard.",
      },
    });
  }
};

/**
 * GET /api/v1/dashboard/staff
 * Retrieve authoritative operational queue metrics, status breakdown, current-user Actions Taken,
 * recent queue tickets, and (for Administrators) active user statistics (FR-14, FR-15, BR-14, BR-15, BR-16).
 */
export const getStaffDashboardHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    // Strict role boundary: Only IT_STAFF and ADMIN are permitted (AC-20, API-30, api-spec.md Section 4.2)
    if (user.role !== "IT_STAFF" && user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            "Only IT Staff and Administrators are permitted to access the Staff Dashboard.",
        },
      });
    }

    const queries = buildStaffDashboardQueries(user.id);

    // Execute authoritative PostgreSQL SQL aggregations and top-5 bounded queries in parallel (BR-14, BR-15, BR-16)
    const [
      statusGroupRows,
      myAssignedCount,
      unassignedCount,
      urgentCount,
      highCount,
      myActionsCount,
      recentTicketsRaw,
      myRecentActionsRaw,
      userRoleGroupRows,
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.ticket.count({
        where: queries.myAssignedWhere,
      }),
      prisma.ticket.count({
        where: queries.unassignedWhere,
      }),
      prisma.ticket.count({
        where: queries.urgentWhere,
      }),
      prisma.ticket.count({
        where: queries.highWhere,
      }),
      prisma.actionTaken.count({
        where: queries.myActionsWhere,
      }),
      prisma.ticket.findMany({
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        take: 5,
        select: {
          id: true,
          ticketNo: true,
          summary: true,
          status: true,
          requestedPriority: true,
          itPriority: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.actionTaken.findMany({
        where: queries.myActionsWhere,
        orderBy: [{ actionDate: "desc" }, { id: "asc" }],
        take: 5,
        include: {
          ticket: {
            select: {
              id: true,
              ticketNo: true,
              summary: true,
              status: true,
            },
          },
        },
      }),
      user.role === "ADMIN"
        ? prisma.user.groupBy({
            by: ["role"],
            where: { isActive: true },
            _count: { _all: true },
          })
        : Promise.resolve(null),
    ]);

    const { byStatus, statusMetrics } =
      aggregateStaffStatusCounts(statusGroupRows);

    const recentTickets = recentTicketsRaw.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNo,
      title: t.summary,
      status: t.status,
      priority: t.itPriority || t.requestedPriority,
      owner: t.owner
        ? {
            id: t.owner.id,
            name: t.owner.name,
          }
        : null,
      updatedAt: t.updatedAt.toISOString(),
    }));

    const myRecentActions = myRecentActionsRaw.map((a) => ({
      id: a.id,
      ticketId: a.ticketId,
      ticketNumber: a.ticket.ticketNo,
      ticketTitle: a.ticket.summary,
      ticketStatus: a.ticket.status,
      actionDate: a.actionDate.toISOString(),
      actionDescription: a.actionDescription,
      result: a.result,
      followUpRequired: a.followUpRequired,
      followUpNote: a.followUpNote,
    }));

    const userStats =
      user.role === "ADMIN" && userRoleGroupRows
        ? aggregateAdminUserStats(userRoleGroupRows)
        : null;

    return res.status(200).json({
      success: true,
      data: {
        staffName: user.name,
        role: user.role,
        metrics: {
          ...statusMetrics,
          myAssignedCount,
          unassignedCount,
          urgentCount,
          highCount,
          myActionsCount,
        },
        byStatus,
        recentTickets,
        myRecentActions,
        userStats,
        drillDownPaths: STAFF_DRILL_DOWN_PATHS,
      },
    });
  } catch (error) {
    console.error("Error in getStaffDashboardHandler:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message:
          "An unexpected error occurred while loading the Staff Dashboard.",
      },
    });
  }
};
