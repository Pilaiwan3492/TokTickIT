import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TicketDetail from "../../src/pages/TicketDetail";
import { RequesterProvider } from "../../src/context/RequesterContext";

const mockRequester = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
};

const mockTicket = {
  id: "test-ticket-detail-uuid",
  ticketNo: "TKT-2026-000100",
  summary: "VPN Connection keeps failing after update",
  description: "Unable to connect to campus VPN since the latest client update on Windows.",
  requestedPriority: "HIGH",
  itPriority: null,
  currentStatus: "NEW",
  createdAt: "2026-08-25T10:00:00.000Z",
  updatedAt: "2026-08-25T10:00:00.000Z",
  category: { id: 4, name: "Network" },
  relatedSystem: { id: 3, name: "VPN" },
  requester: mockRequester,
  attachments: [],
};

describe("Requester Ticket Detail Screen Tests (Lab 2 — Section 12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));
  });

  it("renders read-only ticket details when accessed by ticket owner", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/tickets/test-ticket-detail-uuid")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockTicket }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: {} }) });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/tickets/test-ticket-detail-uuid"]}>
        <RequesterProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </RequesterProvider>
      </MemoryRouter>
    );

    // Wait for ticket to load
    await waitFor(() => {
      expect(screen.getByText("TKT-2026-000100")).toBeInTheDocument();
    });

    // Verify key fields rendered
    expect(screen.getByText("VPN Connection keeps failing after update")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to connect to campus VPN since the latest client update on Windows.")
    ).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("VPN")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();

    // Verify back navigation link
    expect(screen.getByRole("link", { name: /Back to My Tickets/i })).toBeInTheDocument();
  });

  it("displays 403 Forbidden error when accessing ticket belonging to another requester", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to access this ticket.",
          },
        }),
      });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/tickets/other-requester-ticket"]}>
        <RequesterProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/You do not have permission to access this ticket/i)
      ).toBeInTheDocument();
    });
  });

  it("displays 404 Not Found error when ticket does not exist", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: "TICKET_NOT_FOUND",
            message: "Ticket not found.",
          },
        }),
      });
    }) as any;

    render(
      <MemoryRouter initialEntries={["/tickets/non-existent-uuid"]}>
        <RequesterProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Ticket not found/i)).toBeInTheDocument();
    });
  });
});
