import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import RequesterDashboard from "../../src/pages/RequesterDashboard";
import MyTickets from "../../src/pages/MyTickets";

const mockRequesterUser = {
  id: "usr-requester-1",
  name: "Jennifer Requester",
  email: "jennifer.req@toktickit.com",
  role: "REQUESTER" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockPopulatedDashboardData = {
  requesterName: "Jennifer Requester",
  metrics: {
    openTickets: 3,
    waitingForRequester: 1,
    resolved: 5,
    closed: 2,
  },
  recentTickets: [
    {
      id: "tkt-1",
      ticketNumber: "TKT-2026-0001",
      title: "Broken laptop display",
      status: "OPEN",
      priority: "HIGH",
      updatedAt: "2026-10-10T08:30:00.000Z",
    },
    {
      id: "tkt-2",
      ticketNumber: "TKT-2026-0002",
      title: "Need VPN software license",
      status: "WAITING_FOR_REQUESTER",
      priority: "MEDIUM",
      updatedAt: "2026-10-11T09:15:00.000Z",
    },
  ],
  recentlyResolvedTickets: [
    {
      id: "tkt-3",
      ticketNumber: "TKT-2026-0003",
      title: "Password reset for email",
      status: "RESOLVED",
      priority: "LOW",
      updatedAt: "2026-10-09T14:20:00.000Z",
    },
  ],
  drillDownPaths: {
    openTickets: "/my-tickets?status=open_all",
    waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
    resolved: "/my-tickets?status=RESOLVED",
    closed: "/my-tickets?status=CLOSED",
  },
};

const mockEmptyDashboardData = {
  requesterName: "Jennifer Requester",
  metrics: {
    openTickets: 0,
    waitingForRequester: 0,
    resolved: 0,
    closed: 0,
  },
  recentTickets: [],
  recentlyResolvedTickets: [],
  drillDownPaths: {
    openTickets: "/my-tickets?status=open_all",
    waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
    resolved: "/my-tickets?status=RESOLVED",
    closed: "/my-tickets?status=CLOSED",
  },
};

const mockTicketsResponse = {
  data: [
    {
      id: "tkt-1",
      ticketNo: "TKT-2026-0001",
      summary: "Broken laptop display",
      description: "Screen flicker issues",
      requestedPriority: "HIGH",
      currentStatus: "OPEN",
      category: { id: 1, name: "Hardware" },
      relatedSystem: { id: 1, name: "Workstations" },
      createdAt: "2026-10-10T08:30:00.000Z",
      updatedAt: "2026-10-10T08:30:00.000Z",
    },
  ],
  meta: {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
};

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
}

describe("Requester Dashboard UI Tests (Lab 4 — Issue 37: UI-16, UI-17, UI-21)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-requester-token");
  });

  const setupFetch = (dashboardData: any, isError = false, errorMessage = "Network failure") => {
    return vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockRequesterUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/categories")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 1, name: "Hardware" },
            { id: 2, name: "Software" },
          ],
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockTicketsResponse,
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/requester")) {
        if (isError) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: { code: "SERVER_ERROR", message: errorMessage },
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: dashboardData,
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });
  };

  const renderDashboard = () =>
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <RequesterDashboard />
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );

  // --- UI-16: Requester Dashboard renders 4 primary metric cards ---
  it("UI-16: Requester Dashboard renders 4 primary metric cards and welcome greeting", async () => {
    setupFetch(mockPopulatedDashboardData);
    renderDashboard();

    // Verify Welcome Banner
    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();
    expect(screen.getByText(/Here's the latest on your requests/i)).toBeInTheDocument();

    // Verify 4 Primary Metric Cards exist
    const openCard = screen.getByRole("link", { name: /View all open tickets/i }).closest(".card") as HTMLElement;
    expect(within(openCard).getByText("My Open Tickets")).toBeInTheDocument();
    expect(within(openCard).getByText("3")).toBeInTheDocument();

    const waitingCard = screen.getByRole("link", { name: /View tickets waiting for requester/i }).closest(".card") as HTMLElement;
    expect(within(waitingCard).getByText("Waiting for Requester")).toBeInTheDocument();
    expect(within(waitingCard).getByText("1")).toBeInTheDocument();

    const resolvedCard = screen.getByRole("link", { name: /View resolved tickets/i }).closest(".card") as HTMLElement;
    expect(within(resolvedCard).getByText("Resolved")).toBeInTheDocument();
    expect(within(resolvedCard).getByText("5")).toBeInTheDocument();

    const closedCard = screen.getByRole("link", { name: /View closed tickets/i }).closest(".card") as HTMLElement;
    expect(within(closedCard).getByText("Closed")).toBeInTheDocument();
    expect(within(closedCard).getByText("2")).toBeInTheDocument();
  });

  // --- UI-17: Requester Dashboard empty state when ticket count is 0 ---
  it("UI-17: Requester Dashboard displays 0 counts, empty state message, and + Create Ticket CTA when ticket count is 0", async () => {
    setupFetch(mockEmptyDashboardData);
    renderDashboard();

    // Verify cards show 0
    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();
    const zeroCounts = screen.getAllByText("0");
    expect(zeroCounts.length).toBeGreaterThanOrEqual(4);

    // Verify Empty State Heading and Subtext
    expect(
      screen.getByText("You haven't submitted any tickets yet")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Need assistance with hardware, software, or network access?")
    ).toBeInTheDocument();

    // Verify "+ Create Ticket" call to action button
    const ctaButton = screen.getByRole("link", { name: /\+ Create Ticket/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute("href", "/create-ticket");
  });

  // --- Empty State Conditions when Recent and Recently Resolved differ ---
  it("renders main dashboard view when requester has open tickets but 0 recently resolved tickets", async () => {
    const dataWithOnlyOpenTickets = {
      requesterName: "Jennifer Requester",
      metrics: {
        openTickets: 2,
        waitingForRequester: 0,
        resolved: 0,
        closed: 0,
      },
      recentTickets: [
        {
          id: "tkt-1",
          ticketNumber: "TKT-2026-0001",
          title: "Broken laptop display",
          status: "OPEN",
          priority: "HIGH",
          updatedAt: "2026-10-10T08:30:00.000Z",
        },
      ],
      recentlyResolvedTickets: [],
      drillDownPaths: mockPopulatedDashboardData.drillDownPaths,
    };

    setupFetch(dataWithOnlyOpenTickets);
    renderDashboard();

    // Must NOT render full-page empty state
    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();
    expect(screen.queryByText("You haven't submitted any tickets yet")).not.toBeInTheDocument();

    // My Recent Tickets renders the ticket row
    expect(screen.getByText("TKT-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Broken laptop display")).toBeInTheDocument();

    // Recently Resolved Tickets section renders the specific empty message
    expect(screen.getByText("No recently resolved tickets")).toBeInTheDocument();
  });

  it("renders main dashboard view when requester has recently resolved tickets but 0 open tickets", async () => {
    const dataWithOnlyResolvedTickets = {
      requesterName: "Jennifer Requester",
      metrics: {
        openTickets: 0,
        waitingForRequester: 0,
        resolved: 2,
        closed: 0,
      },
      recentTickets: [],
      recentlyResolvedTickets: [
        {
          id: "tkt-3",
          ticketNumber: "TKT-2026-0003",
          title: "Password reset for email",
          status: "RESOLVED",
          priority: "LOW",
          updatedAt: "2026-10-09T14:20:00.000Z",
        },
      ],
      drillDownPaths: mockPopulatedDashboardData.drillDownPaths,
    };

    setupFetch(dataWithOnlyResolvedTickets);
    renderDashboard();

    // Must NOT render full-page empty state
    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();
    expect(screen.queryByText("You haven't submitted any tickets yet")).not.toBeInTheDocument();

    // My Recent Tickets renders the specific empty message
    expect(screen.getByText("No recent tickets.")).toBeInTheDocument();

    // Recently Resolved Tickets section renders the ticket row
    expect(screen.getByText("TKT-2026-0003")).toBeInTheDocument();
    expect(screen.getByText("Password reset for email")).toBeInTheDocument();
  });

  it("renders main dashboard view (not full empty state) when recent ticket lists are empty but metrics categories have counts", async () => {
    const dataWithOnlyClosedMetrics = {
      requesterName: "Jennifer Requester",
      metrics: {
        openTickets: 0,
        waitingForRequester: 0,
        resolved: 0,
        closed: 5,
      },
      recentTickets: [],
      recentlyResolvedTickets: [],
      drillDownPaths: {
        openTickets: "/my-tickets?status=open_all",
        waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
        resolved: "/my-tickets?status=RESOLVED",
        closed: "/my-tickets?status=CLOSED",
      },
    };

    setupFetch(dataWithOnlyClosedMetrics);
    renderDashboard();

    // Must NOT render full-page empty state because closed metric has count 5
    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();
    expect(screen.queryByText("You haven't submitted any tickets yet")).not.toBeInTheDocument();

    // Closed card shows 5
    expect(screen.getByText("5")).toBeInTheDocument();

    // Both recent lists show clean inline empty messages
    expect(screen.getByText("No recent tickets.")).toBeInTheDocument();
    expect(screen.getByText("No recently resolved tickets")).toBeInTheDocument();
  });

  // --- UI-21: Clicking Requester metric card navigates to filtered My Tickets ---
  it("UI-21: clicking Requester metric card drill-down links routes to /my-tickets with pre-applied status filters", async () => {
    setupFetch(mockPopulatedDashboardData);
    renderDashboard();

    expect(await screen.findByText("My Open Tickets")).toBeInTheDocument();

    // Verify Open Tickets drill-down link
    const openTicketsLink = screen.getByRole("link", { name: /View all open tickets/i });
    expect(openTicketsLink).toHaveAttribute("href", "/my-tickets?status=open_all");
    fireEvent.click(openTicketsLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/my-tickets?status=open_all");

    // Verify Waiting for Requester drill-down link
    const waitingLink = screen.getByRole("link", { name: /View tickets waiting for requester/i });
    expect(waitingLink).toHaveAttribute("href", "/my-tickets?status=WAITING_FOR_REQUESTER");
    fireEvent.click(waitingLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/my-tickets?status=WAITING_FOR_REQUESTER");

    // Verify Resolved drill-down link
    const resolvedLink = screen.getByRole("link", { name: /View resolved tickets/i });
    expect(resolvedLink).toHaveAttribute("href", "/my-tickets?status=RESOLVED");
    fireEvent.click(resolvedLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/my-tickets?status=RESOLVED");

    // Verify Closed drill-down link
    const closedLink = screen.getByRole("link", { name: /View closed tickets/i });
    expect(closedLink).toHaveAttribute("href", "/my-tickets?status=CLOSED");
    fireEvent.click(closedLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/my-tickets?status=CLOSED");
  });

  // --- Drill-down End-to-End Integration with MyTickets ---
  it("UI-21-INT: clicking My Open Tickets navigates to MyTickets, applies status filter 'open_all', calls API, and renders filtered tickets", async () => {
    let capturedTicketsUrl = "";

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
          json: async () => ({
            success: true,
            data: mockPopulatedDashboardData,
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/categories")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 1, name: "Hardware" },
            { id: 2, name: "Software" },
          ],
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets")) {
        capturedTicketsUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockTicketsResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<RequesterDashboard />} />
            <Route path="/my-tickets" element={<MyTickets />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Dashboard rendered
    expect(await screen.findByText(/Welcome, Jennifer Requester!/i)).toBeInTheDocument();

    // Click My Open Tickets drill-down link
    const openTicketsLink = screen.getByRole("link", { name: /View all open tickets/i });
    fireEvent.click(openTicketsLink);

    // Verify MyTickets destination page is rendered with filter applied
    await waitFor(() => {
      expect(capturedTicketsUrl).toContain("status=open_all");
    });

    // The status select dropdown on MyTickets should be pre-set to "open_all"
    const statusSelect = (await screen.findByDisplayValue("All Open")) as HTMLSelectElement;
    expect(statusSelect.value).toBe("open_all");

    // The filtered ticket should be rendered on the destination page
    expect(screen.getByText("TKT-2026-0001")).toBeInTheDocument();
  });

  // --- Recent Tickets & Recently Resolved Tickets Tables ---
  it("renders My Recent Tickets and Recently Resolved Tickets tables with status badges and links", async () => {
    setupFetch(mockPopulatedDashboardData);
    renderDashboard();

    expect(await screen.findByText("My Recent Tickets")).toBeInTheDocument();
    expect(screen.getByText("Recently Resolved Tickets (Max 5)")).toBeInTheDocument();

    // Ticket rows in recent tickets
    expect(screen.getByText("TKT-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Broken laptop display")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-0002")).toBeInTheDocument();
    expect(screen.getByText("Need VPN software license")).toBeInTheDocument();

    // Ticket in recently resolved
    expect(screen.getByText("TKT-2026-0003")).toBeInTheDocument();
    expect(screen.getByText("Password reset for email")).toBeInTheDocument();

    // Quick Actions
    expect(screen.getByRole("link", { name: /Create Ticket Submit a new service desk request/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View My Tickets Track and review existing requests/i })).toBeInTheDocument();
  });

  // --- Network Error & Retry ---
  it("renders error alert with retry button when API fails and successfully reloads on retry", async () => {
    const fetchSpy = setupFetch(null, true, "Database timeout");
    renderDashboard();

    expect(await screen.findByText(/Error loading dashboard:/i)).toBeInTheDocument();
    expect(screen.getByText(/Database timeout/i)).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();

    // Change mock to success and click retry
    fetchSpy.mockImplementation((url: RequestInfo | URL) => {
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
          json: async () => ({
            success: true,
            data: mockPopulatedDashboardData,
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText("My Open Tickets")).toBeInTheDocument();
    });
  });

  // --- Role boundary guard ---
  it("renders 403 Forbidden screen when a non-requester user accesses RequesterDashboard directly", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: { ...mockRequesterUser, role: "IT_STAFF" },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/requester")) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({
            success: false,
            error: { code: "FORBIDDEN", message: "Only Requesters are permitted." },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderDashboard();

    expect(await screen.findByText("403 Forbidden")).toBeInTheDocument();
    expect(
      screen.getByText(/Only Requesters are permitted to access the Requester Dashboard/i)
    ).toBeInTheDocument();
  });
});
