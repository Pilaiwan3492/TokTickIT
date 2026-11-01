import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import StaffDashboard from "../../src/pages/StaffDashboard";
import { StaffTicketQueue } from "../../src/pages/StaffTicketQueue";

const mockStaffUser = {
  id: "usr-staff-1",
  name: "Michael Staff",
  email: "michael.staff@toktickit.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockAdminUser = {
  id: "usr-admin-1",
  name: "Sarah Administrator",
  email: "sarah.admin@toktickit.com",
  role: "ADMIN" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockStaffDashboardData = {
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
    {
      id: "tkt-102",
      ticketNumber: "TKT-2026-0102",
      title: "Active Directory account locked",
      status: "IN_PROGRESS",
      priority: "HIGH",
      owner: { id: "usr-staff-1", name: "Michael Staff" },
      updatedAt: "2026-10-12T08:00:00.000Z",
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

const mockAdminDashboardData = {
  ...mockStaffDashboardData,
  staffName: "Sarah Administrator",
  role: "ADMIN" as const,
  userStats: {
    activeUsers: 42,
    activeStaff: 8,
    activeAdmins: 2,
  },
};

const mockQueueTicketsResponse = {
  data: [
    {
      id: "tkt-new-001",
      ticketNo: "TKT-2026-0001",
      summary: "Core router disconnected in server room",
      category: { id: 1, name: "Network" },
      requestedPriority: "URGENT" as const,
      itPriority: "URGENT" as const,
      status: "NEW" as const,
      currentStatus: "NEW" as const,
      isRequesterResolved: false,
      requester: { id: "req-1", name: "Rachel Requester", email: "rachel@example.com" },
      owner: null,
      createdAt: "2026-10-12T07:15:00.000Z",
      updatedAt: "2026-10-12T07:15:00.000Z",
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname + location.search}</div>;
}

describe("IT Staff & Admin Dashboard UI Tests (Lab 4 — Issue 37: UI-18..UI-20, UI-22..UI-25)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-staff-token");
  });

  const setupFetch = (userData: any, dashboardData: any, isError = false, errorMessage = "Server failure") => {
    return vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: userData }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
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

  const renderDashboard = (initialRoute = "/dashboard") =>
    render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <StaffDashboard />
          <LocationDisplay />
        </AuthProvider>
      </MemoryRouter>
    );

  // --- UI-18: Staff Dashboard renders 6 primary operational metric cards ---
  it("UI-18: renders 6 primary operational metric cards (New, Open, In Progress, Waiting Req, My Assigned, Unassigned)", async () => {
    setupFetch(mockStaffUser, mockStaffDashboardData);
    renderDashboard();

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();
    expect(screen.getByText(/Here's what's happening with your queue today/i)).toBeInTheDocument();

    // 6 Operational Cards verified within each card container
    const newCard = screen.getByRole("link", { name: /View all new tickets/i }).closest(".card") as HTMLElement;
    expect(within(newCard).getByText("New")).toBeInTheDocument();
    expect(within(newCard).getByText("4")).toBeInTheDocument();

    const openCard = screen.getByRole("link", { name: /View all open tickets/i }).closest(".card") as HTMLElement;
    expect(within(openCard).getByText("Open")).toBeInTheDocument();
    expect(within(openCard).getByText("6")).toBeInTheDocument();

    const inProgressCard = screen.getByRole("link", { name: /View all in-progress tickets/i }).closest(".card") as HTMLElement;
    expect(within(inProgressCard).getByText("In Progress")).toBeInTheDocument();
    expect(within(inProgressCard).getByText("3")).toBeInTheDocument();

    const waitingCard = screen.getByRole("link", { name: /View all waiting for requester tickets/i }).closest(".card") as HTMLElement;
    expect(within(waitingCard).getByText("Waiting Req")).toBeInTheDocument();
    expect(within(waitingCard).getByText("2")).toBeInTheDocument();

    const myAssignedCard = screen.getByRole("link", { name: /View my assigned tickets/i }).closest(".card") as HTMLElement;
    expect(within(myAssignedCard).getByText("My Assigned")).toBeInTheDocument();
    expect(within(myAssignedCard).getByText("5")).toBeInTheDocument();

    const unassignedCard = screen.getByRole("link", { name: /View unassigned tickets/i }).closest(".card") as HTMLElement;
    expect(within(unassignedCard).getByText("Unassigned")).toBeInTheDocument();
    expect(within(unassignedCard).getByText("7")).toBeInTheDocument();
  });

  // --- UI-19: Staff Dashboard renders Priority Attention strip and My Recent Actions ---
  it("UI-19: renders Priority Attention strip and My Recent Actions with follow-up badges", async () => {
    setupFetch(mockStaffUser, mockStaffDashboardData);
    renderDashboard();

    // Priority Attention Strip
    expect(await screen.findByText(/Attention Required:/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgent: 1 tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/High Priority: 3 tickets/i)).toBeInTheDocument();

    // My Recent Actions
    const actionsPanel = screen.getByText(/My Recent Actions Taken \(Performed by You\)/i).closest(".card") as HTMLElement;
    expect(within(actionsPanel).getByText("TKT-2026-0102")).toBeInTheDocument();
    expect(within(actionsPanel).getByText(/Verified user identity and unlocked AD account/i)).toBeInTheDocument();
    expect(within(actionsPanel).getByText(/Follow-up required/i)).toBeInTheDocument();
  });

  // --- UI-20: Admin view renders System User Metrics panel ---
  it("UI-20: Admin view renders System User Metrics panel with Active Users, Staff, and Admins", async () => {
    setupFetch(mockAdminUser, mockAdminDashboardData);
    renderDashboard();

    expect(await screen.findByText(/Welcome back, Sarah Administrator!/i)).toBeInTheDocument();

    // Admin System Overview Panel
    const adminPanel = screen.getByText(/Admin System Overview/i).closest(".card") as HTMLElement;
    expect(within(adminPanel).getByText(/Active Users:/i)).toBeInTheDocument();
    expect(within(adminPanel).getByText("42")).toBeInTheDocument();

    expect(within(adminPanel).getByText(/Active Staff:/i)).toBeInTheDocument();
    expect(within(adminPanel).getByText("8")).toBeInTheDocument();

    expect(within(adminPanel).getByText(/Active Admins:/i)).toBeInTheDocument();
    expect(within(adminPanel).getByText("2")).toBeInTheDocument();

    // Link to User Management
    const manageLink = screen.getByRole("link", { name: /Manage Users >/i });
    expect(manageLink).toBeInTheDocument();
    expect(manageLink).toHaveAttribute("href", "/admin/users");
  });

  it("UI-20b: IT Staff user does NOT see the Admin System User Metrics panel", async () => {
    setupFetch(mockStaffUser, mockStaffDashboardData);
    renderDashboard();

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Admin System Overview/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Manage Users >/i })).not.toBeInTheDocument();
  });

  // --- UI-22: Clicking Staff metric card navigates to filtered Ticket Queue ---
  it("UI-22: clicking Staff metric card drill-down links routes to /staff/tickets with pre-applied status or ownership filters", async () => {
    setupFetch(mockStaffUser, mockStaffDashboardData);
    renderDashboard();

    expect(await screen.findByRole("link", { name: /View all new tickets/i })).toBeInTheDocument();

    // New tickets link
    const newLink = screen.getByRole("link", { name: /View all new tickets/i });
    expect(newLink).toHaveAttribute("href", "/staff/tickets?status=NEW");
    fireEvent.click(newLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/staff/tickets?status=NEW");

    // Open tickets link
    const openLink = screen.getByRole("link", { name: /View all open tickets/i });
    expect(openLink).toHaveAttribute("href", "/staff/tickets?status=OPEN");
    fireEvent.click(openLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/staff/tickets?status=OPEN");

    // My Assigned link
    const myAssignedLink = screen.getByRole("link", { name: /View my assigned tickets/i });
    expect(myAssignedLink).toHaveAttribute("href", "/staff/tickets?ownership=assigned_to_me");
    fireEvent.click(myAssignedLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/staff/tickets?ownership=assigned_to_me");

    // Unassigned link
    const unassignedLink = screen.getByRole("link", { name: /View unassigned tickets/i });
    expect(unassignedLink).toHaveAttribute("href", "/staff/tickets?ownership=unassigned");
    fireEvent.click(unassignedLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/staff/tickets?ownership=unassigned");

    // Urgent priority link in strip
    const urgentLink = screen.getByRole("link", { name: /View urgent priority tickets/i });
    expect(urgentLink).toHaveAttribute("href", "/staff/tickets?priority=URGENT");
    fireEvent.click(urgentLink);
    expect(screen.getByTestId("location-display")).toHaveTextContent("/staff/tickets?priority=URGENT");
  });

  // --- UI-22-INT: End-to-end drill-down integration into StaffTicketQueue ---
  it("UI-22-INT: clicking Staff metric card drill-down navigates to StaffTicketQueue and pre-applies status filter", async () => {
    let capturedQueueUrl = "";
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
          json: async () => ({
            success: true,
            data: mockStaffDashboardData,
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedQueueUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockQueueTicketsResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTicketQueue />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Dashboard rendered
    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();

    // Click "New" drill-down link
    const newTicketsLink = screen.getByRole("link", { name: /View all new tickets/i });
    fireEvent.click(newTicketsLink);

    // Destination page loaded and triggered API with status=NEW
    await waitFor(() => {
      expect(capturedQueueUrl).toContain("status=NEW");
    });

    // The status select dropdown on StaffTicketQueue should be pre-set to "NEW"
    const statusSelect = (await screen.findByLabelText("Filter by status")) as HTMLSelectElement;
    expect(statusSelect.value).toBe("NEW");

    // The filtered ticket should be rendered on the destination queue table/cards
    expect(screen.getAllByText("TKT-2026-0001")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Core router disconnected in server room")[0]).toBeInTheDocument();
  });

  it("UI-22-INT-priority: clicking Urgent drill-down routes to StaffTicketQueue with priority=URGENT pre-applied", async () => {
    let capturedQueueUrl = "";
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
          json: async () => ({
            success: true,
            data: mockStaffDashboardData,
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedQueueUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockQueueTicketsResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTicketQueue />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();

    const urgentLink = screen.getByRole("link", { name: /View urgent priority tickets/i });
    fireEvent.click(urgentLink);

    await waitFor(() => {
      expect(capturedQueueUrl).toContain("priority=URGENT");
    });

    const prioritySelect = (await screen.findByLabelText("Filter by priority")) as HTMLSelectElement;
    expect(prioritySelect.value).toBe("URGENT");
  });

  it("UI-22-INT-ownership: clicking My Assigned drill-down routes to StaffTicketQueue with ownership=ASSIGNED_TO_ME pre-applied", async () => {
    let capturedQueueUrl = "";
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
          json: async () => ({
            success: true,
            data: mockStaffDashboardData,
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedQueueUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockQueueTicketsResponse,
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTicketQueue />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();

    const myAssignedLink = screen.getByRole("link", { name: /View my assigned tickets/i });
    fireEvent.click(myAssignedLink);

    await waitFor(() => {
      expect(capturedQueueUrl).toContain("ownership=ASSIGNED_TO_ME");
    });

    const assignedButton = await screen.findByRole("button", { name: "Assigned to Me" });
    expect(assignedButton.className).toContain("btn-success");
  });

  // --- UI-22-INT-COUNTS: Data consistency - metric card count equals filtered ticket count in Queue ---
  it("UI-22-INT-count-status: verifies Status metric count on card strictly equals filtered tickets in Queue", async () => {
    const expectedCount = 4;
    const dummyNewTickets = Array.from({ length: expectedCount }, (_, i) => ({
      id: `tkt-new-${i + 1}`,
      ticketNo: `TKT-2026-N00${i + 1}`,
      summary: `Network outage incident #${i + 1}`,
      category: { id: 1, name: "Network" },
      requestedPriority: "MEDIUM" as const,
      itPriority: "MEDIUM" as const,
      status: "NEW" as const,
      currentStatus: "NEW" as const,
      isRequesterResolved: false,
      requester: { id: `req-${i + 1}`, name: `Requester ${i + 1}`, email: `user${i + 1}@example.com` },
      owner: null,
      createdAt: "2026-10-12T07:15:00.000Z",
      updatedAt: "2026-10-12T07:15:00.000Z",
    }));

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: mockStaffUser }) } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...mockStaffDashboardData,
              metrics: { ...mockStaffDashboardData.metrics, newCount: expectedCount },
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: dummyNewTickets,
            pagination: {
              page: 1,
              pageSize: 10,
              totalItems: expectedCount,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTicketQueue />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // 1. Locate metric card on Dashboard and extract its count
    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();
    const newCard = screen.getByRole("link", { name: /View all new tickets/i }).closest(".card")! as HTMLElement;
    const cardCount = Number(within(newCard).getByText(String(expectedCount)).textContent);
    expect(cardCount).toBe(expectedCount);

    // 2. Click drill-down
    fireEvent.click(screen.getByRole("link", { name: /View all new tickets/i }));

    // 3. Verify destination Queue displays matching total count and rows
    expect(await screen.findByText(new RegExp(`Showing 1 to ${expectedCount} of ${expectedCount} tickets`, "i"))).toBeInTheDocument();
    const tableRows = within(screen.getByRole("table")).getAllByRole("row");
    expect(tableRows.length - 1).toBe(cardCount);
  });

  it("UI-22-INT-count-assigned: verifies My Assigned metric count on card strictly equals filtered tickets in Queue", async () => {
    const expectedAssignedCount = 3;
    const dummyAssignedTickets = Array.from({ length: expectedAssignedCount }, (_, i) => ({
      id: `tkt-assigned-${i + 1}`,
      ticketNo: `TKT-2026-A00${i + 1}`,
      summary: `Assigned task #${i + 1}`,
      category: { id: 2, name: "Hardware" },
      requestedPriority: "HIGH" as const,
      itPriority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      currentStatus: "IN_PROGRESS" as const,
      isRequesterResolved: false,
      requester: { id: "req-1", name: "Rachel Requester", email: "rachel@example.com" },
      owner: { id: mockStaffUser.id, name: mockStaffUser.name },
      createdAt: "2026-10-12T07:15:00.000Z",
      updatedAt: "2026-10-12T07:15:00.000Z",
    }));

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: mockStaffUser }) } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...mockStaffDashboardData,
              metrics: { ...mockStaffDashboardData.metrics, myAssignedCount: expectedAssignedCount },
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: dummyAssignedTickets,
            pagination: {
              page: 1,
              pageSize: 10,
              totalItems: expectedAssignedCount,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTicketQueue />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();
    const assignedCard = screen.getByRole("link", { name: /View my assigned tickets/i }).closest(".card")! as HTMLElement;
    const cardCount = Number(within(assignedCard).getByText(String(expectedAssignedCount)).textContent);
    expect(cardCount).toBe(expectedAssignedCount);

    fireEvent.click(screen.getByRole("link", { name: /View my assigned tickets/i }));

    expect(await screen.findByText(new RegExp(`Showing 1 to ${expectedAssignedCount} of ${expectedAssignedCount} tickets`, "i"))).toBeInTheDocument();
    const tableRows = within(screen.getByRole("table")).getAllByRole("row");
    expect(tableRows.length - 1).toBe(cardCount);
  });

  it("UI-22-INT-count-unassigned: verifies Unassigned metric count on card strictly equals filtered tickets in Queue", async () => {
    const expectedUnassignedCount = 2;
    const dummyUnassignedTickets = Array.from({ length: expectedUnassignedCount }, (_, i) => ({
      id: `tkt-unassigned-${i + 1}`,
      ticketNo: `TKT-2026-U00${i + 1}`,
      summary: `Unassigned backlog #${i + 1}`,
      category: { id: 3, name: "Access" },
      requestedPriority: "LOW" as const,
      itPriority: "LOW" as const,
      status: "OPEN" as const,
      currentStatus: "OPEN" as const,
      isRequesterResolved: false,
      requester: { id: "req-1", name: "Rachel Requester", email: "rachel@example.com" },
      owner: null,
      createdAt: "2026-10-12T07:15:00.000Z",
      updatedAt: "2026-10-12T07:15:00.000Z",
    }));

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ data: mockStaffUser }) } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...mockStaffDashboardData,
              metrics: { ...mockStaffDashboardData.metrics, unassignedCount: expectedUnassignedCount },
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: dummyUnassignedTickets,
            pagination: {
              page: 1,
              pageSize: 10,
              totalItems: expectedUnassignedCount,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTicketQueue />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Welcome back, Michael Staff!/i)).toBeInTheDocument();
    const unassignedCard = screen.getByRole("link", { name: /View unassigned tickets/i }).closest(".card")! as HTMLElement;
    const cardCount = Number(within(unassignedCard).getByText(String(expectedUnassignedCount)).textContent);
    expect(cardCount).toBe(expectedUnassignedCount);

    fireEvent.click(screen.getByRole("link", { name: /View unassigned tickets/i }));

    expect(await screen.findByText(new RegExp(`Showing 1 to ${expectedUnassignedCount} of ${expectedUnassignedCount} tickets`, "i"))).toBeInTheDocument();
    const tableRows = within(screen.getByRole("table")).getAllByRole("row");
    expect(tableRows.length - 1).toBe(cardCount);
  });

  // --- UI-23: Non-staff user attempting to access /dashboard as staff ---
  it("UI-23: renders 403 Forbidden alert when a Requester attempts to access StaffDashboard", async () => {
    const requesterUser = {
      id: "usr-requester-99",
      name: "Norman NonStaff",
      email: "norman@example.com",
      role: "REQUESTER" as const,
      isActive: true,
      mustChangePassword: false,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: requesterUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/dashboard/staff")) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only IT Staff and Administrators are permitted to access the Staff Dashboard.",
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderDashboard();

    expect(await screen.findByText("403 Forbidden")).toBeInTheDocument();
    expect(
      screen.getByText(/Only IT Staff and Administrators are permitted to access the Staff Dashboard/i)
    ).toBeInTheDocument();
  });

  // --- UI-24: Unauthenticated user accessing /dashboard redirects to /login ---
  it("UI-24: unauthenticated user accessing protected dashboard route redirects to /login", async () => {
    localStorage.clear();

    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: "SESSION_INVALID", message: "Token missing" },
        }),
      } as Response)
    );

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["IT_STAFF", "ADMIN"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Redirected</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("Login Page Redirected")).toBeInTheDocument();
  });

  // --- UI-25: Network error banner renders on dashboard fetch failure ---
  it("UI-25: renders error alert banner with retry button on network failure and recovers on retry", async () => {
    const fetchSpy = setupFetch(mockStaffUser, null, true, "Network connection error");
    renderDashboard();

    expect(await screen.findByText(/Error loading dashboard:/i)).toBeInTheDocument();
    expect(screen.getByText(/Network connection error/i)).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();

    // Now restore connection
    fetchSpy.mockImplementation((url: RequestInfo | URL) => {
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
          json: async () => ({
            success: true,
            data: mockStaffDashboardData,
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /View all new tickets/i })).toBeInTheDocument();
    });

    const newCard = screen.getByRole("link", { name: /View all new tickets/i }).closest(".card") as HTMLElement;
    expect(within(newCard).getByText("New")).toBeInTheDocument();
    expect(within(newCard).getByText("4")).toBeInTheDocument();
  });

  // --- Quick Actions ---
  it("renders valid Staff Quick Actions controls (Unassigned Queue, Search Tickets, My Assigned Queue) and excludes Create Ticket", async () => {
    setupFetch(mockStaffUser, mockStaffDashboardData);
    renderDashboard();

    expect(await screen.findByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Unassigned Queue/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Search Tickets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /My Assigned Queue/i })).toBeInTheDocument();

    // In accordance with TokTickIT RBAC invariants, IT Staff/Admin cannot create tickets
    expect(screen.queryByRole("link", { name: /Create Ticket/i })).not.toBeInTheDocument();
  });
});
