import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { AdminUser, CreateUserPayload, UpdateUserPayload } from "../types/admin";
import { UserRole } from "../types/auth";
import {
  listUsersApi,
  createUserApi,
  updateUserApi,
  resetUserPasswordApi,
  AdminApiError,
} from "../api/admin.api";

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("REQUESTER");
  const [createPassword, setCreatePassword] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("REQUESTER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset Password State
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Search Debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listUsersApi(debouncedSearch, roleFilter);
      setUsers(data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load user accounts.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Independent Active Admin Count across whole database (immune to current search/role filter)
  const [totalActiveAdminCount, setTotalActiveAdminCount] = useState<number>(1);

  const refreshActiveAdminCount = useCallback(async () => {
    try {
      const allAdmins = await listUsersApi("", "ADMIN");
      const count = allAdmins.filter((u) => u.role === "ADMIN" && u.isActive).length;
      setTotalActiveAdminCount(count);
    } catch {
      // fallback to current users count if error
    }
  }, []);

  useEffect(() => {
    refreshActiveAdminCount();
  }, [refreshActiveAdminCount]);

  const activeAdminCount = totalActiveAdminCount;

  // Password Policy Checks (for create & reset)
  const validateComplexity = (pwd: string) => {
    return {
      hasMinLength: pwd.length >= 8,
      hasUpperAndLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
      hasNumberAndSymbol: /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd),
      isAllMet:
        pwd.length >= 8 &&
        /[a-z]/.test(pwd) &&
        /[A-Z]/.test(pwd) &&
        /\d/.test(pwd) &&
        /[^A-Za-z0-9]/.test(pwd),
    };
  };

  const createComplexity = useMemo(() => validateComplexity(createPassword), [createPassword]);
  const resetComplexity = useMemo(() => validateComplexity(resetPassword), [resetPassword]);

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditError(null);
    setIsEditOpen(true);
  };

  // Open Reset Password Modal
  const handleOpenReset = (user: AdminUser) => {
    setSelectedUser(user);
    setResetPassword("");
    setResetError(null);
    setIsResetOpen(true);
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createComplexity.isAllMet) {
      setCreateError("Initial password must meet all complexity requirements.");
      return;
    }

    setIsCreating(true);
    try {
      const payload: CreateUserPayload = {
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        role: createRole,
        initialPassword: createPassword,
        isActive: createIsActive,
      };

      const newUser = await createUserApi(payload);
      setSuccessMessage(`User "${newUser.name}" (${newUser.email}) created successfully.`);
      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("REQUESTER");
      setCreateIsActive(true);
      fetchUsers();
      refreshActiveAdminCount();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user account.");
    } finally {
      setIsCreating(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError(null);

    // Client-side self-deactivation guard
    if (selectedUser.id === currentUser?.id && !editIsActive) {
      setEditError("You cannot deactivate your own administrator account.");
      return;
    }

    // Client-side last active admin guard
    const isTargetActiveAdmin = selectedUser.role === "ADMIN" && selectedUser.isActive;
    const isDemoting = editRole !== "ADMIN";
    const isDeactivating = !editIsActive;
    if (isTargetActiveAdmin && (isDemoting || isDeactivating) && activeAdminCount <= 1) {
      setEditError("Cannot deactivate or demote the last active administrator.");
      return;
    }

    setIsUpdating(true);
    try {
      const payload: UpdateUserPayload = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        isActive: editIsActive,
      };

      const updated = await updateUserApi(selectedUser.id, payload);
      setSuccessMessage(`User "${updated.name}" updated successfully.`);
      setIsEditOpen(false);
      setSelectedUser(null);
      fetchUsers();
      refreshActiveAdminCount();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user account.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Submit Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetError(null);

    if (!resetComplexity.isAllMet) {
      setResetError("New initial password must meet all complexity requirements.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetUserPasswordApi(selectedUser.id, {
        newInitialPassword: resetPassword,
      });
      setSuccessMessage(
        res.message ||
          `Initial password for "${selectedUser.name}" reset. Sessions have been invalidated.`
      );
      setIsResetOpen(false);
      setSelectedUser(null);
      setResetPassword("");
      fetchUsers();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  // Helper Badge Renderers
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "REQUESTER":
        return (
          <span
            className="badge px-2 py-1 fw-medium"
            style={{ backgroundColor: "#E0F2FE", color: "#0369A1", fontSize: "0.8rem" }}
          >
            Requester
          </span>
        );
      case "IT_STAFF":
        return (
          <span
            className="badge px-2 py-1 fw-medium"
            style={{ backgroundColor: "#EAF6EF", color: "#006B3C", fontSize: "0.8rem" }}
          >
            IT Staff
          </span>
        );
      case "ADMIN":
        return (
          <span
            className="badge px-2 py-1 fw-medium"
            style={{ backgroundColor: "#E0E7FF", color: "#3730A3", fontSize: "0.8rem" }}
          >
            Administrator
          </span>
        );
      default:
        return <span className="badge bg-secondary">{role}</span>;
    }
  };

  const renderStatusBadge = (isActive: boolean, mustChangePassword: boolean) => {
    return (
      <div className="d-flex flex-column gap-1 align-items-start">
        {isActive ? (
          <span
            className="badge px-2 py-1 fw-normal"
            style={{ backgroundColor: "#DCFCE7", color: "#15803D", fontSize: "0.75rem" }}
          >
            Active
          </span>
        ) : (
          <span
            className="badge px-2 py-1 fw-normal"
            style={{ backgroundColor: "#F3F4F6", color: "#4B5563", fontSize: "0.75rem" }}
          >
            Inactive
          </span>
        )}
        {mustChangePassword && (
          <span
            className="badge px-2 py-1 fw-normal"
            style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontSize: "0.7rem" }}
            title="User must change password on next sign in"
          >
            Password Reset Required
          </span>
        )}
      </div>
    );
  };

  return (
    <main
      className="container py-4"
      style={{ maxWidth: 1140, minHeight: "80vh" }}
      data-testid="admin-user-management-page"
    >
      {/* Header Banner */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#1F2937" }}>
            User Management
          </h1>
          <p className="text-secondary mb-0 small">
            Manage user accounts, assign system roles, and configure access security.
          </p>
        </div>
        <button
          className="btn text-white fw-semibold d-flex align-items-center gap-2"
          style={{
            backgroundColor: "#006B3C",
            borderColor: "#006B3C",
            minHeight: "44px",
            padding: "8px 20px",
            borderRadius: "8px",
          }}
          onClick={() => {
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          data-testid="btn-open-create-user"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            style={{ width: 18, height: 18 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Create User</span>
        </button>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show py-2 px-3 mb-4 small d-flex align-items-center justify-content-between"
          role="alert"
          style={{ backgroundColor: "#EAF6EF", borderColor: "#A7D7B5", color: "#006B3C" }}
          data-testid="admin-success-alert"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            className="btn-close small"
            onClick={() => setSuccessMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger py-2 px-3 mb-4 small"
          role="alert"
          data-testid="admin-error-alert"
        >
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 p-3 mb-4" style={{ borderRadius: "10px" }}>
        <div className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  style={{ width: 16, height: 16 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ minHeight: "44px" }}
                data-testid="admin-user-search-input"
              />
              {search && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearch("")}
                  title="Clear search"
                  style={{ minHeight: "44px", minWidth: "44px" }}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Role Filter Dropdown */}
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ minHeight: "44px" }}
              data-testid="admin-role-filter-select"
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading users...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div
          className="card shadow-sm border-0 p-5 text-center my-4"
          style={{ borderRadius: "10px" }}
          data-testid="admin-empty-state"
        >
          <div className="text-muted mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              style={{ width: 48, height: 48 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
          </div>
          <h2 className="h5 fw-semibold mb-1">No users found</h2>
          <p className="text-muted small mb-0">
            {search || roleFilter
              ? "Try adjusting your search query or filter options."
              : "No user accounts have been created yet."}
          </p>
        </div>
      )}

      {/* Desktop User Table (>= 1024px) */}
      {!isLoading && users.length > 0 && (
        <div className="d-none d-lg-block">
          <div className="card shadow-sm border-0 overflow-hidden" style={{ borderRadius: "10px" }}>
            <table className="table table-hover align-middle mb-0" data-testid="admin-desktop-user-table">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: "32%", paddingLeft: "1.5rem" }}>
                    User
                  </th>
                  <th scope="col" style={{ width: "16%" }}>
                    Role
                  </th>
                  <th scope="col" style={{ width: "18%" }}>
                    Status
                  </th>
                  <th scope="col" style={{ width: "16%" }}>
                    Created Date
                  </th>
                  <th scope="col" style={{ width: "18%", textAlign: "right", paddingRight: "1.5rem" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isLastAdmin =
                    u.role === "ADMIN" && u.isActive && activeAdminCount <= 1;

                  return (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      <td style={{ paddingLeft: "1.5rem" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div>
                            <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span
                                  className="badge bg-light text-secondary border small"
                                  style={{ fontSize: "0.68rem" }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div className="small text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{renderRoleBadge(u.role)}</td>
                      <td>{renderStatusBadge(u.isActive, u.mustChangePassword)}</td>
                      <td className="small text-muted">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td style={{ textAlign: "right", paddingRight: "1.5rem" }}>
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                            onClick={() => handleOpenEdit(u)}
                            data-testid={`btn-edit-user-${u.id}`}
                            title="Edit User Details & Status"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              stroke="currentColor"
                              style={{ width: 14, height: 14 }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                              />
                            </svg>
                            <span>Edit</span>
                          </button>

                          <button
                            className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                            onClick={() => handleOpenReset(u)}
                            data-testid={`btn-reset-user-${u.id}`}
                            title="Reset Initial Password & Invalidate Sessions"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.8}
                              stroke="currentColor"
                              style={{ width: 14, height: 14 }}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                              />
                            </svg>
                            <span>Reset Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile & Tablet Card Layout (< 1024px) */}
      {!isLoading && users.length > 0 && (
        <div className="d-block d-lg-none" data-testid="admin-mobile-user-list">
          <div className="d-flex flex-column gap-3">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;

              return (
                <div
                  key={u.id}
                  className="card shadow-sm border-0 p-3"
                  style={{ borderRadius: "10px" }}
                  data-testid={`user-card-${u.id}`}
                >
                  {/* Card Header: Name + Self tag & Role */}
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span
                            className="badge bg-light text-secondary border small"
                            style={{ fontSize: "0.68rem" }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <div className="small text-muted">{u.email}</div>
                    </div>
                    <div>{renderRoleBadge(u.role)}</div>
                  </div>

                  {/* Card Body: Status & Date */}
                  <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom my-2">
                    <div>{renderStatusBadge(u.isActive, u.mustChangePassword)}</div>
                    <div className="small text-muted">
                      Created:{" "}
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Card Footer: Touch-friendly action buttons (>= 44px) */}
                  <div className="d-flex gap-2 mt-2">
                    <button
                      className="btn btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      style={{ minHeight: "44px" }}
                      onClick={() => handleOpenEdit(u)}
                      data-testid={`mobile-btn-edit-user-${u.id}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        style={{ width: 16, height: 16 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                      <span>Edit</span>
                    </button>

                    <button
                      className="btn btn-outline-warning flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                      style={{ minHeight: "44px" }}
                      onClick={() => handleOpenReset(u)}
                      data-testid={`mobile-btn-reset-user-${u.id}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        style={{ width: 16, height: 16 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                        />
                      </svg>
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {isCreateOpen && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="admin-create-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "12px" }}>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h2 className="modal-title h5 fw-bold" style={{ color: "#006B3C" }}>
                    Create New User
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsCreateOpen(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body py-3">
                  {createError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3 small"
                      data-testid="create-user-error"
                    >
                      {createError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Jane Doe"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="input-create-name"
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. jane.doe@toktickit.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="input-create-email"
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value as UserRole)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="select-create-role"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  {/* Initial Password */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Initial Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter secure initial password"
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="input-create-password"
                    />

                    {/* Real-time Complexity Checklist */}
                    <div
                      className="p-2 mt-2 rounded bg-light border"
                      style={{ fontSize: "0.78rem" }}
                      data-testid="create-password-checklist"
                    >
                      <div className="fw-semibold text-secondary mb-1">Password Requirements:</div>
                      <div className="d-flex flex-column gap-1">
                        <span
                          className={
                            createComplexity.hasMinLength ? "text-success fw-medium" : "text-muted"
                          }
                        >
                          {createComplexity.hasMinLength ? "✓" : "○"} At least 8 characters
                        </span>
                        <span
                          className={
                            createComplexity.hasUpperAndLower
                              ? "text-success fw-medium"
                              : "text-muted"
                          }
                        >
                          {createComplexity.hasUpperAndLower ? "✓" : "○"} Both uppercase and lowercase letters
                        </span>
                        <span
                          className={
                            createComplexity.hasNumberAndSymbol
                              ? "text-success fw-medium"
                              : "text-muted"
                          }
                        >
                          {createComplexity.hasNumberAndSymbol ? "✓" : "○"} At least 1 number and 1 special symbol
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Account Toggle */}
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="createActiveSwitch"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      data-testid="switch-create-active"
                    />
                    <label className="form-check-label small fw-medium" htmlFor="createActiveSwitch">
                      Active Account
                    </label>
                  </div>

                  <div className="alert alert-info py-2 px-3 small mb-0 mt-3" style={{ fontSize: "0.78rem" }}>
                    <strong>Note:</strong> Newly provisioned users are flagged with{" "}
                    <code>mustChangePassword = true</code> and must change this password upon their first sign-in.
                  </div>
                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setIsCreateOpen(false)}
                    style={{ minHeight: "44px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold"
                    style={{ backgroundColor: "#006B3C", minHeight: "44px" }}
                    disabled={isCreating || !createComplexity.isAllMet}
                    data-testid="btn-submit-create-user"
                  >
                    {isCreating ? "Creating User..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {isEditOpen && selectedUser && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="admin-edit-user-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "12px" }}>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h2 className="modal-title h5 fw-bold" style={{ color: "#006B3C" }}>
                    Edit User Account
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setIsEditOpen(false);
                      setSelectedUser(null);
                    }}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body py-3">
                  {editError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3 small"
                      data-testid="edit-user-error"
                    >
                      {editError}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="input-edit-name"
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="input-edit-email"
                    />
                  </div>

                  {/* Role Selector */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Role</label>
                    <select
                      className="form-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="select-edit-role"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="IT_STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                    {selectedUser.role === "ADMIN" &&
                      selectedUser.isActive &&
                      activeAdminCount <= 1 && (
                        <small className="text-warning-emphasis d-block mt-1">
                          ⚠️ This user is currently the only active administrator. Demoting them is protected.
                        </small>
                      )}
                  </div>

                  {/* Active Toggle & Safety Guards */}
                  <div className="form-check form-switch mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="editActiveSwitch"
                      checked={editIsActive}
                      disabled={
                        selectedUser.id === currentUser?.id ||
                        (selectedUser.role === "ADMIN" && selectedUser.isActive && activeAdminCount <= 1)
                      }
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      data-testid="switch-edit-active"
                    />
                    <label className="form-check-label small fw-medium" htmlFor="editActiveSwitch">
                      Active Account
                    </label>
                  </div>

                  {/* Self Deactivation Guard notice */}
                  {selectedUser.id === currentUser?.id && (
                    <div
                      className="alert alert-secondary py-2 px-3 small mb-0"
                      style={{ fontSize: "0.78rem" }}
                      data-testid="self-deactivation-notice"
                    >
                      <strong>Protected:</strong> You cannot deactivate your own account (CANNOT_DEACTIVATE_SELF).
                    </div>
                  )}

                  {/* Last Admin Deactivation Guard notice */}
                  {selectedUser.role === "ADMIN" &&
                    selectedUser.isActive &&
                    activeAdminCount <= 1 && (
                      <div
                        className="alert alert-warning py-2 px-3 small mb-0"
                        style={{ fontSize: "0.78rem" }}
                        data-testid="last-admin-guard-notice"
                      >
                        <strong>Warning:</strong> System must maintain at least one active administrator (LAST_ACTIVE_ADMIN_PROTECTED).
                      </div>
                    )}
                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setIsEditOpen(false);
                      setSelectedUser(null);
                    }}
                    style={{ minHeight: "44px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold"
                    style={{ backgroundColor: "#006B3C", minHeight: "44px" }}
                    disabled={isUpdating}
                    data-testid="btn-submit-edit-user"
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Initial Password */}
      {isResetOpen && selectedUser && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="admin-reset-password-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow" style={{ borderRadius: "12px" }}>
              <form onSubmit={handleResetSubmit}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h2 className="modal-title h5 fw-bold" style={{ color: "#B45309" }}>
                    Reset Initial Password
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setIsResetOpen(false);
                      setSelectedUser(null);
                    }}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body py-3">
                  <p className="text-secondary small mb-3">
                    Resetting password for{" "}
                    <strong>
                      {selectedUser.name} ({selectedUser.email})
                    </strong>
                    .
                  </p>

                  <div
                    className="alert alert-warning py-2 px-3 small mb-3"
                    style={{ fontSize: "0.8rem" }}
                  >
                    <strong>Security Notice:</strong> All active sessions for this user will be{" "}
                    <strong>immediately invalidated</strong> via the revocation registry. The user must change their password upon their next login.
                  </div>

                  {resetError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3 small"
                      data-testid="reset-password-error"
                    >
                      {resetError}
                    </div>
                  )}

                  {/* New Initial Password */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      New Initial Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter new temporary password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                      style={{ minHeight: "44px" }}
                      data-testid="input-reset-password"
                    />

                    {/* Complexity checklist */}
                    <div
                      className="p-2 mt-2 rounded bg-light border"
                      style={{ fontSize: "0.78rem" }}
                      data-testid="reset-password-checklist"
                    >
                      <div className="fw-semibold text-secondary mb-1">Password Requirements:</div>
                      <div className="d-flex flex-column gap-1">
                        <span
                          className={
                            resetComplexity.hasMinLength ? "text-success fw-medium" : "text-muted"
                          }
                        >
                          {resetComplexity.hasMinLength ? "✓" : "○"} At least 8 characters
                        </span>
                        <span
                          className={
                            resetComplexity.hasUpperAndLower
                              ? "text-success fw-medium"
                              : "text-muted"
                          }
                        >
                          {resetComplexity.hasUpperAndLower ? "✓" : "○"} Both uppercase and lowercase letters
                        </span>
                        <span
                          className={
                            resetComplexity.hasNumberAndSymbol
                              ? "text-success fw-medium"
                              : "text-muted"
                          }
                        >
                          {resetComplexity.hasNumberAndSymbol ? "✓" : "○"} At least 1 number and 1 special symbol
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setIsResetOpen(false);
                      setSelectedUser(null);
                    }}
                    style={{ minHeight: "44px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning text-dark fw-semibold"
                    style={{ minHeight: "44px" }}
                    disabled={isResetting || !resetComplexity.isAllMet}
                    data-testid="btn-submit-reset-password"
                  >
                    {isResetting ? "Resetting..." : "Reset & Invalidate Sessions"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
