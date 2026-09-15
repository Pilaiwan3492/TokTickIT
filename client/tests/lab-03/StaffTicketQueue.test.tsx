import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import StaffTicketQueue from "../../src/pages/StaffTicketQueue";

const mockStaffUser = {
  id: "usr-staff-1",
  name: "Samuel Staff",
  email: "staff.queue@toktickit.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockTickets = [
  {
    id: "tkt-1",
    ticketNo: "TKT-2026-0001",
    summary: "Core router disconnected",
    category: { id: 1, name: "Network" },
    requestedPriority: "URGENT",
    itPriority: "URGENT",
    status: "NEW",
    currentStatus: "NEW",
    isRequesterResolved: false,
    requester: { id: "req-1", name: "Rachel Requester", email: "rachel@example.com" },
    owner: null,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "tkt-2",
    ticketNo: "TKT-2026-0002",
    summary: "VPN access token expired",
    category: { id: 1, name: "Network" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    status: "OPEN",
    currentStatus: "OPEN",
    isRequesterResolved: false,
    requester: { id: "req-1", name: "Rachel Requester", email: "rachel@example.com" },
    owner: { id: "usr-staff-1", name: "Samuel Staff", role: "IT_STAFF" },
    createdAt: "2026-09-02T11:00:00.000Z",
    updatedAt: "2026-09-02T11:00:00.000Z",
  },
];

const mockPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 2,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe("IT Staff Ticket Queue UI Tests (Lab 3 — Issue 26: UI-13..UI-18)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-staff-token");
  });

  const renderQueue = () =>
    render(
      <MemoryRouter initialEntries={["/queue"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue" element={<StaffTicketQueue />} />
            <Route path="/queue/:id" element={<div>Staff Ticket Detail View</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

  // --- UI-13: Desktop table render ---
  it("UI-13: renders ticket queue desktop table with columns, badges, and owner", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTickets, pagination: mockPagination }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderQueue();

    // 1. Wait for tickets to load
    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-0001").length).toBeGreaterThan(0);
      expect(screen.getAllByText("TKT-2026-0002").length).toBeGreaterThan(0);
    });

    // 2. Header and counter
    expect(screen.getByRole("heading", { name: /Ticket Queue/i })).toBeInTheDocument();
    expect(screen.getByText(/Showing 1 to 2 of 2 tickets/i)).toBeInTheDocument();

    // 3. Summaries and categories
    expect(screen.getAllByText("Core router disconnected")[0]).toBeInTheDocument();
    expect(screen.getAllByText("VPN access token expired")[0]).toBeInTheDocument();

    // 4. Badges (Priority & Status)
    expect(screen.getAllByText("Urgent")[0]).toBeInTheDocument();
    expect(screen.getAllByText("New")[0]).toBeInTheDocument();
    expect(screen.getAllByText("High")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Open")[0]).toBeInTheDocument();

    // 5. Owners (Unassigned & Staff Name)
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Samuel Staff")[0]).toBeInTheDocument();
  });

  // --- UI-14: Ticket Queue search box input ---
  it("UI-14: debounced search triggers API reload with query parameter", async () => {
    let capturedSearchQuery = "";

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedSearchQuery = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [mockTickets[0]], pagination: { ...mockPagination, totalItems: 1 } }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-0001").length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search by ticket number/i);
    fireEvent.change(searchInput, { target: { value: "Core router" } });

    await waitFor(() => {
      expect(capturedSearchQuery).toContain("search=Core+router");
    });
  });

  // --- UI-15: Status and Priority filter dropdowns ---
  it("UI-15: selecting status and priority filters updates API parameters", async () => {
    let capturedFilterUrl = "";

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedFilterUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTickets, pagination: mockPagination }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-0001").length).toBeGreaterThan(0);
    });

    // Select Status: OPEN
    const statusSelect = screen.getByLabelText(/Filter by status/i);
    fireEvent.change(statusSelect, { target: { value: "OPEN" } });

    await waitFor(() => {
      expect(capturedFilterUrl).toContain("status=OPEN");
    });

    // Select Priority: HIGH
    const prioritySelect = screen.getByLabelText(/Filter by priority/i);
    fireEvent.change(prioritySelect, { target: { value: "HIGH" } });

    await waitFor(() => {
      expect(capturedFilterUrl).toContain("priority=HIGH");
    });
  });

  // --- UI-16: Ownership filter buttons ---
  it("UI-16: toggling ownership filters queue scope by Unassigned and Assigned to Me", async () => {
    let capturedOwnershipUrl = "";

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedOwnershipUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTickets, pagination: mockPagination }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderQueue();

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-0001").length).toBeGreaterThan(0);
    });

    // Click Unassigned button
    const unassignedBtn = screen.getByRole("button", { name: /^Unassigned$/i });
    fireEvent.click(unassignedBtn);

    await waitFor(() => {
      expect(capturedOwnershipUrl).toContain("ownership=UNASSIGNED");
    });

    // Click Assigned to Me button
    const mineBtn = screen.getByRole("button", { name: /^Assigned to Me$/i });
    fireEvent.click(mineBtn);

    await waitFor(() => {
      expect(capturedOwnershipUrl).toContain("ownership=ASSIGNED_TO_ME");
    });
  });

  // --- UI-17: Pagination bar navigation ---
  it("UI-17: pagination controls reload page with correct offset", async () => {
    let capturedPageUrl = "";

    const multiPagePagination = {
      page: 1,
      pageSize: 10,
      totalItems: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    };

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        capturedPageUrl = urlStr;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTickets, pagination: multiPagePagination }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderQueue();

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    });

    // Click Next button
    const nextBtn = screen.getByRole("button", { name: /Next Page/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(capturedPageUrl).toContain("page=2");
    });
  });

  // --- UI-18: Empty and no search results states ---
  it("UI-18: displays clear feedback when queue has no items or no search matches", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: [],
            pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderQueue();

    await waitFor(() => {
      expect(screen.getByText(/No tickets currently in the queue/i)).toBeInTheDocument();
    });
  });
});
