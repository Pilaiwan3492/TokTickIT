import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Header } from "../../src/components/Header";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";

const renderHeaderWithUser = (user: any, token = "valid-test-token") => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
    const urlStr = url.toString();
    if (urlStr.includes("/api/v1/auth/me")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: user }),
      } as Response);
    }
    if (urlStr.includes("/api/v1/auth/logout")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: { message: "Logged out." } }),
      } as Response);
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
  });

  const utils = render(
    <MemoryRouter initialEntries={["/"]}>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<div>Current Page Content</div>} />
          <Route path="/login" element={<div>Login Screen Redirected</div>} />
          <Route path="/tickets" element={<div>My Tickets Page</div>} />
          <Route path="/queue" element={<div>Queue Page</div>} />
          <Route path="/change-password" element={<div>Change Password Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  return { ...utils, fetchSpy };
};

describe("Application Shell & Navigation Tests (Lab 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // UI-11a: Requester role navigation rendering
  it("UI-11a: renders Requester navigation (My Tickets, Create Ticket) and hides Staff/Admin links", async () => {
    renderHeaderWithUser({
      id: "usr-bob-id",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    });

    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("Requester")).toBeInTheDocument();
    expect(screen.getByText("BS")).toBeInTheDocument(); // Initials avatar

    // Permitted links
    expect(screen.getByRole("link", { name: /My Tickets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create Ticket/i })).toBeInTheDocument();

    // Forbidden links for Requester
    expect(screen.queryByRole("link", { name: /Ticket Queue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /User Management/i })).not.toBeInTheDocument();

    // Confirms absence of the old dev selector
    expect(screen.queryByText(/Change Requester/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Current Active Requester/i)).not.toBeInTheDocument();
  });

  // UI-11b: IT Staff role navigation rendering
  it("UI-11b: renders IT Staff navigation (Ticket Queue) and hides Create Ticket & User Management", async () => {
    renderHeaderWithUser({
      id: "usr-michael-id",
      name: "Michael Brown",
      email: "michael.brown@toktickit.com",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    });

    expect(await screen.findByText("Michael Brown")).toBeInTheDocument();
    expect(screen.getByText("IT Staff")).toBeInTheDocument();
    expect(screen.getByText("MB")).toBeInTheDocument();

    // Permitted links
    expect(screen.getByRole("link", { name: /Ticket Queue/i })).toBeInTheDocument();

    // Forbidden links for IT Staff in Issue 24
    expect(screen.queryByRole("link", { name: /My Tickets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Create Ticket/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /User Management/i })).not.toBeInTheDocument();
  });

  // UI-11c: Administrator role navigation rendering
  it("UI-11c: renders Admin navigation (Ticket Queue, User Management) and hides Requester links", async () => {
    renderHeaderWithUser({
      id: "usr-sarah-id",
      name: "Sarah Admin",
      email: "sarah.admin@toktickit.com",
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    });

    expect(await screen.findByText("Sarah Admin")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("SA")).toBeInTheDocument();

    // Permitted links
    expect(screen.getByRole("link", { name: /Ticket Queue/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /User Management/i })).toBeInTheDocument();

    // Forbidden links for Admin
    expect(screen.queryByRole("link", { name: /My Tickets/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Create Ticket/i })).not.toBeInTheDocument();
  });

  // UI-12: User clicks Sign Out action in header
  it("UI-12: invokes logout API, clears token from localStorage, and redirects to /login", async () => {
    const { fetchSpy } = renderHeaderWithUser({
      id: "usr-bob-id",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    });

    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();

    // Open profile dropdown
    const profileBtn = screen.getByRole("button", { name: /Bob Smith/i });
    fireEvent.click(profileBtn);

    // Profile details in dropdown
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Change Password/i })).toBeInTheDocument();

    // Click Sign Out
    const signOutBtn = screen.getByRole("button", { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    await waitFor(() => {
      expect(screen.getByText("Login Screen Redirected")).toBeInTheDocument();
    });

    // Token purged from localStorage
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();

    // Assert logout API dispatched with Bearer token
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer valid-test-token",
        }),
      })
    );
  });

  // UI-12a: Logout clears local session even if backend request fails
  it("UI-12a: clears local storage session even if backend logout throws a network error", async () => {
    const { fetchSpy } = renderHeaderWithUser({
      id: "usr-bob-id",
      name: "Bob Smith",
      email: "bob@example.com",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    });

    expect(await screen.findByText("Bob Smith")).toBeInTheDocument();

    fetchSpy.mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/logout")) {
        return Promise.reject(new Error("Network disconnect"));
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    fireEvent.click(screen.getByRole("button", { name: /Bob Smith/i }));
    fireEvent.click(screen.getByRole("button", { name: /Sign Out/i }));

    await waitFor(() => {
      expect(screen.getByText("Login Screen Redirected")).toBeInTheDocument();
    });

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
