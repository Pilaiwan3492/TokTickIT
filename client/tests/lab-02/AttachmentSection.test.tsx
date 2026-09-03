import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CreateTicket from "../../src/pages/CreateTicket";
import TicketDetail from "../../src/pages/TicketDetail";
import { RequesterProvider } from "../../src/context/RequesterContext";

// Mock localStorage for requester context
const mockRequester = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@example.com",
};

describe("Attachment Section & Upload UI Tests (Lab 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequester));

    // Mock global fetch
    globalThis.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const urlStr = url.toString();

      if (urlStr.includes("/api/v1/categories")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ id: 1, name: "Hardware", isActive: true }],
          }),
        });
      }

      if (urlStr.includes("/api/v1/related-systems")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ id: 1, name: "Corporate Laptop", isActive: true }],
          }),
        });
      }

      if (urlStr.includes("/api/v1/requesters/active")) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockRequester],
        });
      }

      if (urlStr.includes("/api/v1/tickets/test-ticket-1") && !init?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              id: "test-ticket-1",
              ticketNo: "TKT-2026-000001",
              summary: "Sample laptop issue",
              description: "Battery drain issue described here.",
              requestedPriority: "HIGH",
              currentStatus: "NEW",
              createdAt: "2026-08-25T00:00:00.000Z",
              updatedAt: "2026-08-25T00:00:00.000Z",
              category: { id: 1, name: "Hardware" },
              relatedSystem: { id: 1, name: "Corporate Laptop" },
              attachments: [
                {
                  id: "att-1",
                  fileName: "existing-log.png",
                  fileSize: 10240,
                  mimeType: "image/png",
                  uploadedAt: "2026-08-25T00:00:00.000Z",
                  removedAt: null,
                },
              ],
            },
          }),
        });
      }

      if (urlStr.includes("/api/v1/tickets/max-ticket-5") && !init?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              id: "max-ticket-5",
              ticketNo: "TKT-2026-000005",
              summary: "Ticket with 5 attachments",
              description: "Ticket with maximum active attachments.",
              requestedPriority: "MEDIUM",
              currentStatus: "NEW",
              createdAt: "2026-08-25T00:00:00.000Z",
              updatedAt: "2026-08-25T00:00:00.000Z",
              attachments: [1, 2, 3, 4, 5].map((i) => ({
                id: `att-${i}`,
                fileName: `file-${i}.png`,
                fileSize: 2048,
                mimeType: "image/png",
                uploadedAt: "2026-08-25T00:00:00.000Z",
                removedAt: null,
              })),
            },
          }),
        });
      }

      if (urlStr.includes("/attachments") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "new-att-id",
              fileName: "uploaded.png",
              fileSize: 1024,
              mimeType: "image/png",
              uploadedAt: new Date().toISOString(),
              removedAt: null,
              removalReason: null,
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

  // ---------------------------------------------------------
  // CreateTicket Attachment Section Tests
  // ---------------------------------------------------------

  it("renders attachment upload area and file constraints in CreateTicket", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("attachment-dropzone")).toBeInTheDocument();
    expect(screen.getByText(/Allowed: JPG, JPEG, PNG, WEBP, PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum: 5 MB per file/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum: 5 active attachments/i)).toBeInTheDocument();
  });

  it("allows selecting a valid file and removes it on Remove click", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    const file = new File(["dummy content"], "error-screen.png", { type: "image/png" });
    const dropzone = screen.getByTestId("attachment-dropzone");
    const input = dropzone.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/error-screen\.png/i)).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText(/error-screen\.png/i)).not.toBeInTheDocument();
    });
  });

  it("rejects unsupported file type (.exe) with an error message", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    const file = new File(["fake binary"], "malware.exe", { type: "application/x-msdownload" });
    const dropzone = screen.getByTestId("attachment-dropzone");
    const input = dropzone.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/This file type is not supported/i)
      ).toBeInTheDocument();
    });
  });

  it("rejects file larger than 5 MB with an error message", async () => {
    render(
      <MemoryRouter>
        <RequesterProvider>
          <CreateTicket />
        </RequesterProvider>
      </MemoryRouter>
    );

    // Create a 6MB file
    const oversizedFile = new File([new Uint8Array(6 * 1024 * 1024)], "oversized.pdf", {
      type: "application/pdf",
    });
    const dropzone = screen.getByTestId("attachment-dropzone");
    const input = dropzone.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(input, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/File size must not exceed 5 MiB/i)
      ).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // TicketDetail Attachment Management Tests
  // ---------------------------------------------------------

  it("renders Add Attachment button and active count in TicketDetail", async () => {
    render(
      <MemoryRouter initialEntries={["/tickets/test-ticket-1"]}>
        <RequesterProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/existing-log\.png/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /\+ Add Attachment/i })).toBeInTheDocument();
    expect(screen.getByText(/\(1\/5 active\)/i)).toBeInTheDocument();
  });

  it("disables Add Attachment button when ticket already has 5 active attachments", async () => {
    render(
      <MemoryRouter initialEntries={["/tickets/max-ticket-5"]}>
        <RequesterProvider>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Routes>
        </RequesterProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/file-5\.png/i)).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /\+ Add Attachment/i });
    expect(addBtn).toBeDisabled();
    expect(
      screen.getByText(/This ticket already has the maximum number of active attachments/i)
    ).toBeInTheDocument();
  });
});
