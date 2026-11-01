import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import { RequesterDashboard } from "../../src/pages/RequesterDashboard";
import StaffDashboard from "../../src/pages/StaffDashboard";

const mockRequesterUser = {
  id: "usr-req-1",
  name: "Jennifer Requester",
  email: "jennifer@example.com",
  role: "REQUESTER" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockStaffUser = {
  id: "usr-staff-1",
  name: "Michael Staff",
  email: "michael@example.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockRequesterData = {
  requesterName: "Jennifer Requester",
  metrics: {
    openTickets: 3,
    inProgress: 2,
    waitingForRequester: 1,
    resolved: 5,
    closed: 4,
  },
  recentTickets: [
    {
      id: "tkt-001",
      ticketNumber: "TKT-2026-0001",
      title: "Broken laptop display",
      status: "NEW" as const,
      priority: "URGENT" as const,
      updatedAt: "2026-10-12T10:00:00.000Z",
    },
    {
      id: "tkt-002",
      ticketNumber: "TKT-2026-0002",
      title: "Need VPN software license",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      updatedAt: "2026-10-11T14:30:00.000Z",
    },
  ],
  recentlyResolvedTickets: [
    {
      id: "tkt-003",
      ticketNumber: "TKT-2026-0003",
      title: "Password reset for email",
      status: "RESOLVED" as const,
      priority: "LOW" as const,
      updatedAt: "2026-10-09T09:15:00.000Z",
    },
  ],
  drillDownPaths: {
    openTickets: "/my-tickets?status=open_all",
    inProgress: "/my-tickets?status=IN_PROGRESS",
    waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
    resolved: "/my-tickets?status=RESOLVED",
    closed: "/my-tickets?status=CLOSED",
  },
};

const mockStaffData = {
  staffName: "Michael Staff",
  role: "IT_STAFF" as const,
  metrics: {
    newCount: 4,
    openCount: 6,
    inProgressCount: 3,
    waitingForRequesterCount: 2,
    myAssignedCount: 5,
    unassignedCount: 7,
    urgentCount: 1,
    highCount: 3,
    myActionsCount: 8,
  },
  byStatus: {
    NEW: 4,
    OPEN: 6,
    IN_PROGRESS: 3,
    WAITING_FOR_REQUESTER: 2,
    RESOLVED: 10,
    CLOSED: 15,
    REOPENED: 1,
    CANCELLED: 0,
  },
  recentTickets: [
    {
      id: "tkt-101",
      ticketNumber: "TKT-2026-0101",
      title: "VPN Gateway outage in Building B",
      status: "NEW",
      priority: "URGENT",
      owner: null,
      updatedAt: "2026-10-12T07:15:00.000Z",
    },
  ],
  myRecentActions: [
    {
      id: "act-1",
      ticketId: "tkt-102",
      ticketNumber: "TKT-2026-0102",
      ticketTitle: "Active Directory account locked",
      ticketStatus: "IN_PROGRESS",
      actionDate: "2026-10-12T08:30:00.000Z",
      actionDescription: "Verified user identity and unlocked AD account.",
      result: "Account unlocked successfully.",
      followUpRequired: true,
      followUpNote: "Check back with user after lunch to ensure login.",
    },
  ],
  userStats: null,
  drillDownPaths: {
    newCount: "/staff/tickets?status=NEW",
    openCount: "/staff/tickets?status=OPEN",
    inProgressCount: "/staff/tickets?status=IN_PROGRESS",
    waitingForRequesterCount: "/staff/tickets?status=WAITING_FOR_REQUESTER",
    myAssignedCount: "/staff/tickets?ownership=assigned_to_me",
    unassignedCount: "/staff/tickets?ownership=unassigned",
    urgentCount: "/staff/tickets?priority=URGENT",
    highCount: "/staff/tickets?priority=HIGH",
  },
};

describe("UI Style & Visual Token Fidelity Tests (Lab 4: VIS-01, VIS-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-token");
  });

  // --- VIS-01: Zen Green Token Fidelity ---
  it("VIS-01: Requester Dashboard applies Zen Green design tokens (#006B3C, #EAF6EF)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockRequesterUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/requester")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockRequesterData }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <RequesterDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();

    // Check Open Tickets metric card value uses Zen Green (#006B3C)
    const openMetricVal = screen.getByText("3");
    expect(openMetricVal.style.color).toBe("rgb(0, 107, 60)");

    // Check Quick Action "Create Ticket" card uses Zen Green subtle background (#EAF6EF) and Zen Green border
    const createTicketCard = screen.getByRole("link", { name: /Create Ticket/i });
    expect(createTicketCard.style.backgroundColor).toBe("rgb(234, 246, 239)"); // #EAF6EF
    expect(createTicketCard.style.borderLeft).toContain("rgb(0, 107, 60)"); // #006B3C

    // Check "View all" links use Zen Green text
    const viewAllLinks = screen.getAllByRole("link", { name: /View all/i });
    expect(viewAllLinks[0].style.color).toBe("rgb(0, 107, 60)");

    // Check Ticket number in recent table uses Zen Green
    const tktLink = screen.getByRole("link", { name: "TKT-2026-0001" });
    expect(tktLink.style.color).toBe("rgb(0, 107, 60)");
  });

  it("VIS-01b: Staff Dashboard applies Zen Green design tokens (#006B3C) and neutral borders (#D5DDD8)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockStaffData }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();

    // Check "My Assigned" metric card uses Zen Green (#006B3C)
    const myAssignedMetricVal = screen.getByText("5");
    expect(myAssignedMetricVal.style.color).toBe("rgb(0, 107, 60)");

    // Check Quick Action buttons use Zen Neutral Border (#D5DDD8)
    const unassignedBtn = screen.getByRole("link", { name: /Unassigned Queue/i });
    expect(unassignedBtn.style.borderColor).toBe("rgb(213, 221, 216)"); // #D5DDD8

    // Check My Recent Actions ticket link uses Zen Green (#006B3C)
    const actionTktLink = screen.getByRole("link", { name: "TKT-2026-0102" });
    expect(actionTktLink.style.color).toBe("rgb(0, 107, 60)");
  });

  // --- VIS-02: Status & Priority Badges and Follow-up Pill ---
  it("VIS-02: renders status and priority badges conforming to color token spec and Amber follow-up pill", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockStaffData }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <StaffDashboard />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();

    // Priority badge: URGENT -> #FEE2E2 / #B91C1C
    const urgentBadge = screen.getByText("Urgent");
    expect(urgentBadge.style.backgroundColor).toBe("rgb(254, 226, 226)"); // #FEE2E2
    expect(urgentBadge.style.color).toBe("rgb(185, 28, 28)"); // #B91C1C

    // Follow-up required pill: Amber theme -> #FEF3C7 / #B45309
    const followUpPill = screen.getByText("Follow-up required");
    expect(followUpPill.style.backgroundColor).toBe("rgb(254, 243, 199)"); // #FEF3C7
    expect(followUpPill.style.color).toBe("rgb(180, 83, 9)"); // #B45309
  });
});
