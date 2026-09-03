import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateTicket from "../../src/pages/CreateTicket";
import { RequesterProvider } from "../../src/context/RequesterContext";

const mockRequester = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
};

const mockCategories = [
  { id: 1, name: "Hardware", isActive: true },
  { id: 2, name: "Software", isActive: true },
];

const mockRelatedSystems = [
  { id: 1, name: "Corporate Laptop", isActive: true },
  { id: 2, name: "Email", isActive: true },
];

describe("Create Ticket Screen Tests (Lab 2 — Section 12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));

    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const urlStr = url.toString();

      if (urlStr.includes("/api/v1/categories")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockCategories }),
        });
      }

      if (urlStr.includes("/api/v1/related-systems")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: mockRelatedSystems }),
        });
      }

      if (urlStr.includes("/api/v1/tickets") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "new-ticket-uuid-001",
              ticketNo: "TKT-2026-000042",
              summary: "Sample laptop won't turn on",
              description: "Detailed description of the hardware failure.",
              requestedPriority: "HIGH",
              currentStatus: "NEW",
              createdAt: new Date().toISOString(),
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ data: {} }),
      });
    }) as any;
  });

  it("renders Create Ticket form with reference data and character counters", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    // Header / Title
    expect(screen.getByRole("heading", { name: /Create New Ticket/i })).toBeInTheDocument();

    // Category and Related System dropdowns loaded
    await waitFor(() => {
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    });

    // Character counters
    expect(screen.getByText(/0 \/ 150/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2000/i)).toBeInTheDocument();

    // Submit button
    expect(screen.getByRole("button", { name: /Create Ticket/i })).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Hardware")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Create Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a related system/i)).toBeInTheDocument();
      expect(screen.getByText(/Summary must be between 5 and 150 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Description must be between 10 and 2,000 characters/i)).toBeInTheDocument();
    });
  });

  it("validates minimum length for summary and description", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Hardware")).toBeInTheDocument();
    });

    const summaryInput = screen.getByPlaceholderText(/Brief summary/i);
    const descInput = screen.getByPlaceholderText(/Detailed description/i);

    fireEvent.change(summaryInput, { target: { value: "bad" } }); // < 5 chars
    fireEvent.change(descInput, { target: { value: "short" } }); // < 10 chars

    const submitBtn = screen.getByRole("button", { name: /Create Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Summary must be between 5 and 150 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Description must be between 10 and 2,000 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("submits valid ticket and displays success state with official Ticket Number", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Hardware")).toBeInTheDocument();
    });

    // Fill form
    const categorySelect = screen.getByDisplayValue(/-- Select Category --/i);
    fireEvent.change(categorySelect, { target: { value: "1" } });

    const systemSelect = screen.getByDisplayValue(/-- Select Related System --/i);
    fireEvent.change(systemSelect, { target: { value: "1" } });

    const summaryInput = screen.getByPlaceholderText(/Brief summary/i);
    fireEvent.change(summaryInput, { target: { value: "Laptop will not power on at all" } });

    const descInput = screen.getByPlaceholderText(/Detailed description/i);
    fireEvent.change(descInput, {
      target: { value: "When pressing the power button, the LED indicator flashes once but nothing turns on." },
    });

    const submitBtn = screen.getByRole("button", { name: /Create Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ticket Created Successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/TKT-2026-000042/i)).toBeInTheDocument();
    });
  });

});
