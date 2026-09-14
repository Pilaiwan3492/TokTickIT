import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ChangePassword from "../../src/pages/ChangePassword";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";

const renderChangePasswordWithRouter = () => {
  return render(
    <MemoryRouter initialEntries={["/change-password"]}>
      <AuthProvider>
        <Routes>
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/tickets" element={<div>My Tickets Page</div>} />
          <Route path="/queue" element={<div>Staff Queue Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Mandatory Password Change Screen Tests (Lab 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-active-bearer-token");

    // Mock initial /auth/me call during AuthContext hydration
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: "usr-alice-id",
              email: "alice@example.com",
              name: "Alice Johnson",
              role: "REQUESTER",
              isActive: true,
              mustChangePassword: true,
            },
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: {} }),
      } as Response);
    });
  });

  // UI-07: Mandatory change password screen rendering
  it("UI-07: renders current, new, and confirm password fields with requirements checklist", async () => {
    renderChangePasswordWithRouter();

    expect(await screen.findByRole("heading", { name: /Change Your Password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Current Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password$/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole("button", { name: /^Continue$/i });
    expect(continueBtn).toBeInTheDocument();
    expect(continueBtn).toBeDisabled();
  });

  // UI-08: Real-time password complexity rule checklist
  it("UI-08: dynamically updates checklist indicators as password satisfies complexity rules", async () => {
    renderChangePasswordWithRouter();

    await screen.findByRole("heading", { name: /Change Your Password/i });

    const newPasswordInput = screen.getByLabelText(/^New Password$/i);

    // Initial state: not met
    expect(screen.getByText(/At least 8 characters/i).parentElement).not.toHaveClass("text-success");
    expect(screen.getByText(/Include uppercase and lowercase letters/i).parentElement).not.toHaveClass("text-success");
    expect(screen.getByText(/Include a number and a special character/i).parentElement).not.toHaveClass("text-success");

    // 1. Length met (all lowercase, no numbers/symbols)
    fireEvent.change(newPasswordInput, { target: { value: "abcdefgh" } });
    expect(screen.getByText(/At least 8 characters/i).parentElement).toHaveClass("text-success");
    expect(screen.getByText(/Include uppercase and lowercase letters/i).parentElement).not.toHaveClass("text-success");

    // 2. Uppercase and lowercase added
    fireEvent.change(newPasswordInput, { target: { value: "Abcdefgh" } });
    expect(screen.getByText(/Include uppercase and lowercase letters/i).parentElement).toHaveClass("text-success");
    expect(screen.getByText(/Include a number and a special character/i).parentElement).not.toHaveClass("text-success");

    // 3. Number and special character added
    fireEvent.change(newPasswordInput, { target: { value: "Password123!" } });
    expect(screen.getByText(/At least 8 characters/i).parentElement).toHaveClass("text-success");
    expect(screen.getByText(/Include uppercase and lowercase letters/i).parentElement).toHaveClass("text-success");
    expect(screen.getByText(/Include a number and a special character/i).parentElement).toHaveClass("text-success");
  });

  // UI-09: Password confirmation mismatch validation
  it("UI-09: displays mismatch error and keeps submit button disabled when passwords do not match", async () => {
    renderChangePasswordWithRouter();

    await screen.findByRole("heading", { name: /Change Your Password/i });

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "NewSecurePass123!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "MismatchedPass123!" },
    });

    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continue$/i })).toBeDisabled();
  });

  // UI-10: Successful password change unblocks user and navigates to role landing page
  it("UI-10: submits password change API, unlocks mustChangePassword, and navigates to /tickets", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: "usr-alice-id",
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
          json: async () => ({
            data: { message: "Password changed successfully." },
          }),
        } as Response);
      }

      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderChangePasswordWithRouter();

    await screen.findByRole("heading", { name: /Change Your Password/i });

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: "InitialPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "NewSecurePassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "NewSecurePassword123!" },
    });

    const continueBtn = screen.getByRole("button", { name: /^Continue$/i });
    expect(continueBtn).not.toBeDisabled();

    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByText("My Tickets Page")).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/v1/auth/change-password",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-active-bearer-token",
        }),
      })
    );
  });

  // UI-10a: Wrong current password displays safe error
  it("UI-10a: displays safe error banner when current password is wrong", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/change-password")) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              code: "INVALID_CURRENT_PASSWORD",
              message: "Current password is incorrect.",
            },
          }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: "usr-alice-id",
            email: "alice@example.com",
            name: "Alice Johnson",
            role: "REQUESTER",
            isActive: true,
            mustChangePassword: true,
          },
        }),
      } as Response);
    });

    renderChangePasswordWithRouter();

    await screen.findByRole("heading", { name: /Change Your Password/i });

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: "WrongCurrentPass!" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "NewSecurePassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "NewSecurePassword123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Continue$/i }));

    expect(await screen.findByText("Current password is incorrect.")).toBeInTheDocument();
  });

  // UI-10c: Submission button remains disabled while request is pending
  it("UI-10c: disables submit button and shows loading text during in-flight submission", async () => {
    let resolveChange: (value: any) => void;
    const changePromise = new Promise((resolve) => {
      resolveChange = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/change-password")) {
        return changePromise as any;
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: "usr-alice-id",
            email: "alice@example.com",
            name: "Alice Johnson",
            role: "REQUESTER",
            isActive: true,
            mustChangePassword: true,
          },
        }),
      } as Response);
    });

    renderChangePasswordWithRouter();

    await screen.findByRole("heading", { name: /Change Your Password/i });

    fireEvent.change(screen.getByLabelText(/^Current Password$/i), {
      target: { value: "OldPassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), {
      target: { value: "NewSecurePassword123!" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm New Password$/i), {
      target: { value: "NewSecurePassword123!" },
    });

    const submitBtn = screen.getByRole("button", { name: /^Continue$/i });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(screen.getByText(/Updating password\.\.\./i)).toBeInTheDocument();

    resolveChange!({
      ok: true,
      status: 200,
      json: async () => ({ data: { message: "Password updated." } }),
    });

    await waitFor(() => {
      expect(screen.getByText("My Tickets Page")).toBeInTheDocument();
    });
  });
});
