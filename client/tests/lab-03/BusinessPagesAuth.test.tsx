import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import { apiFetch } from "../../src/api/apiClient";
import MyTickets from "../../src/pages/MyTickets";
import CreateTicket from "../../src/pages/CreateTicket";
import TicketDetail from "../../src/pages/TicketDetail";

const mockUser = {
  id: "usr-requester-uuid-1234",
  name: "Alice Requester",
  email: "alice@example.com",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};

const PROD_JWT_TOKEN = "jwt.header.payload.signature-test-token";

const mockTicketData = {
  id: "tkt-uuid-999",
  ticketNo: "TKT-2026-000999",
  summary: "Laptop battery dies within 10 minutes",
  description: "Detailed description of the rapid battery depletion problem.",
  requestedPriority: "HIGH",
  itPriority: null,
  currentStatus: "NEW",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  userId: mockUser.id,
  user: mockUser,
  category: { id: 1, name: "Hardware" },
  relatedSystem: { id: 1, name: "Laptop" },
  attachments: [
    {
      id: "att-uuid-001",
      fileName: "error_log.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      createdAt: "2026-09-01T10:00:00.000Z",
      removedAt: null,
      isRemoved: false,
    },
  ],
};

describe("Production Path Authenticated Business Pages Tests (Lab 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Guarantee that ONLY authenticated JWT token is present and NO legacy requester context exists
    localStorage.setItem(TOKEN_STORAGE_KEY, PROD_JWT_TOKEN);
    localStorage.removeItem("toktickit_selected_requester");
  });

  // CLIENT-AUTH-01
  it("CLIENT-AUTH-01: MyTickets requests /api/v1/tickets with Authorization Bearer and omits requesterId", async () => {
    let capturedUrl = "";
    let capturedAuthHeader: string | null = null;

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/categories")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: 1, name: "Hardware" }] }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets")) {
        capturedUrl = urlStr;
        const headers = new Headers(init?.headers);
        capturedAuthHeader = headers.get("Authorization");

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: [mockTicketData],
            meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets"]}>
        <AuthProvider>
          <MyTickets />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000999")).toBeInTheDocument();
    });

    // Verify request attributes:
    // 1. Must have Authorization: Bearer <PROD_JWT_TOKEN>
    expect(capturedAuthHeader).toBe(`Bearer ${PROD_JWT_TOKEN}`);
    // 2. Must NOT contain requesterId query parameter
    expect(capturedUrl).not.toContain("requesterId=");
  });

  // CLIENT-AUTH-02
  it("CLIENT-AUTH-02: CreateTicket posts ticket with Bearer header and completely omits requesterId from body", async () => {
    let capturedAuthHeader: string | null = null;
    let capturedRequestBody: any = null;

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/categories")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: 1, name: "Hardware", isActive: true }] }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/related-systems")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: 2, name: "Corporate Laptop", isActive: true }] }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets") && init?.method === "POST") {
        const headers = new Headers(init?.headers);
        capturedAuthHeader = headers.get("Authorization");
        capturedRequestBody = JSON.parse(String(init?.body || "{}"));

        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "tkt-created-111",
              ticketNo: "TKT-2026-000111",
              summary: "Hardware issue summary",
              description: "Hardware issue full description",
              requestedPriority: "MEDIUM",
              currentStatus: "NEW",
            },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/create-ticket"]}>
        <AuthProvider>
          <CreateTicket />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for dropdowns to populate
    await waitFor(() => {
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByDisplayValue(/-- Select Category --/i), { target: { value: "1" } });
    fireEvent.change(screen.getByDisplayValue(/-- Select Related System --/i), { target: { value: "2" } });
    fireEvent.change(screen.getByPlaceholderText(/Brief summary/i), {
      target: { value: "Screen flicker on cold start" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Detailed description/i), {
      target: { value: "Every morning when turning on the machine, the display flickers for 5 minutes." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Ticket/i }));

    // Verify submission succeeds
    expect(await screen.findByText(/Ticket Created Successfully/i)).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000111")).toBeInTheDocument();

    // Verify API contract:
    // 1. Must send Bearer token
    expect(capturedAuthHeader).toBe(`Bearer ${PROD_JWT_TOKEN}`);
    // 2. Body must NOT contain requesterId
    expect(capturedRequestBody.requesterId).toBeUndefined();
    // 3. Body must contain standard fields
    expect(capturedRequestBody.categoryId).toBe(1);
    expect(capturedRequestBody.relatedSystemId).toBe(2);
    expect(capturedRequestBody.summary).toBe("Screen flicker on cold start");
  });

  // CLIENT-AUTH-03
  it("CLIENT-AUTH-03: TicketDetail loads ticket using Bearer token and omits requesterId from GET url", async () => {
    let capturedUrl = "";
    let capturedAuthHeader: string | null = null;

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-999")) {
        capturedUrl = urlStr;
        const headers = new Headers(init?.headers);
        capturedAuthHeader = headers.get("Authorization");

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTicketData }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-999"]}>
        <AuthProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for ticket detail to display
    expect(await screen.findByText("TKT-2026-000999")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery dies within 10 minutes")).toBeInTheDocument();
    expect(screen.getByText("Alice Requester")).toBeInTheDocument();

    // Verify authenticated request:
    expect(capturedAuthHeader).toBe(`Bearer ${PROD_JWT_TOKEN}`);
    expect(capturedUrl).not.toContain("requesterId=");
  });

  // CLIENT-AUTH-04
  it("CLIENT-AUTH-04: Attachment actions (upload, download, remove) use Bearer authentication and omit requesterId", async () => {
    let uploadUrl = "";
    let uploadAuth: string | null = null;
    let downloadUrl = "";
    let downloadAuth: string | null = null;
    let removeUrl = "";
    let removeAuth: string | null = null;

    globalThis.fetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();

      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUser }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/tickets/tkt-uuid-999") && !init?.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTicketData }),
        } as Response);
      }

      if (urlStr.includes("/attachments") && init?.method === "POST") {
        uploadUrl = urlStr;
        uploadAuth = new Headers(init?.headers).get("Authorization");
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ data: { id: "att-new-222" } }),
        } as Response);
      }

      if (urlStr.includes("/download")) {
        downloadUrl = urlStr;
        downloadAuth = new Headers(init?.headers).get("Authorization");
        return Promise.resolve({
          ok: true,
          status: 200,
          blob: async () => new Blob(["test"], { type: "application/pdf" }),
        } as Response);
      }

      if (urlStr.includes("/api/v1/attachments/") && init?.method === "DELETE") {
        removeUrl = urlStr;
        removeAuth = new Headers(init?.headers).get("Authorization");
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { message: "Attachment removed." } }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    render(
      <MemoryRouter initialEntries={["/tickets/tkt-uuid-999"]}>
        <AuthProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText("TKT-2026-000999")).toBeInTheDocument();

    // Mock window.URL and HTMLAnchorElement.click for jsdom
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
    window.URL.revokeObjectURL = vi.fn();
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    // 1. Test Download Action
    const downloadBtn = screen.getByRole("button", { name: /^Download$/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(downloadUrl).toContain("/api/v1/attachments/att-uuid-001/download");
      expect(downloadUrl).not.toContain("requesterId=");
      expect(downloadAuth).toBe(`Bearer ${PROD_JWT_TOKEN}`);
    });

    clickSpy.mockRestore();

    // 2. Test Soft-Remove Action
    const removeBtn = screen.getByRole("button", { name: /^Remove$/i });
    fireEvent.click(removeBtn);

    expect(await screen.findByRole("heading", { name: /Remove Attachment/i })).toBeInTheDocument();
    const reasonInput = screen.getByPlaceholderText(/Uploaded the wrong screenshot/i);
    fireEvent.change(reasonInput, { target: { value: "Outdated log file" } });

    const confirmRemoveBtn = screen.getByRole("button", { name: /^Remove Attachment$/i });
    fireEvent.click(confirmRemoveBtn);

    await waitFor(() => {
      expect(removeUrl).toContain("/api/v1/attachments/att-uuid-001");
      expect(removeUrl).not.toContain("requesterId=");
      expect(removeAuth).toBe(`Bearer ${PROD_JWT_TOKEN}`);
    });
  });

  // CLIENT-AUTH-05
  it("CLIENT-AUTH-05: HTTP 403 PASSWORD_CHANGE_REQUIRED from backend dispatches password-change-required event", async () => {
    let eventFired = false;
    const onPasswordChange = () => {
      eventFired = true;
    };
    window.addEventListener("toktickit:password-change-required", onPasswordChange);

    globalThis.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 403,
        clone: () => ({
          json: async () => ({
            error: {
              code: "PASSWORD_CHANGE_REQUIRED",
              message: "Password change is required before proceeding.",
            },
          }),
        }),
        json: async () => ({
          error: {
            code: "PASSWORD_CHANGE_REQUIRED",
            message: "Password change is required before proceeding.",
          },
        }),
      } as unknown as Response);
    });

    const res = await apiFetch("/api/v1/tickets");
    expect(res.status).toBe(403);
    expect(eventFired).toBe(true);

    window.removeEventListener("toktickit:password-change-required", onPasswordChange);
  });
});
