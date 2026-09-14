import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";

const renderRouteWithUser = (user: any | null, initialRoute = "/protected", allowedRoles?: any[], allowPasswordChangeGated = false) => {
  if (user) {
    localStorage.setItem(TOKEN_STORAGE_KEY, "valid-test-token");
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: user }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page Target</div>} />
          <Route path="/change-password" element={<div>Change Password Gated Target</div>} />
          <Route path="/tickets" element={<div>Requester Tickets Page</div>} />
          <Route path="/queue" element={<div>Staff Queue Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={allowedRoles} allowPasswordChangeGated={allowPasswordChangeGated}>
                <div>Secret Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("ProtectedRoute Component Tests (Lab 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("1. redirects unauthenticated user to /login", async () => {
    renderRouteWithUser(null);
    expect(await screen.findByText("Login Page Target")).toBeInTheDocument();
    expect(screen.queryByText("Secret Protected Content")).not.toBeInTheDocument();
  });

  it("2. allows authenticated Requester to access Requester-protected route", async () => {
    renderRouteWithUser(
      {
        id: "usr-1",
        email: "bob@example.com",
        name: "Bob Smith",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      },
      "/protected",
      ["REQUESTER"]
    );

    expect(await screen.findByText("Secret Protected Content")).toBeInTheDocument();
  });

  it("3. allows authenticated IT Staff to access IT_STAFF-protected route", async () => {
    renderRouteWithUser(
      {
        id: "usr-2",
        email: "michael@toktickit.com",
        name: "Michael Brown",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
      },
      "/protected",
      ["IT_STAFF", "ADMIN"]
    );

    expect(await screen.findByText("Secret Protected Content")).toBeInTheDocument();
  });

  it("4. redirects user with mustChangePassword = true to /change-password", async () => {
    renderRouteWithUser(
      {
        id: "usr-alice",
        email: "alice@example.com",
        name: "Alice Johnson",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
      },
      "/protected",
      ["REQUESTER"]
    );

    expect(await screen.findByText("Change Password Gated Target")).toBeInTheDocument();
    expect(screen.queryByText("Secret Protected Content")).not.toBeInTheDocument();
  });

  it("5. allows user with mustChangePassword = true to view /change-password when allowPasswordChangeGated = true", async () => {
    renderRouteWithUser(
      {
        id: "usr-alice",
        email: "alice@example.com",
        name: "Alice Johnson",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
      },
      "/protected",
      undefined,
      true // allowPasswordChangeGated
    );

    expect(await screen.findByText("Secret Protected Content")).toBeInTheDocument();
  });

  it("6. blocks Requester from accessing IT_STAFF/ADMIN route and redirects to role landing page (/tickets)", async () => {
    renderRouteWithUser(
      {
        id: "usr-bob",
        email: "bob@example.com",
        name: "Bob Smith",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      },
      "/protected",
      ["IT_STAFF", "ADMIN"]
    );

    expect(await screen.findByText("Requester Tickets Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Protected Content")).not.toBeInTheDocument();
  });

  it("7. blocks IT_STAFF from accessing ADMIN-only route and redirects to /queue", async () => {
    renderRouteWithUser(
      {
        id: "usr-michael",
        email: "michael@toktickit.com",
        name: "Michael Brown",
        role: "IT_STAFF",
        isActive: true,
        mustChangePassword: false,
      },
      "/protected",
      ["ADMIN"]
    );

    expect(await screen.findByText("Staff Queue Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Protected Content")).not.toBeInTheDocument();
  });

  it("8. blocks ADMIN from accessing REQUESTER-only route and redirects to /queue", async () => {
    renderRouteWithUser(
      {
        id: "usr-sarah",
        email: "sarah@toktickit.com",
        name: "Sarah Admin",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: false,
      },
      "/protected",
      ["REQUESTER"]
    );

    expect(await screen.findByText("Staff Queue Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Protected Content")).not.toBeInTheDocument();
  });

  it("9. renders loading spinner during initial session hydration without flashing protected content", () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "some-token");

    // Mock fetch that hangs to inspect loading state
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthProvider>
          <ProtectedRoute>
            <div>Should Not Flash</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Should Not Flash")).not.toBeInTheDocument();
  });
});
