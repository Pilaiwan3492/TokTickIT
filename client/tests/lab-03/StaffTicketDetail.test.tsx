import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import { StaffTicketDetail } from "../../src/pages/StaffTicketDetail";

const mockStaffUser = {
  id: "usr-staff-1",
  name: "Alex IT Staff",
  email: "alex@toktickit.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockAssignees = [
  { id: "usr-staff-1", name: "Alex IT Staff", email: "alex@toktickit.com", role: "IT_STAFF" as const, isActive: true },
  { id: "usr-staff-2", name: "Bob IT Staff", email: "bob@toktickit.com", role: "IT_STAFF" as const, isActive: true },
  { id: "usr-admin-1", name: "Sara Admin", email: "sara@toktickit.com", role: "ADMIN" as const, isActive: true },
];

const createBaseTicket = (overrides = {}) => ({
  id: "tkt-staff-100",
  ticketNo: "TKT-2026-000100",
  summary: "Network connectivity issue in building 3",
  description: "Switch port 12 is flapping constantly.",
  requestedPriority: "LOW" as const,
  itPriority: "MEDIUM" as const,
  status: "NEW" as const,
  currentStatus: "NEW" as const,
  ownerId: null,
  owner: null,
  requesterId: "usr-req-1",
  requester: { id: "usr-req-1", name: "Jane Requester", email: "jane@example.com" },
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 2, name: "Campus Network" },
  isRequesterResolved: false,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  comments: [
    {
      id: "cmt-1",
      ticketId: "tkt-staff-100",
      content: "Can you specify the room number?",
      createdAt: "2026-09-01T10:30:00.000Z",
      author: { id: "usr-staff-1", name: "Alex IT Staff", role: "IT_STAFF" as const },
    },
  ],
  notes: [
    {
      id: "note-1",
      ticketId: "tkt-staff-100",
      content: "Checked Cisco switch logs; port 12 CRC errors increasing.",
      createdAt: "2026-09-01T11:00:00.000Z",
      author: { id: "usr-staff-1", name: "Alex IT Staff", role: "IT_STAFF" as const },
    },
  ],
  attachments: [],
  ...overrides,
});

