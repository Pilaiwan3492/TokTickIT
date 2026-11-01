import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import { StaffTicketDetail } from "../../src/pages/StaffTicketDetail";
import TicketDetail from "../../src/pages/TicketDetail";

const mockStaffUser = {
  id: "usr-staff-1",
  name: "Alex IT Staff",
  email: "alex@toktickit.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockRequesterUser = {
  id: "usr-req-1",
  name: "Bob Smith",
  email: "bob@example.com",
  role: "REQUESTER" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockAssignees = [
  { id: "usr-staff-1", name: "Alex IT Staff", email: "alex@toktickit.com", role: "IT_STAFF" as const, isActive: true },
  { id: "usr-staff-2", name: "Bob IT Staff", email: "bob@toktickit.com", role: "IT_STAFF" as const, isActive: true },
];

const createTicketWithStatus = (status: string, overrides = {}) => ({
  id: "tkt-flow-100",
  ticketNo: "TKT-2026-000100",
  summary: "VPN Connection issues",
  description: "Detailed description of network timeout.",
  requestedPriority: "MEDIUM" as const,
  itPriority: "HIGH" as const,
  status,
  currentStatus: status,
  ownerId: "usr-staff-1",
  owner: mockStaffUser,
  requesterId: "usr-req-1",
  requester: mockRequesterUser,
  category: { id: 1, name: "Network" },
  relatedSystem: { id: 2, name: "VPN" },
  isRequesterResolved: false,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  comments: [],
  notes: [],
  attachments: [],
  actionsTaken: [],
  ...overrides,
});

describe("Ticket Workflow & Status Transitions (Lab 4 — UI-09..UI-15)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "fake-jwt-token");
  });

  // UI-09: Status dropdown displays only permitted next statuses per matrix (AC-08, BR-09, BR-11)
  it("UI-09: Status dropdown displays only permitted next statuses per transition matrix from OPEN", async () => {
    const openTicket = createTicketWithStatus("OPEN");

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockStaffUser }) });
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockAssignees }) });
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: openTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/queue/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox", { name: /transition ticket status/i });
    expect(statusSelect).toBeInTheDocument();

    const options = Array.from(statusSelect.querySelectorAll("option")).map((o) => o.textContent);
    // Permitted next from OPEN: IN_PROGRESS, WAITING_FOR_REQUESTER, CANCELLED
    expect(options.some((t) => t?.includes("In Progress"))).toBe(true);
    expect(options.some((t) => t?.includes("Waiting for Requester"))).toBe(true);
    expect(options.some((t) => t?.includes("Cancelled"))).toBe(true);
    // Not permitted from OPEN
    expect(options.some((t) => t?.includes("Closed"))).toBe(false);
    expect(options.some((t) => t?.includes("Reopened"))).toBe(false);
  });

  // UI-10: Status dropdown excludes invalid transition jumps from NEW (AC-09, BR-09)
  it("UI-10: Status dropdown excludes invalid transition jumps when ticket is in NEW status", async () => {
    const newTicket = createTicketWithStatus("NEW");

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockStaffUser }) });
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockAssignees }) });
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: newTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/queue/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox", { name: /transition ticket status/i });
    const options = Array.from(statusSelect.querySelectorAll("option")).map((o) => o.textContent);

    // Permitted next from NEW: OPEN, CANCELLED
    expect(options.some((t) => t?.includes("Open"))).toBe(true);
    expect(options.some((t) => t?.includes("Cancelled"))).toBe(true);
    // Invalid jumps must be excluded
    expect(options.some((t) => t?.includes("Resolved"))).toBe(false);
    expect(options.some((t) => t?.includes("Closed"))).toBe(false);
    expect(options.some((t) => t?.includes("In Progress"))).toBe(false);
  });

  // UI-11: Requester "Problem Appears Resolved" button action (AC-10, BR-10)
  it("UI-11: Requester can click Problem Appears Resolved to trigger advisory indicator without altering formal status", async () => {
    const requesterTicket = createTicketWithStatus("IN_PROGRESS", { isRequesterResolved: false });

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockRequesterUser }) });
      }
      if (urlStr.includes("/api/v1/tickets/tkt-flow-100/resolve-indicator") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: { ...requesterTicket, isRequesterResolved: true },
          }),
        });
      }
      if (urlStr.includes("/api/v1/tickets/tkt-flow-100/actions-taken")) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      }
      if (urlStr.includes("/api/v1/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: requesterTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    const resolveBtn = await screen.findByRole("button", { name: /problem appears resolved/i });
    expect(resolveBtn).toBeInTheDocument();

    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Problem Appears Resolved \(Confirmed by Requester\)/i)).toBeInTheDocument();
    });
  });

  // UI-12: Requester view hides direct status change controls (AC-11, BR-09)
  it("UI-12: Requester view completely hides direct status change dropdown and staff controls", async () => {
    const requesterTicket = createTicketWithStatus("OPEN");

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockRequesterUser }) });
      }
      if (urlStr.includes("/api/v1/tickets/tkt-flow-100/actions-taken")) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, data: [] }) });
      }
      if (urlStr.includes("/api/v1/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: requesterTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    // Workflow status dropdown must NOT exist in Requester view
    expect(screen.queryByRole("combobox", { name: /transition ticket status/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/assign ticket owner/i)).not.toBeInTheDocument();
  });

  // UI-13: Stale-update conflict banner displayed on HTTP 409 response (AC-12, BR-17)
  it("UI-13: Displays stale-update conflict error toast when status change returns HTTP 409", async () => {
    const inProgressTicket = createTicketWithStatus("IN_PROGRESS");

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockStaffUser }) });
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockAssignees }) });
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-flow-100/status") && init?.method === "PATCH") {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Ticket was modified by another user.",
            },
          }),
        });
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: inProgressTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/queue/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox", { name: /transition ticket status/i });
    fireEvent.change(statusSelect, { target: { value: "WAITING_FOR_REQUESTER" } });

    await waitFor(() => {
      expect(screen.getByText(/Ticket was modified by another user/i)).toBeInTheDocument();
    });
  });

  // UI-14: Ticket detail in CLOSED status displays terminal lock (AC-13, BR-12)
  it("UI-14: Ticket detail in CLOSED status disables status controls with terminal notice", async () => {
    const closedTicket = createTicketWithStatus("CLOSED");

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockStaffUser }) });
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockAssignees }) });
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: closedTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/queue/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox", { name: /transition ticket status/i });
    expect(statusSelect).toBeDisabled();
    expect(screen.getByText(/Terminal status. No further transitions permitted/i)).toBeInTheDocument();
  });

  // UI-15: Status dropdown for RESOLVED ticket displays CLOSED and REOPENED (AC-14, BR-09)
  it("UI-15: Status dropdown for RESOLVED ticket permits transitions exclusively to CLOSED and REOPENED", async () => {
    const resolvedTicket = createTicketWithStatus("RESOLVED");

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockStaffUser }) });
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: mockAssignees }) });
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-flow-100")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: resolvedTicket }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/queue/tkt-flow-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    const statusSelect = screen.getByRole("combobox", { name: /transition ticket status/i });
    const options = Array.from(statusSelect.querySelectorAll("option")).map((o) => o.textContent);

    expect(options.some((t) => t?.includes("Closed"))).toBe(true);
    expect(options.some((t) => t?.includes("Reopened"))).toBe(true);
    expect(options.some((t) => t?.includes("Open"))).toBe(false);
    expect(options.some((t) => t?.includes("In Progress"))).toBe(false);
  });
});
