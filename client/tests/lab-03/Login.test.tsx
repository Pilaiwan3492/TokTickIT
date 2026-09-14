import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Login from "../../src/pages/Login";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";

const renderLoginWithRouter = (initialRoute = "/login") => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/tickets" element={<div>My Tickets Page</div>} />
          <Route path="/queue" element={<div>Staff Queue Page</div>} />
          <Route path="/change-password" element={<div>Change Password Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Login Screen & Authentication Tests (Lab 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // UI-01: Login screen initial render in Zen Green style
  it("UI-01: renders the login screen with email, password inputs, toggle, and Sign In button", () => {
    renderLoginWithRouter();

    expect(screen.getByRole("heading", { name: /TokTickIT/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /^Sign In$/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveStyle({ backgroundColor: "#006B3C" });

    // Password visibility toggle test
    const passwordInput = screen.getByLabelText(/^Password$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // UI-02: Client validation on empty email or password
  it("UI-02: prevents API call and displays client validation errors on empty email or password", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderLoginWithRouter();

    const submitBtn = screen.getByRole("button", { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // UI-03: Login error banner on INVALID_CREDENTIALS
  it("UI-03: displays safe error banner 'Invalid email or password. Please try again.' on INVALID_CREDENTIALS", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password. Please try again.",
        },
      }),
    } as Response);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "bob@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "WrongPassword!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    expect(
      await screen.findByText("Invalid email or password. Please try again.")
    ).toBeInTheDocument();
  });

  // UI-04: Login error banner on ACCOUNT_INACTIVE
  it("UI-04: displays safe error banner 'Your account is currently inactive. Please contact an administrator.' on ACCOUNT_INACTIVE", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: "ACCOUNT_INACTIVE",
          message: "Your account is currently inactive. Please contact an administrator.",
        },
      }),
    } as Response);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "eve.inactive@toktickit.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    expect(
      await screen.findByText(
        "Your account is currently inactive. Please contact an administrator."
      )
    ).toBeInTheDocument();
  });

  // UI-05: Form submission busy state
  it("UI-05: disables submit button and renders spinner while login request is in-flight", async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => loginPromise as any);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "bob@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });

    const submitBtn = screen.getByRole("button", { name: /^Sign In$/i });
    fireEvent.click(submitBtn);

    // Button should be disabled and show busy text
    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Signing in\.\.\./i)).toBeInTheDocument();

    // Resolve login to finish clean
    resolveLogin!({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: "jwt-token-123",
          user: {
            id: "usr-1",
            email: "bob@example.com",
            name: "Bob Smith",
            role: "REQUESTER",
            isActive: true,
            mustChangePassword: false,
          },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.getByText("My Tickets Page")).toBeInTheDocument();
    });
  });

  // UI-06: Successful login navigates to role landing page and saves token
  it("UI-06a: navigates Requester to /tickets on successful login and stores token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: "requester-jwt-token",
          user: {
            id: "usr-bob-id",
            email: "bob@example.com",
            name: "Bob Smith",
            role: "REQUESTER",
            isActive: true,
            mustChangePassword: false,
          },
        },
      }),
    } as Response);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "Bob@Example.com " }, // Test trimming and lowercasing
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText("My Tickets Page")).toBeInTheDocument();
    });

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("requester-jwt-token");
  });

  it("UI-06b: navigates IT_STAFF to /queue on successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: "staff-jwt-token",
          user: {
            id: "usr-michael-id",
            email: "michael.brown@toktickit.com",
            name: "Michael Brown",
            role: "IT_STAFF",
            isActive: true,
            mustChangePassword: false,
          },
        },
      }),
    } as Response);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "michael.brown@toktickit.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText("Staff Queue Page")).toBeInTheDocument();
    });
  });

  it("UI-06c: navigates ADMIN to /queue on successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: "admin-jwt-token",
          user: {
            id: "usr-sarah-id",
            email: "sarah.admin@toktickit.com",
            name: "Sarah Admin",
            role: "ADMIN",
            isActive: true,
            mustChangePassword: false,
          },
        },
      }),
    } as Response);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "sarah.admin@toktickit.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText("Staff Queue Page")).toBeInTheDocument();
    });
  });

  it("UI-06d: navigates user with mustChangePassword = true to /change-password on successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          token: "must-change-token",
          user: {
            id: "usr-alice-id",
            email: "alice@example.com",
            name: "Alice Johnson",
            role: "REQUESTER",
            isActive: true,
            mustChangePassword: true,
          },
        },
      }),
    } as Response);

    renderLoginWithRouter();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "InitialPass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(screen.getByText("Change Password Page")).toBeInTheDocument();
    });
  });
});
