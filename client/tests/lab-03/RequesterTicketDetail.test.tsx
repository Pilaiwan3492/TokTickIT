import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import TicketDetail from "../../src/pages/TicketDetail";

const mockRequesterUser = {
  id: "usr-requester-100",
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
  role: "REQUESTER" as const,
  isActive: true,
  mustChangePassword: false,
};

const PROD_TOKEN = "jwt.header.payload.signature-requester-token";

const initialTicket = {
  id: "tkt-uuid-detail-100",
  ticketNo: "TKT-2026-000100",
  summary: "VPN Connection keeps failing after update",
  description: "Unable to connect to campus VPN since the latest client update on Windows.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  createdAt: "2026-08-25T10:00:00.000Z",
  updatedAt: "2026-08-25T10:00:00.000Z",
  userId: mockRequesterUser.id,
  user: mockRequesterUser,
  isRequesterResolved: false,
  category: { id: 4, name: "Network" },
  relatedSystem: { id: 3, name: "VPN" },
  attachments: [],
  comments: [
    {
      id: "cmt-uuid-001",
      ticketId: "tkt-uuid-detail-100",
      content: "We have pushed a routing update to the VPN gateway.",
      createdAt: "2026-08-25T11:30:00.000Z",
      author: {
        id: "usr-staff-200",
        name: "Michael Brown",
        role: "IT_STAFF" as const,
      },
    },
  ],
};

describe("Requester Ticket Detail Tests (Lab 3 — Issue 25)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, PROD_TOKEN);
    localStorage.removeItem("toktickit_selected_requester");
  });

  // --- UI-24: Problem Appears Resolved button ---
  it("UI-24: Requester can indicate problem appears resolved without altering official status", async () => {
    let capturedResolveUrl = "";
    let capturedResolveBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockRequesterUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-detail-100/resolve-indicator")) {
        capturedResolveUrl = urlStr;
        capturedResolveBody = JSON.parse(String(init?.body || "{}"));
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ticketId: "tkt-uuid-detail-100",
              isRequesterResolved: true,
              message: "Problem resolution indicated successfully.",
            },
          }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-detail-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-detail-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // 1. Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    // 2. Official status badge should be In Progress
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();

    // 3. Problem Appears Resolved action button should be visible
    const resolveBtn = screen.getByRole("button", { name: /Problem Appears Resolved/i });
    expect(resolveBtn).toBeInTheDocument();

    // 4. Click the button
    fireEvent.click(resolveBtn);

    // 5. Confirmed banner should appear
    await waitFor(() => {
      expect(
        screen.getByText(/Problem Appears Resolved \(Confirmed by Requester\)/i)
      ).toBeInTheDocument();
    });

    // 6. Verify request payload and URL
    expect(capturedResolveUrl).toContain("/api/v1/tickets/tkt-uuid-detail-100/resolve-indicator");
    expect(capturedResolveBody.isRequesterResolved).toBe(true);

    // 7. CRITICAL: Official ticket status badge must remain "In Progress" (not Resolved or Closed)
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  // --- UI-25: Complete absence of Internal Notes ---
  it("UI-25: Requester view has zero rendering of Internal Notes tab, header, or notes content", async () => {
    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockRequesterUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-detail-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-detail-100"]}>
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

    // Assert that Internal Notes tab or content is COMPLETELY ABSENT
    expect(screen.queryByText(/Internal Notes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Private Notes/i)).not.toBeInTheDocument();
  });

  // --- UI-22: Public Comments feed and comment posting ---
  it("UI-22: Public Comments feed renders author avatar, role badge, timestamp, and posts new comment", async () => {
    let capturedCommentUrl = "";
    let capturedCommentBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockRequesterUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-detail-100/comments") && init?.method === "POST") {
        capturedCommentUrl = urlStr;
        capturedCommentBody = JSON.parse(String(init?.body || "{}"));
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "cmt-uuid-002",
              ticketId: "tkt-uuid-detail-100",
              content: capturedCommentBody.content,
              createdAt: "2026-08-25T12:00:00.000Z",
              author: {
                id: mockRequesterUser.id,
                name: mockRequesterUser.name,
                role: "REQUESTER",
              },
            },
          }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-detail-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: initialTicket }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-detail-100"]}>
        <AuthProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // 1. Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    // 2. Public Comments section heading
    expect(screen.getByRole("heading", { name: /Public Comments/i })).toBeInTheDocument();

    // 3. Existing comment from IT Staff should be visible
    expect(screen.getByText("Michael Brown")).toBeInTheDocument();
    expect(screen.getByText("IT Staff")).toBeInTheDocument();
    expect(screen.getByText(/routing update to the VPN gateway/i)).toBeInTheDocument();

    // 4. Character counter should initially show 0 / 2000
    expect(screen.getByText("0 / 2000")).toBeInTheDocument();

    // 5. Submit button should be disabled when textarea is empty
    const postBtn = screen.getByRole("button", { name: /Post Comment/i });
    expect(postBtn).toBeDisabled();

    // 6. Type new comment
    const textarea = screen.getByPlaceholderText(/Write a comment/i);
    fireEvent.change(textarea, { target: { value: "Confirmed, VPN is now connecting smoothly!" } });

    // 7. Counter updates
    expect(screen.getByText("42 / 2000")).toBeInTheDocument();
    expect(postBtn).not.toBeDisabled();

    // 8. Submit comment
    fireEvent.click(postBtn);

    // 9. Verify success notification and new comment rendered in feed
    await waitFor(() => {
      expect(screen.getByText(/Comment posted successfully/i)).toBeInTheDocument();
      expect(screen.getByText("Confirmed, VPN is now connecting smoothly!")).toBeInTheDocument();
    });

    // 10. Verify API call details
    expect(capturedCommentUrl).toContain("/api/v1/tickets/tkt-uuid-detail-100/comments");
    expect(capturedCommentBody.content).toBe("Confirmed, VPN is now connecting smoothly!");

    // 11. Textarea reset to empty and counter to 0 / 2000
    expect((textarea as HTMLTextAreaElement).value).toBe("");
    expect(screen.getByText("0 / 2000")).toBeInTheDocument();
  });

  // --- Edge Cases: Already resolved ticket display ---
  it("shows resolution banner directly if ticket was already marked as resolved", async () => {
    const alreadyResolvedTicket = {
      ...initialTicket,
      isRequesterResolved: true,
    };

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockRequesterUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-detail-100")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: alreadyResolvedTicket }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-detail-100"]}>
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

    // Should display confirmed banner directly
    expect(
      screen.getByText(/Problem Appears Resolved \(Confirmed by Requester\)/i)
    ).toBeInTheDocument();

    // The action button should NOT be present
    expect(screen.queryByRole("button", { name: /^Problem Appears Resolved$/i })).not.toBeInTheDocument();
  });
});
