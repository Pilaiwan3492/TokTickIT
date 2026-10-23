import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import { ActionsTakenList } from "../../src/components/ticket/ActionsTakenList";
import { StaffTicketDetail } from "../../src/pages/StaffTicketDetail";
import TicketDetail from "../../src/pages/TicketDetail";
import { ActionTaken } from "../../src/types/ticket";

const activeStaffUser = {
  id: "usr-staff-active-1",
  name: "Alex IT Staff",
  email: "alex@toktickit.com",
  role: "IT_STAFF" as const,
  isActive: true,
  mustChangePassword: false,
};

const inactiveStaffUser = {
  id: "usr-staff-inactive-1",
  name: "Retired Staff",
  email: "retired@toktickit.com",
  role: "IT_STAFF" as const,
  isActive: false,
  mustChangePassword: false,
};

const activeAdminUser = {
  id: "usr-admin-1",
  name: "Sara Admin",
  email: "sara@toktickit.com",
  role: "ADMIN" as const,
  isActive: true,
  mustChangePassword: false,
};

const requesterUser = {
  id: "usr-requester-1",
  name: "Jane Requester",
  email: "jane@example.com",
  role: "REQUESTER" as const,
  isActive: true,
  mustChangePassword: false,
};

const sampleActions: ActionTaken[] = [
  {
    id: "act-uuid-001",
    ticketId: "tkt-uuid-100",
    actionDate: "2026-09-01T10:15:00.000Z",
    actionDescription: "Inspected core switch port 12 and ran cable diagnostics.",
    result: "Detected high CRC error rate on patch cord; scheduled replacement.",
    performedById: activeStaffUser.id,
    performedBy: {
      id: activeStaffUser.id,
      name: activeStaffUser.name,
      email: activeStaffUser.email,
      role: "IT_STAFF",
    },
    followUpRequired: true,
    followUpNote: "Replace Cat6 patch cable during maintenance window at 18:00.",
    attachmentNotes: "Switch port log attached in ticket files.",
    createdAt: "2026-09-01T10:15:00.000Z",
    updatedAt: "2026-09-01T10:15:00.000Z",
  },
  {
    id: "act-uuid-002",
    ticketId: "tkt-uuid-100",
    actionDate: "2026-09-01T18:30:00.000Z",
    actionDescription: "Replaced Cat6 patch cable and cleared interface counters.",
    result: "Link stable at 1Gbps full duplex with zero packet loss.",
    performedById: activeAdminUser.id,
    performedBy: {
      id: activeAdminUser.id,
      name: activeAdminUser.name,
      email: activeAdminUser.email,
      role: "ADMIN",
    },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-09-01T18:30:00.000Z",
    updatedAt: "2026-09-01T18:30:00.000Z",
  },
];

