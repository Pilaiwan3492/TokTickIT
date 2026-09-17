import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types/auth";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInitials = (name?: string): string => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadgeStyle = (userRole?: UserRole | null) => {
    switch (userRole) {
      case "REQUESTER":
        return { backgroundColor: "#E0F2FE", color: "#0369A1" };
      case "IT_STAFF":
        return { backgroundColor: "#EAF6EF", color: "#006B3C" };
      case "ADMIN":
        return { backgroundColor: "#E0E7FF", color: "#3730A3" };
      default:
        return { backgroundColor: "#F1F5F9", color: "#475569" };
    }
  };

  const formatRoleName = (userRole?: UserRole | null) => {
    switch (userRole) {
      case "REQUESTER":
        return "Requester";
      case "IT_STAFF":
        return "IT Staff";
      case "ADMIN":
        return "Administrator";
      default:
        return "User";
    }
  };

  const homeLink = role === "REQUESTER" ? "/tickets" : "/queue";

  const handleSignOut = async () => {
    setIsDropdownOpen(false);
    navigate("/login", { replace: true });
    await logout();
  };

  return (
    <header
      style={{ backgroundColor: "#006B3C" }}
      className="text-white py-2 px-2 px-sm-4 shadow-sm"
    >
      <div className="container-fluid d-flex align-items-center justify-content-between flex-wrap gap-2">
        {/* Left Side: Brand Logo & Navigation */}
        <div className="d-flex align-items-center gap-2 gap-sm-4 flex-wrap">
          <Link
            to={isAuthenticated ? homeLink : "/login"}
            className="d-flex align-items-center gap-2 fw-bold fs-5 text-white text-decoration-none"
          >
            {/* Clock Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              style={{ width: 22, height: 22 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <span>TokTickIT</span>
          </Link>

          {/* Role-Filtered Navigation */}
          {isAuthenticated && (
            <nav className="d-flex align-items-center gap-2 gap-sm-3 flex-wrap">
              {/* Requester Navigation */}
              {role === "REQUESTER" && (
                <>
                  <Link
                    to="/tickets"
                    className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1"
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
                        d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18M3 7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v9a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 16.5v-9Z"
                      />
                    </svg>
                    My Tickets
                  </Link>
                  <Link
                    to="/create-ticket"
                    className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1"
                  >
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
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Create Ticket
                  </Link>
                </>
              )}

              {/* IT Staff Navigation: Queue only (no Create Ticket) */}
              {role === "IT_STAFF" && (
                <Link
                  to="/queue"
                  className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1"
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
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                  Ticket Queue
                </Link>
              )}

              {/* Administrator Navigation: Queue & User Management */}
              {role === "ADMIN" && (
                <>
                  <Link
                    to="/queue"
                    className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1"
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
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    </svg>
                    Ticket Queue
                  </Link>
                  <Link
                    to="/admin/users"
                    className="text-white text-decoration-none small fw-medium opacity-90 d-flex align-items-center gap-1"
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
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    User Management
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>

        {/* Right Side: Authenticated User Profile & Dropdown */}
        {isAuthenticated && user && (
          <div className="position-relative ms-auto" ref={dropdownRef} style={{ zIndex: 10 }}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="btn p-1 d-flex align-items-center gap-2 text-white border-0"
              style={{ background: "transparent" }}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              {/* Circular Avatar with Initials */}
              <div
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: "#00522E",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                {getInitials(user.name)}
              </div>

              {/* User Full Name */}
              <span className="small fw-semibold text-white d-none d-sm-inline">
                {user.name}
              </span>

              {/* Role Badge */}
              <span
                className="badge rounded-pill small fw-medium px-2 py-1"
                style={getRoleBadgeStyle(role)}
              >
                {formatRoleName(role)}
              </span>

              {/* Chevron Down */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{ width: 14, height: 14 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className="dropdown-menu dropdown-menu-end show shadow-sm border py-2"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 6,
                  minWidth: 220,
                  borderRadius: 8,
                  zIndex: 1050,
                }}
              >
                <div className="px-3 py-1 mb-2 border-bottom">
                  <div className="fw-semibold small text-dark">{user.name}</div>
                  <div className="text-secondary small text-truncate" title={user.email}>
                    {user.email}
                  </div>
                </div>

                <Link
                  to="/change-password"
                  onClick={() => setIsDropdownOpen(false)}
                  className="dropdown-item small py-2 d-flex align-items-center gap-2"
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                  Change Password
                </Link>

                <div className="dropdown-divider my-1" />

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="dropdown-item small py-2 text-danger d-flex align-items-center gap-2"
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
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};