const renderStaffTicketDetail = (ticketId = "tkt-staff-100") => {
  return render(
    <MemoryRouter initialEntries={[`/queue/${ticketId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/queue/:id" element={<StaffTicketDetail />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Staff Ticket Detail Tests (Lab 3 — Issue 26: UI-19..UI-21, UI-23)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-staff-jwt-token");
  });

  // --- UI-19a: Claim button appears when unassigned and sets owner ---
  it("UI-19a: Claim Ticket button claims unassigned ticket and updates owner", async () => {
    let capturedAssignmentBody: any = null;
    const initialTicket = createBaseTicket({ ownerId: null, owner: null });

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAssignees }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100/assignment") && init?.method === "PATCH") {
        capturedAssignmentBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...initialTicket,
              ownerId: mockStaffUser.id,
              owner: mockStaffUser,
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderStaffTicketDetail();

    // Verify claim button is rendered
    const claimBtn = await screen.findByRole("button", { name: /Claim Ticket/i });
    expect(claimBtn).toBeInTheDocument();

    fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(capturedAssignmentBody).toEqual({ ownerId: "me" });
      // After claiming, Claim button disappears
      expect(screen.queryByRole("button", { name: /Claim Ticket/i })).not.toBeInTheDocument();
    });

    // Owner select should now reflect Alex IT Staff
    const ownerSelect = screen.getByLabelText(/Assign Ticket Owner/i) as HTMLSelectElement;
    expect(ownerSelect.value).toBe(mockStaffUser.id);
  });

  // --- UI-19b: Reassigning ticket owner via dropdown ---
  it("UI-19b: selecting an owner from the dropdown triggers reassignment PATCH", async () => {
    let capturedAssignmentBody: any = null;
    const initialTicket = createBaseTicket({
      ownerId: mockStaffUser.id,
      owner: mockStaffUser,
    });

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAssignees }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100/assignment") && init?.method === "PATCH") {
        capturedAssignmentBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...initialTicket,
              ownerId: "usr-staff-2",
              owner: mockAssignees[1],
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderStaffTicketDetail();

    const ownerSelect = (await screen.findByLabelText(/Assign Ticket Owner/i)) as HTMLSelectElement;
    expect(ownerSelect.value).toBe(mockStaffUser.id);

    // Reassign to Bob IT Staff
    fireEvent.change(ownerSelect, { target: { value: "usr-staff-2" } });

    await waitFor(() => {
      expect(capturedAssignmentBody).toEqual({ ownerId: "usr-staff-2" });
    });
  });

  // --- UI-20: Updating IT Priority ---
  it("UI-20: changing IT Priority sends PATCH and leaves requested priority unchanged", async () => {
    let capturedPriorityBody: any = null;
    const initialTicket = createBaseTicket();

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAssignees }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100/priority") && init?.method === "PATCH") {
        capturedPriorityBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...initialTicket,
              itPriority: "URGENT",
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderStaffTicketDetail();

    // Verify requested priority is displayed
    expect(await screen.findByText(/IT Priority \(Req: LOW\)/i)).toBeInTheDocument();

    const prioritySelect = (await screen.findByLabelText(/Update IT Priority/i)) as HTMLSelectElement;
    expect(prioritySelect.value).toBe("MEDIUM");

    // Change to URGENT
    fireEvent.change(prioritySelect, { target: { value: "URGENT" } });

    await waitFor(() => {
      expect(capturedPriorityBody).toEqual({ itPriority: "URGENT" });
      expect(prioritySelect.value).toBe("URGENT");
      // Requested Priority remains LOW
      expect(screen.getByText(/IT Priority \(Req: LOW\)/i)).toBeInTheDocument();
    });
  });

  // --- UI-21: Status transition matrix enforcement ---
  it("UI-21a: status select only offers valid transitions per BR-16 matrix and updates status", async () => {
    let capturedStatusBody: any = null;
    const initialTicket = createBaseTicket({ currentStatus: "NEW", status: "NEW" });

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAssignees }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100/status") && init?.method === "PATCH") {
        capturedStatusBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...initialTicket,
              status: "OPEN",
              currentStatus: "OPEN",
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderStaffTicketDetail();

    const statusSelect = (await screen.findByLabelText(/Transition Ticket Status/i)) as HTMLSelectElement;

    // In NEW status, only OPEN and CANCELLED transitions are permitted
    const options = Array.from(statusSelect.options).map((opt) => opt.value);
    expect(options).toContain("NEW"); // Current (disabled)
    expect(options).toContain("OPEN");
    expect(options).toContain("CANCELLED");
    expect(options).not.toContain("IN_PROGRESS");
    expect(options).not.toContain("RESOLVED");
    expect(options).not.toContain("CLOSED");

    // Transition to OPEN
    fireEvent.change(statusSelect, { target: { value: "OPEN" } });

    await waitFor(() => {
      expect(capturedStatusBody).toEqual({ status: "OPEN" });
      expect(statusSelect.value).toBe("OPEN");
    });
  });

  it("UI-21b: terminal status (CLOSED, CANCELLED) disables status transitions", async () => {
    const closedTicket = createBaseTicket({ currentStatus: "CLOSED", status: "CLOSED" });

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAssignees }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: closedTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderStaffTicketDetail();

    const statusSelect = (await screen.findByLabelText(/Transition Ticket Status/i)) as HTMLSelectElement;
    expect(statusSelect).toBeDisabled();
    expect(screen.getByText(/Terminal status. No further transitions permitted./i)).toBeInTheDocument();
  });

  // --- UI-23: Internal Notes tab with amber distinction styling ---
  it("UI-23: displays amber distinction banner, internal notes list, and submits new note", async () => {
    let capturedNoteBody: any = null;
    const initialTicket = createBaseTicket();

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAssignees }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets/tkt-staff-100/notes") && init?.method === "POST") {
        capturedNoteBody = JSON.parse(init.body as string);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "note-2",
              ticketId: "tkt-staff-100",
              content: capturedNoteBody.content,
              createdAt: "2026-09-01T11:45:00.000Z",
              author: mockStaffUser,
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderStaffTicketDetail();

    // Click "Internal Notes" tab
    const notesTab = await screen.findByRole("tab", { name: /Internal Notes/i });
    fireEvent.click(notesTab);

    // Verify amber distinction banner (UI-23, BR-07, BR-25)
    expect(
      screen.getByText(/Internal Notes are private and never visible to the ticket Requester/i)
    ).toBeInTheDocument();

    // Verify existing note is displayed
    expect(screen.getByText(/Checked Cisco switch logs; port 12 CRC errors increasing/i)).toBeInTheDocument();

    // Type new internal note
    const noteTextarea = screen.getByPlaceholderText(/Write an internal operational note/i);
    fireEvent.change(noteTextarea, { target: { value: "Replacing patch cable in telecom closet B." } });

    // Submit note form
    const submitBtn = screen.getByRole("button", { name: /Add Internal Note/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(capturedNoteBody).toEqual({ content: "Replacing patch cable in telecom closet B." });
      // New note rendered in the list
      expect(screen.getByText(/Replacing patch cable in telecom closet B./i)).toBeInTheDocument();
    });
  });
});