describe("Lab 4 — Issue 35: Actions Taken Section & Modals (UI-01..UI-08, UI-26)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "valid-jwt-test-token");
  });

  // =========================================================================
  // UI-01: IT Staff views open ticket, clicks "+ Add Action Taken", fills form, submits
  // =========================================================================
  it("UI-01: renders '+ Add Action Taken' button for IT Staff and creates a new Action Taken without page reload", async () => {
    let capturedPostPayload: any = null;

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken") && init?.method === "POST") {
        capturedPostPayload = JSON.parse(String(init.body));
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: "act-uuid-003",
              ticketId: "tkt-uuid-100",
              actionDate: capturedPostPayload.actionDate,
              actionDescription: capturedPostPayload.actionDescription,
              result: capturedPostPayload.result,
              performedById: activeStaffUser.id,
              performedBy: activeStaffUser,
              followUpRequired: capturedPostPayload.followUpRequired,
              followUpNote: capturedPostPayload.followUpNote,
              attachmentNotes: capturedPostPayload.attachmentNotes,
              createdAt: "2026-09-02T09:00:00.000Z",
              updatedAt: "2026-09-02T09:00:00.000Z",
            },
            ticketUpdatedAt: "2026-09-02T09:00:00.000Z",
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={[]}
        currentUser={activeStaffUser}
      />
    );

    // Verify empty state for Staff
    expect(
      screen.getByText(/No actions recorded yet\. Click 'Add Action Taken' to log work done on this ticket\./i)
    ).toBeInTheDocument();

    // Verify "+ Add Action Taken" button is visible and enabled
    const addBtn = screen.getByRole("button", { name: /\+ Add Action Taken/i });
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).not.toBeDisabled();

    // Open modal
    fireEvent.click(addBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Fill out fields
    fireEvent.change(screen.getByLabelText(/Action Description/i), {
      target: { value: "Reset VPN concentrator tunnel for user session" },
    });
    fireEvent.change(screen.getByLabelText(/^Result/i), {
      target: { value: "User successfully re-authenticated and tunnel is active" },
    });
    fireEvent.change(screen.getByLabelText(/Attachment Notes/i), {
      target: { value: "Asset #VPN-GW-02" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    await waitFor(() => {
      expect(capturedPostPayload).not.toBeNull();
      expect(capturedPostPayload.actionDescription).toBe(
        "Reset VPN concentrator tunnel for user session"
      );
      expect(capturedPostPayload.result).toBe(
        "User successfully re-authenticated and tunnel is active"
      );
      expect(capturedPostPayload.attachmentNotes).toBe("Asset #VPN-GW-02");
      expect(capturedPostPayload.expectedTicketUpdatedAt).toBe("2026-09-01T10:00:00.000Z");
    });

    // Modal closes and new entry appears in the list without reload
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByText("Reset VPN concentrator tunnel for user session")
      ).toBeInTheDocument();
      expect(
        screen.getByText("User successfully re-authenticated and tunnel is active")
      ).toBeInTheDocument();
      expect(screen.getByText("Asset #VPN-GW-02")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // UI-01b: "+ Add Action Taken" button disabled if actor is inactive
  // =========================================================================
  it("UI-01b: disables '+ Add Action Taken' button with inactive account tooltip when actor has isActive = false", () => {
    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={sampleActions}
        currentUser={inactiveStaffUser}
      />
    );

    const addBtn = screen.getByRole("button", { name: /\+ Add Action Taken/i });
    expect(addBtn).toBeDisabled();
    expect(addBtn).toHaveAttribute(
      "title",
      expect.stringMatching(/inactive/i)
    );
    expect(screen.getByTestId("inactive-actor-notice")).toHaveTextContent(
      /inactive/i
    );
  });

  // =========================================================================
  // UI-01c: Row "Edit" buttons disabled if actor is inactive
  // =========================================================================
  it("UI-01c: disables row 'Edit' buttons with inactive account tooltip when actor has isActive = false", () => {
    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={sampleActions}
        currentUser={inactiveStaffUser}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    expect(editBtns.length).toBe(2);
    for (const btn of editBtns) {
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("title", expect.stringMatching(/inactive/i));
    }
  });

  // =========================================================================
  // UI-02: Conditional mandatory validation on Follow-Up Note when Follow-Up Required? is checked
  // =========================================================================
  it("UI-02: enforces required Follow-Up Note dynamically when 'Follow-Up Required?' is checked and blocks submission", async () => {
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="OPEN"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={[]}
        currentUser={activeStaffUser}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Action Taken/i }));

    // Initially Follow-Up Note input is not rendered
    expect(screen.queryByLabelText(/Follow-Up Note/i)).not.toBeInTheDocument();

    // Check "Follow-Up Required?"
    const followUpCheckbox = screen.getByLabelText(/Follow-Up Required\?/i);
    fireEvent.click(followUpCheckbox);

    // Follow-Up Note field appears and is marked required
    const followUpNoteInput = screen.getByLabelText(/Follow-Up Note/i);
    expect(followUpNoteInput).toBeInTheDocument();
    expect(followUpNoteInput).toBeRequired();

    // Fill Action Description and Result, but leave Follow-Up Note blank
    fireEvent.change(screen.getByLabelText(/Action Description/i), {
      target: { value: "Applied temporary firewall rule" },
    });
    fireEvent.change(screen.getByLabelText(/^Result/i), {
      target: { value: "Traffic restored temporarily" },
    });

    // Attempt to submit
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    // Inline validation error shown and API is NOT called
    expect(
      await screen.findByText(/Follow-up note is required when follow-up is marked as required/i)
    ).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // =========================================================================
  // UI-03: Form values preserved upon validation error or recoverable API/network error
  // =========================================================================
  it("UI-03: preserves all entered form values upon validation error or recoverable API failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Database connection timed out. Please retry.",
        },
      }),
    } as Response);

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={[]}
        currentUser={activeStaffUser}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Action Taken/i }));

    const longDesc = "Performed deep packet inspection on VLAN 40 trunk interface and captured PCAP trace.";
    const longResult = "Identified broadcast storm originating from misconfigured VoIP phone on port Gi1/0/24.";

    const descInput = screen.getByLabelText(/Action Description/i) as HTMLTextAreaElement;
    const resultInput = screen.getByLabelText(/^Result/i) as HTMLTextAreaElement;

    fireEvent.change(descInput, { target: { value: longDesc } });
    fireEvent.change(resultInput, { target: { value: longResult } });

    // 1. Trigger validation failure first (check Follow-Up Required without note)
    fireEvent.click(screen.getByLabelText(/Follow-Up Required\?/i));
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    expect(descInput.value).toBe(longDesc);
    expect(resultInput.value).toBe(longResult);

    // 2. Fill Follow-Up Note and trigger API 500 failure
    const noteInput = screen.getByLabelText(/Follow-Up Note/i) as HTMLTextAreaElement;
    fireEvent.change(noteInput, { target: { value: "Verify port security with network team tomorrow." } });

    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Database connection timed out\. Please retry\./i)
      ).toBeInTheDocument();
    });

    // Modal stays open and all typed text remains intact
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(descInput.value).toBe(longDesc);
    expect(resultInput.value).toBe(longResult);
    expect(noteInput.value).toBe("Verify port security with network team tomorrow.");
  });

  // =========================================================================
  // UI-04: Modal displays authenticated user as Performer (read-only)
  // =========================================================================
  it("UI-04: displays authenticated user's name and role as read-only in Performed By field", () => {
    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={[]}
        currentUser={activeStaffUser}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Action Taken/i }));

    const dialog = screen.getByRole("dialog");
    const performerInput = within(dialog).getByLabelText(/Performed By/i) as HTMLInputElement;
    expect(performerInput.value).toBe("Alex IT Staff");
    expect(performerInput).toHaveAttribute("readonly");
    expect(performerInput).toBeDisabled();
    expect(within(dialog).getByText("IT Staff")).toBeInTheDocument();
  });

  // =========================================================================
  // UI-05: Chronological list rendering with contributor badges and Amber Follow-up Required pill
  // =========================================================================
  it("UI-05: renders Actions Taken chronologically with contributor badges and Amber Follow-up Required pill", () => {
    // Pass actions in reverse order to verify chronological sorting (actionDate ASC)
    const reversed = [sampleActions[1], sampleActions[0]];

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={reversed}
        currentUser={activeStaffUser}
      />
    );

    const rows = screen.getAllByTestId(/^action-taken-row-/);
    expect(rows.length).toBe(2);

    // Row 0 must be the earlier action (10:15Z - act-uuid-001)
    expect(rows[0]).toHaveAttribute("data-testid", "action-taken-row-act-uuid-001");
    expect(rows[1]).toHaveAttribute("data-testid", "action-taken-row-act-uuid-002");

    // Verify Row 0 displays Amber Follow-up Required pill and followUpNote
    const followUpBadge = within(rows[0]).getByTestId("followup-badge-act-uuid-001");
    expect(followUpBadge).toHaveTextContent(/Follow-up Required/i);
    expect(followUpBadge).toHaveStyle({
      backgroundColor: "#FEF3C7",
      color: "#D97706",
    });
    expect(
      within(rows[0]).getByText(/Replace Cat6 patch cable during maintenance window at 18:00\./i)
    ).toBeInTheDocument();
    expect(within(rows[0]).getByText("Alex IT Staff")).toBeInTheDocument();

    // Verify Row 1 (followUpRequired = false) does NOT render Follow-up Required badge
    expect(
      within(rows[1]).queryByText(/Follow-up Required/i)
    ).not.toBeInTheDocument();
    expect(within(rows[1]).getByText("Sara Admin")).toBeInTheDocument();
  });

  // =========================================================================
  // UI-06: Requester role sees Actions Taken in read-only layout; write controls absent
  // =========================================================================
  it("UI-06: renders Actions Taken read-only for Requester on TicketDetail with zero Add or Edit buttons", async () => {
    const ticketWithActions = {
      id: "tkt-uuid-100",
      ticketNo: "TKT-2026-000100",
      summary: "Office network port intermittent drops",
      description: "Port drops connection every hour.",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      currentStatus: "IN_PROGRESS",
      createdAt: "2026-09-01T09:00:00.000Z",
      updatedAt: "2026-09-01T19:00:00.000Z",
      userId: requesterUser.id,
      user: requesterUser,
      isRequesterResolved: false,
      category: { id: 1, name: "Network" },
      relatedSystem: { id: 2, name: "Campus LAN" },
      attachments: [],
      comments: [],
      actionsTaken: sampleActions,
    };

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const urlStr = input.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: requesterUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: ticketWithActions }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-100"]}>
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

    // Actions Taken entries are visible to Requester
    expect(
      screen.getByText(/Inspected core switch port 12 and ran cable diagnostics\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Replaced Cat6 patch cable and cleared interface counters\./i)
    ).toBeInTheDocument();

    // "+ Add Action Taken" and "Edit" buttons MUST be completely absent from DOM
    expect(
      screen.queryByRole("button", { name: /\+ Add Action Taken/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Edit$/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("add-action-taken-btn")).not.toBeInTheDocument();
  });

  // =========================================================================
  // UI-07: Edit Action Taken modal pre-populates existing data and submits PATCH
  // =========================================================================
  it("UI-07: pre-populates existing Action Taken values in Edit modal, submits PATCH, and updates the row", async () => {
    let capturedPatchUrl = "";
    let capturedPatchPayload: any = null;

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001") && init?.method === "PATCH") {
        capturedPatchUrl = urlStr;
        capturedPatchPayload = JSON.parse(String(init.body));
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...sampleActions[0],
              result: capturedPatchPayload.result,
              followUpRequired: capturedPatchPayload.followUpRequired,
              followUpNote: capturedPatchPayload.followUpNote,
              updatedAt: "2026-09-02T12:00:00.000Z",
            },
            ticketUpdatedAt: "2026-09-02T12:00:00.000Z",
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeAdminUser}
      />
    );

    // Click Edit on the first action (originally performed by Alex IT Staff)
    const editBtn = screen.getByTestId("edit-action-btn-act-uuid-001");
    fireEvent.click(editBtn);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Edit Action Taken")).toBeInTheDocument();

    // Verify existing values are pre-populated
    const descInput = within(dialog).getByLabelText(/Action Description/i) as HTMLTextAreaElement;
    const resultInput = within(dialog).getByLabelText(/^Result/i) as HTMLTextAreaElement;
    const performerInput = within(dialog).getByLabelText(/Performed By/i) as HTMLInputElement;
    const followUpCheckbox = within(dialog).getByLabelText(/Follow-Up Required\?/i) as HTMLInputElement;

    expect(descInput.value).toBe(sampleActions[0].actionDescription);
    expect(resultInput.value).toBe(sampleActions[0].result);
    // Performer remains original contributor (Alex IT Staff) even though Sara Admin is editing (BR-03)
    expect(performerInput.value).toBe("Alex IT Staff");
    expect(followUpCheckbox.checked).toBe(true);

    // Update result and uncheck followUpRequired
    fireEvent.change(resultInput, {
      target: { value: "Patch cord replaced early; CRC errors resolved completely." },
    });
    fireEvent.click(followUpCheckbox);

    // Submit Edit
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(capturedPatchUrl).toContain(
        "/api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001"
      );
      expect(capturedPatchPayload.result).toBe(
        "Patch cord replaced early; CRC errors resolved completely."
      );
      expect(capturedPatchPayload.followUpRequired).toBe(false);
      expect(capturedPatchPayload.expectedUpdatedAt).toBe("2026-09-01T10:15:00.000Z");
    });

    // Modal closes and updated result is displayed in row
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByText("Patch cord replaced early; CRC errors resolved completely.")
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // UI-08: Actions Taken creation and editing disabled on CLOSED or CANCELLED tickets
  // =========================================================================
  it("UI-08: disables '+ Add Action Taken' and row 'Edit' buttons with locked message on CLOSED or CANCELLED tickets", () => {
    const { rerender } = render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="CLOSED"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeStaffUser}
      />
    );

    expect(screen.getByTestId("terminal-ticket-lock-notice")).toHaveTextContent(
      /Ticket is closed or cancelled/i
    );
    expect(screen.getByRole("button", { name: /\+ Add Action Taken/i })).toBeDisabled();
    for (const editBtn of screen.getAllByRole("button", { name: /Edit/i })) {
      expect(editBtn).toBeDisabled();
    }

    // Verify CANCELLED status as well
    rerender(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="CANCELLED"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeStaffUser}
      />
    );

    expect(screen.getByTestId("terminal-ticket-lock-notice")).toHaveTextContent(
      /CANCELLED/i
    );
    expect(screen.getByRole("button", { name: /\+ Add Action Taken/i })).toBeDisabled();
  });

  // =========================================================================
  // UI-26: Double-click prevention on Action Taken submission
  // =========================================================================
  it("UI-26: prevents duplicate API calls on rapid double-click and shows 'Saving...' spinner while in-flight", async () => {
    let postCallCount = 0;
    let resolvePostPromise: (value: Response) => void = () => {};

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken") && init?.method === "POST") {
        postCallCount += 1;
        return new Promise<Response>((resolve) => {
          resolvePostPromise = resolve;
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T10:00:00.000Z"
        actions={[]}
        currentUser={activeStaffUser}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ Add Action Taken/i }));

    fireEvent.change(screen.getByLabelText(/Action Description/i), {
      target: { value: "Restarted print spooler service" },
    });
    fireEvent.change(screen.getByLabelText(/^Result/i), {
      target: { value: "Print queue cleared and test page printed" },
    });

    const saveBtn = screen.getByTestId("save-action-taken-btn");

    // Rapid double click
    fireEvent.click(saveBtn);
    fireEvent.click(saveBtn);

    // Button immediately transitions to disabled "Saving..." state
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveTextContent(/Saving\.\.\./i);

    // Strictly 1 POST request was sent
    expect(postCallCount).toBe(1);

    // Resolve the in-flight request
    resolvePostPromise({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: {
          id: "act-uuid-999",
          ticketId: "tkt-uuid-100",
          actionDate: "2026-09-02T10:00:00.000Z",
          actionDescription: "Restarted print spooler service",
          result: "Print queue cleared and test page printed",
          performedById: activeStaffUser.id,
          performedBy: activeStaffUser,
          followUpRequired: false,
          followUpNote: null,
          attachmentNotes: null,
          createdAt: "2026-09-02T10:00:00.000Z",
          updatedAt: "2026-09-02T10:00:00.000Z",
        },
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Restarted print spooler service")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // StaffTicketDetail Page Integration & HTTP 409 Conflict Banner Recovery
  // =========================================================================
  it("integrates ActionsTakenList inside StaffTicketDetail and displays Refresh Ticket CTA on HTTP 409 conflict", async () => {
    let postAttempt = 0;
    const capturedTimestamps: string[] = [];
    const freshTicketUpdatedAt = "2026-09-02T12:00:00.000Z";

    const staffTicket = {
      id: "tkt-staff-409",
      ticketNo: "TKT-2026-000409",
      title: "Mail Relay Failover",
      summary: "Email relay delayed in finance department",
      description: "Outbound SMTP messages queued for 20 minutes.",
      requestedPriority: "HIGH",
      itPriority: "HIGH",
      status: "IN_PROGRESS",
      currentStatus: "IN_PROGRESS",
      isRequesterResolved: false,
      owner: activeStaffUser,
      requester: { id: "usr-req-1", name: "Jane Requester", email: "jane@example.com" },
      category: { id: 1, name: "Software" },
      relatedSystem: { id: 1, name: "Email" },
      createdAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-01T08:00:00.000Z",
      comments: [],
      notes: [],
      attachments: [],
      actionsTaken: [sampleActions[0]],
    };

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: activeStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [activeStaffUser] }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets/tkt-staff-409/actions-taken") && init?.method === "POST") {
        postAttempt += 1;
        const body = JSON.parse(String(init.body));
        capturedTimestamps.push(body.expectedTicketUpdatedAt);

        if (postAttempt === 1) {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({
              success: false,
              error: {
                code: "STALE_UPDATE_CONFLICT",
                message: "Ticket was modified by another user concurrently. Please refresh and try again.",
              },
            }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: "act-new-409",
              ticketId: "tkt-staff-409",
              actionDate: body.actionDate,
              actionDescription: body.actionDescription,
              result: body.result,
              performedBy: activeStaffUser,
              followUpRequired: false,
              createdAt: "2026-09-02T12:01:00.000Z",
              updatedAt: "2026-09-02T12:01:00.000Z",
            },
            ticketUpdatedAt: "2026-09-02T12:01:00.000Z",
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-409")) {
        const returnedTicket = postAttempt > 0
          ? { ...staffTicket, updatedAt: freshTicketUpdatedAt }
          : staffTicket;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: returnedTicket }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets/tkt-staff-409/actions-taken") && (!init?.method || init.method === "GET")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ticketId: "tkt-staff-409",
              actionsTaken: [sampleActions[0]],
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/queue/tkt-staff-409"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000409")).toBeInTheDocument();
    });

    // Existing Action Taken is rendered inside StaffTicketDetail
    expect(
      screen.getByText(/Inspected core switch port 12 and ran cable diagnostics\./i)
    ).toBeInTheDocument();

    // Open Add Action Taken modal and submit to trigger 409 conflict
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Action Taken/i }));
    fireEvent.change(screen.getByLabelText(/Action Description/i), {
      target: { value: "Flushed postfix queue on relay-01" },
    });
    fireEvent.change(screen.getByLabelText(/^Result/i), {
      target: { value: "Queue size dropped to zero" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    // Verify 409 Conflict Banner and Refresh Ticket button appear while preserving input
    await waitFor(() => {
      expect(
        screen.getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Refresh Ticket/i })
      ).toBeInTheDocument();
    });
    expect(
      (screen.getByLabelText(/Action Description/i) as HTMLTextAreaElement).value
    ).toBe("Flushed postfix queue on relay-01");
    expect(capturedTimestamps[0]).toBe("2026-09-01T08:00:00.000Z");

    // Click Refresh Ticket
    fireEvent.click(screen.getByRole("button", { name: /Refresh Ticket/i }));

    // Verify conflict banner clears and input remains preserved
    await waitFor(() => {
      expect(
        screen.queryByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).not.toBeInTheDocument();
    });
    expect(
      (screen.getByLabelText(/Action Description/i) as HTMLTextAreaElement).value
    ).toBe("Flushed postfix queue on relay-01");
    expect(
      (screen.getByLabelText(/^Result/i) as HTMLTextAreaElement).value
    ).toBe("Queue size dropped to zero");

    // Click Save Action Taken again -> sends fresh expectedTicketUpdatedAt and succeeds
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    await waitFor(() => {
      expect(postAttempt).toBe(2);
      expect(capturedTimestamps[1]).toBe(freshTicketUpdatedAt);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // Create Mode HTTP 409 Conflict -> Refresh Ticket fails -> keeps conflict banner & blocks saving with stale timestamp
  // =========================================================================
  it("keeps conflict state and prevents saving with stale expectedTicketUpdatedAt when 'Refresh Ticket' fails in Create mode", async () => {
    let postAttempt = 0;
    let shouldTicketFail = false;

    const staffTicket = {
      id: "tkt-staff-fail-refresh",
      ticketNo: "TKT-2026-000410",
      title: "Mail Relay Failover",
      description: "Mail relay server experiencing unexpected failovers.",
      priority: "HIGH",
      currentStatus: "IN_PROGRESS",
      isRequesterResolved: false,
      owner: activeStaffUser,
      requester: { id: "usr-req-1", name: "Jane Requester", email: "jane@example.com" },
      category: { id: 1, name: "Software" },
      relatedSystem: { id: 1, name: "Email" },
      createdAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-01T08:00:00.000Z",
      comments: [],
      notes: [],
      attachments: [],
      actionsTaken: [sampleActions[0]],
    };

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: activeStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [activeStaffUser] }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets/tkt-staff-fail-refresh/actions-taken") && init?.method === "POST") {
        postAttempt += 1;
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Ticket was modified by another user concurrently. Please refresh and try again.",
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-fail-refresh")) {
        if (shouldTicketFail) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: { message: "Internal server error while refreshing ticket." },
            }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: staffTicket }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/queue/tkt-staff-fail-refresh"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000410")).toBeInTheDocument();
    });

    // Open modal and trigger 409 conflict
    fireEvent.click(screen.getByRole("button", { name: /\+ Add Action Taken/i }));
    fireEvent.change(screen.getByLabelText(/Action Description/i), {
      target: { value: "Flushed postfix queue on relay-01" },
    });
    fireEvent.change(screen.getByLabelText(/^Result/i), {
      target: { value: "Queue size dropped to zero" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
    });
    expect(postAttempt).toBe(1);

    // Make ticket refresh fail
    shouldTicketFail = true;
    fireEvent.click(screen.getByRole("button", { name: /Refresh Ticket/i }));

    // Verify conflict banner remains visible with error message
    await waitFor(() => {
      expect(
        screen.getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Internal server error while refreshing ticket\./i)
      ).toBeInTheDocument();
    });

    // Clicking Save Action Taken does NOT dispatch another POST request
    fireEvent.click(screen.getByRole("button", { name: /Save Action Taken/i }));
    expect(postAttempt).toBe(1);
    expect(
      screen.getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
    ).toBeInTheDocument();
  });

  // =========================================================================
  // Actions Taken loading error is separated from empty list state and supports retry
  // =========================================================================
  it("separates Actions Taken API loading error from empty list and allows retry", async () => {
    let retryAttempt = 0;
    const staffTicket = {
      id: "tkt-staff-err",
      ticketNo: "TKT-2026-000411",
      title: "Network Switch Issue",
      description: "Switch port down.",
      priority: "HIGH",
      currentStatus: "IN_PROGRESS",
      isRequesterResolved: false,
      owner: activeStaffUser,
      requester: { id: "usr-req-1", name: "Jane Requester", email: "jane@example.com" },
      category: { id: 1, name: "Hardware" },
      relatedSystem: { id: 1, name: "Network" },
      createdAt: "2026-09-01T08:00:00.000Z",
      updatedAt: "2026-09-01T08:00:00.000Z",
      comments: [],
      notes: [],
      attachments: [],
      actionsTaken: undefined, // Force call to getActionsTaken
    };

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: activeStaffUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/assignees")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [activeStaffUser] }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-err")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: staffTicket }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/tickets/tkt-staff-err/actions-taken")) {
        retryAttempt += 1;
        if (retryAttempt === 1) {
          // First attempt fails
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              error: { message: "Database connection timeout while retrieving Actions Taken." },
            }),
          } as Response);
        }
        // Second attempt (after Retry) succeeds with empty list
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ticketId: "tkt-staff-err",
              actionsTaken: [],
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/queue/tkt-staff-err"]}>
        <AuthProvider>
          <Routes>
            <Route path="/queue/:id" element={<StaffTicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial load: Actions Taken fails to load -> displays error banner with Retry button
    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-error")).toBeInTheDocument();
      expect(screen.getByTestId("actions-taken-error")).toHaveTextContent(
        /Unable to load Actions Taken: Database connection timeout while retrieving Actions Taken\./i
      );
    });

    // Crucial: Empty list message is NOT shown while in error state
    expect(screen.queryByTestId("actions-taken-empty")).not.toBeInTheDocument();

    // Click Retry
    fireEvent.click(screen.getByTestId("retry-load-actions-btn"));

    // After retry succeeds with empty actions list -> error clears and empty state is now displayed
    await waitFor(() => {
      expect(screen.queryByTestId("actions-taken-error")).not.toBeInTheDocument();
      expect(screen.getByTestId("actions-taken-empty")).toBeInTheDocument();
      expect(
        screen.getByText(/No actions recorded yet\. Click 'Add Action Taken' to log work done on this ticket\./i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Edit Mode HTTP 409 Conflict -> Refresh Ticket updates expectedUpdatedAt while preserving user input -> Retry succeeds
  // =========================================================================
  it("updates expectedUpdatedAt in Edit mode when clicking 'Refresh Ticket' after HTTP 409 while preserving user edits", async () => {
    let patchAttempt = 0;
    const capturedExpectedTimestamps: string[] = [];
    const freshTimestamp = "2026-09-03T15:30:00.000Z";

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();

      // GET /api/v1/tickets/tkt-uuid-100/actions-taken returns refreshed action with new updatedAt
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken") && (!init?.method || init.method === "GET")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ticketId: "tkt-uuid-100",
              ticketNumber: "TKT-2026-000100",
              actionsTaken: [
                {
                  ...sampleActions[0],
                  updatedAt: freshTimestamp,
                },
                sampleActions[1],
              ],
            },
          }),
        } as Response);
      }

      // PATCH /api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001") && init?.method === "PATCH") {
        patchAttempt += 1;
        const body = JSON.parse(String(init.body));
        capturedExpectedTimestamps.push(body.expectedUpdatedAt);

        // First attempt fails with 409 STALE_UPDATE_CONFLICT
        if (patchAttempt === 1) {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({
              success: false,
              error: {
                code: "STALE_UPDATE_CONFLICT",
                message: "Action Taken record was modified since expectedUpdatedAt. Please refresh.",
              },
            }),
          } as Response);
        }

        // Second attempt (after Refresh Ticket) succeeds with fresh expectedUpdatedAt
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...sampleActions[0],
              actionDescription: body.actionDescription,
              result: body.result,
              updatedAt: "2026-09-03T15:35:00.000Z",
            },
            ticketUpdatedAt: "2026-09-03T15:35:00.000Z",
          }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeStaffUser}
      />
    );

    // 1. Open Edit modal on first action (initial updatedAt: "2026-09-01T10:15:00.000Z")
    fireEvent.click(screen.getByTestId("edit-action-btn-act-uuid-001"));

    const dialog = screen.getByRole("dialog");
    const descInput = within(dialog).getByLabelText(/Action Description/i) as HTMLTextAreaElement;
    const resultInput = within(dialog).getByLabelText(/^Result/i) as HTMLTextAreaElement;

    // 2. User edits both fields
    fireEvent.change(descInput, {
      target: { value: "Inspected core switch port 12, replaced SFP transceiver." },
    });
    fireEvent.change(resultInput, {
      target: { value: "Optical signal levels normalized (-2.4 dBm)." },
    });

    // 3. First Save -> hits HTTP 409
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(
        within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
    });
    expect(capturedExpectedTimestamps[0]).toBe("2026-09-01T10:15:00.000Z");

    // 4. Click "Refresh Ticket" inside the conflict banner
    const refreshBtn = within(dialog).getByRole("button", { name: /Refresh Ticket/i });
    fireEvent.click(refreshBtn);

    // Wait for conflict banner to clear after refresh
    await waitFor(() => {
      expect(
        within(dialog).queryByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).not.toBeInTheDocument();
    });

    // CRITICAL: User's typed text is still preserved in the modal!
    expect(descInput.value).toBe("Inspected core switch port 12, replaced SFP transceiver.");
    expect(resultInput.value).toBe("Optical signal levels normalized (-2.4 dBm).");

    // 5. Click "Save Changes" again -> now sends the refreshed expectedUpdatedAt and succeeds!
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(patchAttempt).toBe(2);
      expect(capturedExpectedTimestamps[1]).toBe(freshTimestamp);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(
        screen.getByText("Optical signal levels normalized (-2.4 dBm).")
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Test B: Edit Mode HTTP 409 Conflict -> Refresh Ticket fails -> keeps conflict banner & blocks saving with stale timestamp
  // =========================================================================
  it("keeps conflict state and prevents saving with stale expectedUpdatedAt when 'Refresh Ticket' fails in Edit mode", async () => {
    let patchAttempt = 0;

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();

      // GET /api/v1/tickets/tkt-uuid-100/actions-taken fails with HTTP 500
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken") && (!init?.method || init.method === "GET")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: {
              code: "INTERNAL_SERVER_ERROR",
              message: "Database connection timeout while refreshing actions.",
            },
          }),
        } as Response);
      }

      // PATCH /api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001") && init?.method === "PATCH") {
        patchAttempt += 1;
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Action Taken record was modified since expectedUpdatedAt. Please refresh.",
            },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeStaffUser}
      />
    );

    // 1. Open Edit modal on first action
    fireEvent.click(screen.getByTestId("edit-action-btn-act-uuid-001"));

    const dialog = screen.getByRole("dialog");
    const descInput = within(dialog).getByLabelText(/Action Description/i) as HTMLTextAreaElement;

    fireEvent.change(descInput, {
      target: { value: "Updated diagnostic description before refresh failure." },
    });

    // 2. First Save -> hits HTTP 409
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(
        within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
    });
    expect(patchAttempt).toBe(1);

    // 3. Click "Refresh Ticket" -> GET fails with 500
    fireEvent.click(within(dialog).getByRole("button", { name: /Refresh Ticket/i }));

    // 4. Verify conflict banner remains visible and displays the refresh error message
    await waitFor(() => {
      expect(
        within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText(/Database connection timeout while refreshing actions\./i)
      ).toBeInTheDocument();
    });

    // User input is still preserved
    expect(descInput.value).toBe("Updated diagnostic description before refresh failure.");

    // 5. Attempting to click "Save Changes" does NOT send another PATCH with the stale timestamp
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));
    expect(patchAttempt).toBe(1);
    expect(
      within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
    ).toBeInTheDocument();
  });

  // =========================================================================
  // Test C: Edit Mode HTTP 409 Conflict -> Refresh succeeds but edited Action Taken is missing -> keeps conflict & blocks stale PATCH
  // =========================================================================
  it("keeps conflict state and prevents saving with stale expectedUpdatedAt when refreshed list does not contain the edited Action Taken", async () => {
    let patchAttempt = 0;

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();

      // GET /api/v1/tickets/tkt-uuid-100/actions-taken returns list WITHOUT act-uuid-001
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken") && (!init?.method || init.method === "GET")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ticketId: "tkt-uuid-100",
              ticketNumber: "TKT-2026-000100",
              actionsTaken: [sampleActions[1]],
            },
          }),
        } as Response);
      }

      // PATCH /api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001
      if (urlStr.includes("/api/v1/tickets/tkt-uuid-100/actions-taken/act-uuid-001") && init?.method === "PATCH") {
        patchAttempt += 1;
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Action Taken record was modified since expectedUpdatedAt. Please refresh.",
            },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeStaffUser}
      />
    );

    // 1. Open Edit modal on first action (act-uuid-001)
    fireEvent.click(screen.getByTestId("edit-action-btn-act-uuid-001"));

    const dialog = screen.getByRole("dialog");
    const descInput = within(dialog).getByLabelText(/Action Description/i) as HTMLTextAreaElement;

    fireEvent.change(descInput, {
      target: { value: "Edited action description when record is missing after refresh." },
    });

    // 2. First Save -> hits HTTP 409
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(
        within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
    });
    expect(patchAttempt).toBe(1);

    // 3. Click "Refresh Ticket" -> GET succeeds (200) but act-uuid-001 is not in actionsTaken
    fireEvent.click(within(dialog).getByRole("button", { name: /Refresh Ticket/i }));

    // 4. Verify conflict banner remains visible and shows missing action error
    await waitFor(() => {
      expect(
        within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          /The Action Taken could not be found after refresh\. Please reload the ticket\./i
        )
      ).toBeInTheDocument();
    });

    // User input is still preserved
    expect(descInput.value).toBe("Edited action description when record is missing after refresh.");

    // 5. Clicking "Save Changes" does NOT send another PATCH with the old updatedAt
    fireEvent.click(within(dialog).getByRole("button", { name: /Save Changes/i }));
    expect(patchAttempt).toBe(1);
    expect(
      within(dialog).getByText(/Concurrency Conflict Detected \(HTTP 409\)/i)
    ).toBeInTheDocument();
  });

  // =========================================================================
  // Accessibility: Focus Trap (Tab / Shift+Tab) and Focus Restoration on Modal Close
  // =========================================================================
  it("traps keyboard Tab / Shift+Tab focus within the modal and restores focus to trigger button on close", async () => {
    render(
      <ActionsTakenList
        ticketId="tkt-uuid-100"
        ticketStatus="IN_PROGRESS"
        ticketUpdatedAt="2026-09-01T19:00:00.000Z"
        actions={sampleActions}
        currentUser={activeStaffUser}
      />
    );

    const addBtn = screen.getByRole("button", { name: /\+ Add Action Taken/i });
    addBtn.focus();
    expect(document.activeElement).toBe(addBtn);

    // Open modal
    fireEvent.click(addBtn);
    const dialog = screen.getByRole("dialog");

    const closeBtn = within(dialog).getByRole("button", { name: /Close modal/i });
    const saveBtn = within(dialog).getByTestId("save-action-taken-btn");

    // Focus last focusable element (Save button) and press Tab -> wraps to first focusable element (Close button)
    saveBtn.focus();
    expect(document.activeElement).toBe(saveBtn);
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // Focus first focusable element (Close button) and press Shift+Tab -> wraps to last focusable element (Save button)
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(saveBtn);

    // Press Escape to close modal -> focus is restored back to the "+ Add Action Taken" button
    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(addBtn);
  });

  // =========================================================================
  // Responsive Layout: Mobile (375px - 480px) Card-Based Layout vs Desktop Table
  // =========================================================================
  it("renders individual Action Taken cards on Mobile (375px - 480px) without overflow and opens Edit modal from card", async () => {
    const originalInnerWidth = window.innerWidth;

    try {
      // Simulate Mobile viewport at 375px
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      fireEvent.resize(window);

      render(
        <ActionsTakenList
          ticketId="tkt-uuid-100"
          ticketStatus="IN_PROGRESS"
          ticketUpdatedAt="2026-09-01T19:00:00.000Z"
          actions={sampleActions}
          currentUser={activeStaffUser}
        />
      );

      // Mobile card container is rendered; desktop table is not
      expect(screen.getByTestId("actions-taken-mobile-cards")).toBeInTheDocument();
      expect(screen.queryByTestId("actions-taken-desktop-table")).not.toBeInTheDocument();

      // Each action is rendered as an individual card
      const card1 = screen.getByTestId("action-taken-card-act-uuid-001");
      const card2 = screen.getByTestId("action-taken-card-act-uuid-002");
      expect(card1).toBeInTheDocument();
      expect(card2).toBeInTheDocument();
      expect(card1.style.overflowX).toBe("hidden");

      // Verify content inside mobile cards
      expect(
        within(card1).getByText(/Inspected core switch port 12 and ran cable diagnostics\./i)
      ).toBeInTheDocument();
      expect(
        within(card1).getByText(/Follow-Up Required/i)
      ).toBeInTheDocument();
      expect(
        within(card1).getByText(/Replace Cat6 patch cable during maintenance window at 18:00\./i)
      ).toBeInTheDocument();

      // Resize to 480px (upper mobile bound) -> still renders mobile cards
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 480,
      });
      fireEvent.resize(window);
      expect(screen.getByTestId("actions-taken-mobile-cards")).toBeInTheDocument();

      // Verify Edit button on mobile card is full-width, >= 44px touch target, and opens Edit modal
      const mobileEditBtn = within(card1).getByTestId("edit-action-btn-act-uuid-001");
      expect(mobileEditBtn).toHaveClass("w-100");
      expect(mobileEditBtn.style.minHeight).toBe("44px");
      expect(mobileEditBtn.style.maxWidth).toBe("100%");

      fireEvent.click(mobileEditBtn);
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Edit Action Taken")).toBeInTheDocument();

      // Verify Create/Edit Modal inner container, Performed By input, and footer buttons do not overflow on mobile
      const performedByInput = within(dialog).getByLabelText(/Performed By/i) as HTMLInputElement;
      expect(["0", "0px"]).toContain(performedByInput.style.minWidth);
      const saveChangesBtn = within(dialog).getByTestId("save-action-taken-btn");
      expect(saveChangesBtn.style.minHeight).toBe("44px");
      expect(saveChangesBtn.parentElement).toHaveClass("flex-wrap");

      fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/i }));

      // Resize back to Desktop (1280px) -> switches to desktop table
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1280,
      });
      fireEvent.resize(window);

      await waitFor(() => {
        expect(screen.getByTestId("actions-taken-desktop-table")).toBeInTheDocument();
        expect(screen.queryByTestId("actions-taken-mobile-cards")).not.toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
      fireEvent.resize(window);
    }
  });
});

