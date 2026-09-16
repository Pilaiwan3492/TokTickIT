import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/AuthContext";
import { TOKEN_STORAGE_KEY } from "../../src/api/auth.api";
import UserManagement from "../../src/pages/UserManagement";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AdminUser } from "../../src/types/admin";

const mockAdminUser = {
  id: "usr-admin-1",
  name: "Alex Administrator",
  email: "admin.primary@toktickit.com",
  role: "ADMIN" as const,
  isActive: true,
  mustChangePassword: false,
};

const mockSecondaryAdmin: AdminUser = {
  id: "usr-admin-2",
  name: "Sarah SecondAdmin",
  email: "admin.secondary@toktickit.com",
  role: "ADMIN",
  isActive: true,
  mustChangePassword: false,
  createdAt: "2026-09-01T10:00:00.000Z",
};

const mockStaffUser: AdminUser = {
  id: "usr-staff-1",
  name: "Samuel Staff",
  email: "staff@toktickit.com",
  role: "IT_STAFF",
  isActive: true,
  mustChangePassword: false,
  createdAt: "2026-09-02T10:00:00.000Z",
};

const mockRequesterUser: AdminUser = {
  id: "usr-req-1",
  name: "Rachel Requester",
  email: "requester@example.com",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: true,
  createdAt: "2026-09-03T10:00:00.000Z",
};

const mockUsersList: AdminUser[] = [
  {
    id: mockAdminUser.id,
    name: mockAdminUser.name,
    email: mockAdminUser.email,
    role: "ADMIN",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T09:00:00.000Z",
  },
  mockSecondaryAdmin,
  mockStaffUser,
  mockRequesterUser,
];

