import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext Unit Tests (Lab 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("1. initializes as unauthenticated when localStorage has no token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBeNull();
  });

  it("2. hydrates session successfully when valid token exists in localStorage", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "initial-valid-token");

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: "usr-hydrated-1",
            email: "bob@example.com",
            name: "Bob Smith",
            role: "REQUESTER",
            isActive: true,
            mustChangePassword: false,
          },
        }),
      } as Response)
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("initial-valid-token");
    expect(result.current.user?.email).toBe("bob@example.com");
    expect(result.current.role).toBe("REQUESTER");
  });

  it("3. purges token and resets session when /auth/me rejects with revoked/invalid token", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "revoked-or-invalid-token");

    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: "SESSION_REVOKED", message: "Token has been revoked." },
        }),
      } as Response)
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("4. updates state and persists token upon login()", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            token: "newly-issued-jwt",
            user: {
              id: "usr-login-1",
              email: "michael@toktickit.com",
              name: "Michael Brown",
              role: "IT_STAFF",
              isActive: true,
              mustChangePassword: false,
            },
          },
        }),
      } as Response)
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login({
        email: "michael@toktickit.com",
        password: "Password123!",
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe("newly-issued-jwt");
    expect(result.current.user?.name).toBe("Michael Brown");
    expect(result.current.role).toBe("IT_STAFF");
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("newly-issued-jwt");
  });

  it("5. clears local session completely upon logout() even if server request fails", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "active-jwt-token");

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: "usr-active",
              email: "bob@example.com",
              name: "Bob Smith",
              role: "REQUESTER",
              isActive: true,
              mustChangePassword: false,
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/auth/logout")) {
        return Promise.reject(new Error("Network disconnect"));
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("6. updates mustChangePassword = false upon changePassword()", async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, "alice-jwt-token");

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: "usr-alice",
              email: "alice@example.com",
              name: "Alice Johnson",
              role: "REQUESTER",
              isActive: true,
              mustChangePassword: false, // After change
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/auth/change-password")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { message: "Password updated." } }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.changePassword({
        currentPassword: "InitialPass123!",
        newPassword: "NewSecurePass123!",
        confirmPassword: "NewSecurePass123!",
      });
    });

    expect(result.current.mustChangePassword).toBe(false);
  });

  // Critical Invariant: legacy selector in localStorage does NOT create authenticated session in AuthContext
  it("7. SECURITY INVARIANT: toktickit_selected_requester alone does NOT create an authenticated AuthContext session", async () => {
    localStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({
        id: 99,
        name: "Legacy Requester",
        email: "legacy@example.com",
        isActive: true,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // In production AuthContext, absence of toktickit_auth_token means strictly unauthenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
  });
});
