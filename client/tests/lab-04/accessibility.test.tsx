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
  recentTickets: [],
  recentlyResolvedTickets: [],
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
  recentTickets: [],
  myRecentActions: [],
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

describe("Dashboard Accessibility & Keyboard Focus Tests (Lab 4: VIS-03, RESP-03, FR-20)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-token");
  });

  // --- VIS-03 & FR-20: Focus Ring CSS Specification ---
  it("VIS-03: touch-targets.css contains high-contrast visible focus ring (#0B7A46, 2px offset) for :focus-visible", async () => {
    // @ts-ignore
    const { readFileSync } = await import("node:fs");
    // @ts-ignore
    const { resolve } = await import("node:path");
    const cwd = (globalThis as any).process.cwd();
    const cssPath = resolve(cwd, "src/touch-targets.css");
    const content = readFileSync(cssPath, "utf-8");

    expect(content).toMatch(/:focus-visible/);
    expect(content).toMatch(/outline:\s*2px\s+solid\s+#0B7A46/i);
    expect(content).toMatch(/outline-offset:\s*2px/i);
  });

  // --- RESP-03 & FR-20: Touch Targets Specification ---
  it("RESP-03: touch-targets.css specifies minimum 44px height for interactive elements under 1024px", async () => {
    // @ts-ignore
    const { readFileSync } = await import("node:fs");
    // @ts-ignore
    const { resolve } = await import("node:path");
    const cwd = (globalThis as any).process.cwd();
    const cssPath = resolve(cwd, "src/touch-targets.css");
    const content = readFileSync(cssPath, "utf-8");

    expect(content).toMatch(/@media\s*\(\s*max-width:\s*1024px\s*\)/);
    expect(content).toMatch(/min-height:\s*44px/);
    expect(content).toMatch(/\.btn-close/);
  });

  // --- Keyboard & Screen Reader Accessibility on Requester Dashboard ---
  it("FR-20a: Requester Dashboard metric cards and actions provide descriptive aria-labels and keyboard focusable links", async () => {
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

    // Verify all 4 drill-down links have descriptive aria-labels for screen readers
    const openTicketsLink = screen.getByRole("link", { name: /View all open tickets/i });
    expect(openTicketsLink).toHaveAttribute("aria-label", "View all open tickets");

    const waitingLink = screen.getByRole("link", { name: /View tickets waiting for requester/i });
    expect(waitingLink).toHaveAttribute("aria-label", "View tickets waiting for requester");

    const resolvedLink = screen.getByRole("link", { name: /View resolved tickets/i });
    expect(resolvedLink).toHaveAttribute("aria-label", "View resolved tickets");

    const closedLink = screen.getByRole("link", { name: /View closed tickets/i });
    expect(closedLink).toHaveAttribute("aria-label", "View closed tickets");
  });

  // --- Keyboard & Screen Reader Accessibility on Staff Dashboard ---
  it("FR-20b: Staff Dashboard metric cards and priority strip provide descriptive aria-labels for screen readers", async () => {
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

    // Verify Staff operational metric cards have descriptive aria-labels
    expect(screen.getByRole("link", { name: /View all new tickets/i })).toHaveAttribute(
      "aria-label",
      "View all new tickets"
    );
    expect(screen.getByRole("link", { name: /View all open tickets/i })).toHaveAttribute(
      "aria-label",
      "View all open tickets"
    );
    expect(screen.getByRole("link", { name: /View all in-progress tickets/i })).toHaveAttribute(
      "aria-label",
      "View all in-progress tickets"
    );
    expect(screen.getByRole("link", { name: /View all waiting for requester tickets/i })).toHaveAttribute(
      "aria-label",
      "View all waiting for requester tickets"
    );
    expect(screen.getByRole("link", { name: /View my assigned tickets/i })).toHaveAttribute(
      "aria-label",
      "View my assigned tickets"
    );
    expect(screen.getByRole("link", { name: /View unassigned tickets/i })).toHaveAttribute(
      "aria-label",
      "View unassigned tickets"
    );

    // Urgent attention link
    expect(screen.getByRole("link", { name: /View urgent priority tickets/i })).toHaveAttribute(
      "aria-label",
      "View urgent priority tickets"
    );
  });
});
