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
    const staffTicket = {
      id: "tkt-staff-409",
      ticketNo: "TKT-2026-000409",
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
      if (urlStr.includes("/api/v1/staff/tickets/tkt-staff-409")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: staffTicket }),
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
  });
});