describe("Administrator User Management UI Tests (Lab 3 — Issue 27: UI-26..UI-30)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem(TOKEN_STORAGE_KEY, "test-admin-jwt-token");
  });

  const renderAdminPage = (userProfile = mockAdminUser) =>
    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="/queue" element={<div>Staff Queue Fallback</div>} />
            <Route path="/tickets" element={<div>Requester Tickets Fallback</div>} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

  // --- UI-26: Administrator views User Management screen ---
  it("UI-26: should render User Management screen with safe fields, role filter, desktop table and mobile list", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAdminUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUsersList }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    // Verify Title & Subtitle
    await waitFor(() => {
      expect(screen.getByText("User Management")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Manage user accounts, assign system roles, and configure access security/i)
    ).toBeInTheDocument();

    // Verify Create User button is present
    expect(screen.getByTestId("btn-open-create-user")).toBeInTheDocument();

    // Verify Role Filter select exists with Canonical Roles
    const roleFilter = screen.getByTestId("admin-role-filter-select");
    expect(roleFilter).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All Roles" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Requester" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "IT Staff" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Administrator" })).toBeInTheDocument();

    // Verify Desktop Table renders with safe user fields
    await waitFor(() => {
      expect(screen.getByTestId("admin-desktop-user-table")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Alex Administrator").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin.primary@toktickit.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rachel Requester").length).toBeGreaterThan(0);
    expect(screen.getAllByText("requester@example.com").length).toBeGreaterThan(0);

    // Verify Mobile list is also rendered in DOM with touch-friendly elements
    expect(screen.getByTestId("admin-mobile-user-list")).toBeInTheDocument();
    expect(screen.getByTestId(`mobile-btn-edit-user-${mockStaffUser.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`mobile-btn-reset-user-${mockStaffUser.id}`)).toBeInTheDocument();
  });

  // --- UI-27: Search & Role Filter with Debounce and Empty State ---
  it("UI-27: should trigger search with debounce, filter by role, and display empty state when no matches", async () => {
    let capturedUrl = "";
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      capturedUrl = urlStr;
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAdminUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users")) {
        if (urlStr.includes("search=nonexistent")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ data: [] }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUsersList }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getAllByText("Alex Administrator").length).toBeGreaterThan(0);
    });

    // 1. Enter search text
    const searchInput = screen.getByTestId("admin-user-search-input");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    // Wait for 300ms debounce
    await waitFor(
      () => {
        expect(capturedUrl).toContain("search=nonexistent");
      },
      { timeout: 1000 }
    );

    // Empty state should appear
    await waitFor(() => {
      expect(screen.getByTestId("admin-empty-state")).toBeInTheDocument();
      expect(screen.getByText("No users found")).toBeInTheDocument();
    });

    // 2. Filter by role
    fireEvent.change(screen.getByTestId("admin-role-filter-select"), {
      target: { value: "IT_STAFF" },
    });

    await waitFor(() => {
      expect(capturedUrl).toContain("role=IT_STAFF");
    });
  });

  // --- UI-28: Create User Modal with Password Complexity ---
  it("UI-28: should open Create User modal, enforce password complexity rules, and submit new user", async () => {
    let createdPayload: any = null;
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, opts: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAdminUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users") && opts?.method === "POST") {
        createdPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "usr-new-1",
              name: createdPayload.name,
              email: createdPayload.email,
              role: createdPayload.role,
              isActive: createdPayload.isActive,
              mustChangePassword: true,
              createdAt: new Date().toISOString(),
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUsersList }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId("btn-open-create-user")).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByTestId("btn-open-create-user"));
    expect(screen.getByTestId("admin-create-user-modal")).toBeInTheDocument();

    const submitBtn = screen.getByTestId("btn-submit-create-user");
    // Initially disabled because password is empty
    expect(submitBtn).toBeDisabled();

    // Fill in Name and Email
    fireEvent.change(screen.getByTestId("input-create-name"), {
      target: { value: "New IT Engineer" },
    });
    fireEvent.change(screen.getByTestId("input-create-email"), {
      target: { value: "new.engineer@toktickit.com" },
    });
    fireEvent.change(screen.getByTestId("select-create-role"), {
      target: { value: "IT_STAFF" },
    });

    // Enter weak password
    const pwdInput = screen.getByTestId("input-create-password");
    fireEvent.change(pwdInput, { target: { value: "weak" } });
    expect(submitBtn).toBeDisabled();

    // Enter valid complex password meeting all criteria
    fireEvent.change(pwdInput, { target: { value: "InitialStrong123!" } });
    expect(submitBtn).not.toBeDisabled();

    // Submit form
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createdPayload).toEqual({
        name: "New IT Engineer",
        email: "new.engineer@toktickit.com",
        role: "IT_STAFF",
        initialPassword: "InitialStrong123!",
        isActive: true,
      });
    });

    // Verify success banner
    await waitFor(() => {
      expect(screen.getByTestId("admin-success-alert")).toBeInTheDocument();
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
  });

  // --- UI-28: Edit User Modal: Self-deactivation disabled ---
  it("UI-28: should disable Active toggle and show notice when administrator edits own account", async () => {
    let updatedPayload: any = null;
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, opts: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAdminUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users/usr-staff-1") && opts?.method === "PATCH") {
        updatedPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...mockStaffUser,
              ...updatedPayload,
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUsersList }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId(`btn-edit-user-${mockAdminUser.id}`)).toBeInTheDocument();
    });

    // 1. Open edit modal on current admin
    fireEvent.click(screen.getByTestId(`btn-edit-user-${mockAdminUser.id}`));
    expect(screen.getByTestId("admin-edit-user-modal")).toBeInTheDocument();

    // Active toggle must be disabled for self with self-deactivation notice
    const activeSwitch = screen.getByTestId("switch-edit-active");
    expect(activeSwitch).toBeDisabled();
    expect(screen.getByTestId("self-deactivation-notice")).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByText("Cancel"));

    // 2. Editing other non-admin user has active switch enabled
    fireEvent.click(screen.getByTestId(`btn-edit-user-${mockStaffUser.id}`));
    expect(screen.getByTestId("admin-edit-user-modal")).toBeInTheDocument();

    const staffActiveSwitch = screen.getByTestId("switch-edit-active");
    expect(staffActiveSwitch).not.toBeDisabled();

    // Change Name and submit
    fireEvent.change(screen.getByTestId("input-edit-name"), {
      target: { value: "Samuel Staff Senior" },
    });
    fireEvent.click(screen.getByTestId("btn-submit-edit-user"));

    await waitFor(() => {
      expect(updatedPayload).toEqual({
        name: "Samuel Staff Senior",
        email: mockStaffUser.email,
        role: "IT_STAFF",
        isActive: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("admin-success-alert")).toBeInTheDocument();
    });
  });

  // --- UI-29: Edit User Modal: Last admin deactivation disabled ---
  it("UI-29: should disable Active toggle and show last-admin guard notice when editing the last active administrator", async () => {
    // Single active admin system
    const singleAdminList = [mockAdminUser, mockStaffUser, mockRequesterUser];

    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAdminUser }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: singleAdminList }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId(`btn-edit-user-${mockAdminUser.id}`)).toBeInTheDocument();
    });

    // Open edit modal on the sole active admin
    fireEvent.click(screen.getByTestId(`btn-edit-user-${mockAdminUser.id}`));
    expect(screen.getByTestId("admin-edit-user-modal")).toBeInTheDocument();

    // Active toggle must be disabled
    const activeSwitch = screen.getByTestId("switch-edit-active");
    expect(activeSwitch).toBeDisabled();

    // Must display last-admin guard notice in DOM
    expect(screen.getByTestId("last-admin-guard-notice")).toBeInTheDocument();
    expect(screen.getByText(/LAST_ACTIVE_ADMIN_PROTECTED/i)).toBeInTheDocument();
  });

  // --- UI-30: Reset Initial Password Modal ---
  it("UI-30: should open Reset Initial Password modal, require complexity, and invalidate sessions", async () => {
    let resetPayload: any = null;
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL, opts: any) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockAdminUser }),
        } as Response);
      }
      if (urlStr.includes(`/api/v1/admin/users/${mockStaffUser.id}/reset-password`) && opts?.method === "POST") {
        resetPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              message: "Initial password reset successfully. User must change password upon next login.",
            },
          }),
        } as Response);
      }
      if (urlStr.includes("/api/v1/admin/users")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockUsersList }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId(`btn-reset-user-${mockStaffUser.id}`)).toBeInTheDocument();
    });

    // Open Reset Password modal
    fireEvent.click(screen.getByTestId(`btn-reset-user-${mockStaffUser.id}`));
    expect(screen.getByTestId("admin-reset-password-modal")).toBeInTheDocument();
    expect(screen.getByText(/Resetting password for/i)).toBeInTheDocument();
    expect(screen.getByText(/Security Notice/i)).toBeInTheDocument();

    const submitResetBtn = screen.getByTestId("btn-submit-reset-password");
    expect(submitResetBtn).toBeDisabled();

    // Enter weak password
    fireEvent.change(screen.getByTestId("input-reset-password"), {
      target: { value: "weakpwd" },
    });
    expect(submitResetBtn).toBeDisabled();

    // Enter valid complex password
    fireEvent.change(screen.getByTestId("input-reset-password"), {
      target: { value: "NewResetPass456!" },
    });
    expect(submitResetBtn).not.toBeDisabled();

    // Submit reset
    fireEvent.click(submitResetBtn);

    await waitFor(() => {
      expect(resetPayload).toEqual({
        newInitialPassword: "NewResetPass456!",
      });
    });

    // Verify success banner informs admin
    await waitFor(() => {
      expect(screen.getByTestId("admin-success-alert")).toBeInTheDocument();
      expect(screen.getByTestId("admin-success-alert")).toHaveTextContent(
        /Initial password reset successfully/i
      );
    });
  });

  // --- Non-Admin Access Control ---
  it("should redirect non-admin users away from /admin/users", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/v1/auth/me")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              id: "usr-requester-1",
              name: "Rachel Requester",
              email: "rachel@example.com",
              role: "REQUESTER",
              isActive: true,
              mustChangePassword: false,
            },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response);
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Requester Tickets Fallback")).toBeInTheDocument();
    });
  });
});
