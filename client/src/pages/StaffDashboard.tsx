import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStaffDashboard } from "../api/dashboard.api";
import { StaffDashboardData } from "../types/dashboard";

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dashboardData = await getStaffDashboard();
      setData(dashboardData);
    } catch (err: any) {
      console.error("Failed to load Staff Dashboard:", err);
      setError(err.message || "Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Status Badge Helper using Zen Green System Tokens (UI Spec Section 2.2)
  const renderStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      NEW: { bg: "#E0F2FE", text: "#0369A1", label: "New" },
      OPEN: { bg: "#D1FAE5", text: "#047857", label: "Open" },
      IN_PROGRESS: { bg: "#FEF3C7", text: "#B45309", label: "In Progress" },
      WAITING_FOR_REQUESTER: { bg: "#F3E8FF", text: "#6B21A8", label: "Waiting for Requester" },
      RESOLVED: { bg: "#DCFCE7", text: "#15803D", label: "Resolved" },
      CLOSED: { bg: "#F1F5F9", text: "#475569", label: "Closed" },
      REOPENED: { bg: "#FFEDD5", text: "#C2410C", label: "Reopened" },
      CANCELLED: { bg: "#FFE4E6", text: "#BE123C", label: "Cancelled" },
    };

    const current = config[status] || { bg: "#F1F5F9", text: "#475569", label: status };

    return (
      <span
        className="badge rounded-pill fw-medium"
        style={{ backgroundColor: current.bg, color: current.text, padding: "5px 10px", fontSize: "0.75rem" }}
      >
        {current.label}
      </span>
    );
  };

  // Priority Badge Helper using Zen Green System Tokens (UI Spec Section 2.2)
  const renderPriorityBadge = (priority: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      LOW: { bg: "#F1F5F9", text: "#475569", label: "Low" },
      MEDIUM: { bg: "#EAF6EF", text: "#0B7A46", label: "Medium" },
      HIGH: { bg: "#FEF3C7", text: "#B45309", label: "High" },
      URGENT: { bg: "#FEE2E2", text: "#B91C1C", label: "Urgent" },
    };

    const current = config[priority] || { bg: "#F1F5F9", text: "#475569", label: priority };

    return (
      <span
        className="badge rounded-pill fw-medium"
        style={{ backgroundColor: current.bg, color: current.text, padding: "4px 8px", fontSize: "0.75rem" }}
      >
        {current.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime())
      ? "-"
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  // Strict role boundary: Only IT Staff and Administrators are permitted (AC-20, UI-23)
  if (user && user.role !== "IT_STAFF" && user.role !== "ADMIN") {
    return (
      <div className="container py-5" style={{ maxWidth: 1200 }}>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">403 Forbidden</h4>
          <p>Only IT Staff and Administrators are permitted to access the Staff Dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: 1200 }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="mt-3 text-secondary small">Loading operational queue metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5" style={{ maxWidth: 1200 }}>
        <div className="alert alert-danger d-flex justify-content-between align-items-center shadow-sm" role="alert">
          <div>
            <strong>Error loading dashboard:</strong> {error}
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const staffName = data?.staffName || user?.name || "IT Staff";
  const role = data?.role || user?.role || "IT_STAFF";


  const metrics = data?.metrics || {
    newCount: 0,
    openCount: 0,
    inProgressCount: 0,
    waitingForRequesterCount: 0,
    myAssignedCount: 0,
    unassignedCount: 0,
    urgentCount: 0,
    highCount: 0,
    myActionsCount: 0,
  };
  const drillDownPaths = data?.drillDownPaths || {
    newCount: "/staff/tickets?status=NEW",
    openCount: "/staff/tickets?status=OPEN",
    inProgressCount: "/staff/tickets?status=IN_PROGRESS",
    waitingForRequesterCount: "/staff/tickets?status=WAITING_FOR_REQUESTER",
    myAssignedCount: "/staff/tickets?ownership=assigned_to_me",
    unassignedCount: "/staff/tickets?ownership=unassigned",
    urgentCount: "/staff/tickets?priority=URGENT",
    highCount: "/staff/tickets?priority=HIGH",
  };
  const recentTickets = data?.recentTickets || [];
  const myRecentActions = data?.myRecentActions || [];
  const userStats = data?.userStats;

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }}>
      {/* Welcome Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#24272A" }}>
            Welcome back, {staffName}!
          </h1>
          <p className="text-secondary small mb-0">Here's what's happening with your queue today.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
          onClick={loadDashboard}
          title="Refresh queue metrics"
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* 6 Primary Operational Metric Cards (UI Spec Section 3.1) */}
      <div className="row g-3 mb-4">
        {/* New */}
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">New</span>
            <div className="h2 fw-bold mb-2" style={{ color: "#0369A1" }}>
              {metrics.newCount}
            </div>
            <Link
              to={drillDownPaths.newCount}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#0369A1" }}
              aria-label="View all new tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* Open */}
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">Open</span>
            <div className="h2 fw-bold mb-2" style={{ color: "#047857" }}>
              {metrics.openCount}
            </div>
            <Link
              to={drillDownPaths.openCount}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#047857" }}
              aria-label="View all open tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">In Progress</span>
            <div className="h2 fw-bold mb-2" style={{ color: "#B45309" }}>
              {metrics.inProgressCount}
            </div>
            <Link
              to={drillDownPaths.inProgressCount}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#B45309" }}
              aria-label="View all in-progress tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* Waiting for Requester */}
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">Waiting Req</span>
            <div className="h2 fw-bold mb-2" style={{ color: "#6B21A8" }}>
              {metrics.waitingForRequesterCount}
            </div>
            <Link
              to={drillDownPaths.waitingForRequesterCount}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#6B21A8" }}
              aria-label="View all waiting for requester tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* My Assigned */}
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">My Assigned</span>
            <div className="h2 fw-bold mb-2" style={{ color: "#006B3C" }}>
              {metrics.myAssignedCount}
            </div>
            <Link
              to={drillDownPaths.myAssignedCount}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#006B3C" }}
              aria-label="View my assigned tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* Unassigned */}
        <div className="col-6 col-md-4 col-lg-2">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">Unassigned</span>
            <div className="h2 fw-bold mb-2" style={{ color: "#475569" }}>
              {metrics.unassignedCount}
            </div>
            <Link
              to={drillDownPaths.unassignedCount}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#475569" }}
              aria-label="View unassigned tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>
      </div>

      {/* Priority Attention Strip (UI Spec Section 3.1) */}
      <div
        className="card shadow-sm border-0 mb-4 p-3 d-flex flex-row align-items-center justify-content-between flex-wrap gap-3"
        style={{ backgroundColor: "#FFFFFF", borderLeft: "4px solid #B91C1C" }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold text-dark">Attention Required:</span>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <Link
            to={drillDownPaths.urgentCount}
            className="btn btn-sm d-flex align-items-center gap-2 fw-semibold text-decoration-none"
            style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA" }}
            aria-label="View urgent priority tickets"
          >
            <span style={{ fontSize: "1rem" }}>🔴</span>
            <span>Urgent: {metrics.urgentCount} tickets &gt;</span>
          </Link>
          <Link
            to={drillDownPaths.highCount}
            className="btn btn-sm d-flex align-items-center gap-2 fw-semibold text-decoration-none"
            style={{ backgroundColor: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" }}
            aria-label="View high priority tickets"
          >
            <span style={{ fontSize: "1rem" }}>🟠</span>
            <span>High Priority: {metrics.highCount} tickets &gt;</span>
          </Link>
        </div>
      </div>

      {/* Admin Extras Panel (UI Spec Section 3.1 - Item 6) */}
      {role === "ADMIN" && userStats && (
        <div
          className="card shadow-sm border-0 mb-4 p-3"
          style={{ backgroundColor: "#FFFFFF", borderLeft: "4px solid #3730A3" }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="badge rounded-pill mb-1" style={{ backgroundColor: "#E0E7FF", color: "#3730A3" }}>
                Admin System Overview
              </span>
              <div className="d-flex align-items-center gap-4 flex-wrap mt-1">
                <div>
                  <span className="text-secondary small">Active Users: </span>
                  <span className="fw-bold text-dark">{userStats.activeUsers}</span>
                </div>
                <div>
                  <span className="text-secondary small">Active Staff: </span>
                  <span className="fw-bold text-dark">{userStats.activeStaff}</span>
                </div>
                <div>
                  <span className="text-secondary small">Active Admins: </span>
                  <span className="fw-bold text-dark">{userStats.activeAdmins}</span>
                </div>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              style={{ color: "#3730A3", borderColor: "#3730A3" }}
            >
              Manage Users &gt;
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Recent Queue Tickets) + Right Column (My Recent Actions & Quick Actions) */}
      <div className="row g-4">
        {/* Left Column: Recent Queue Tickets */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 mb-4 h-100" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex justify-content-between align-items-center">
              <h5 className="h6 fw-bold mb-0 text-dark">Recent Queue Tickets</h5>
              <Link to="/staff/tickets" className="small text-decoration-none fw-semibold" style={{ color: "#006B3C" }}>
                View all
              </Link>
            </div>
            <div className="card-body p-0">
              {recentTickets.length === 0 ? (
                <p className="text-secondary small p-3 mb-0">No tickets currently in the queue</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: "#F0F4F2", borderBottom: "1px solid #D5DDD8" }}>
                      <tr className="text-secondary small fw-semibold text-uppercase">
                        <th style={{ padding: "10px 16px" }}>Ticket No</th>
                        <th style={{ padding: "10px 16px" }}>Summary</th>
                        <th style={{ padding: "10px 16px" }}>Priority</th>
                        <th style={{ padding: "10px 16px" }}>Status</th>
                        <th style={{ padding: "10px 16px" }}>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map((t) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid #E5EAE7" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <Link
                              to={`/staff/tickets/${t.id}`}
                              className="fw-bold text-decoration-none"
                              style={{ color: "#006B3C" }}
                            >
                              {t.ticketNumber}
                            </Link>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div className="fw-medium text-dark text-truncate" style={{ maxWidth: 200 }} title={t.title}>
                              {t.title}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>{renderPriorityBadge(t.priority)}</td>
                          <td style={{ padding: "12px 16px" }}>{renderStatusBadge(t.status)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {t.owner ? (
                              <span className="small text-dark fw-medium">{t.owner.name}</span>
                            ) : (
                              <span className="small text-muted fst-italic">Unassigned</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: My Recent Actions Taken & Quick Actions */}
        <div className="col-12 col-lg-5">
          {/* My Recent Actions Taken (Performed by You) */}
          <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="card-header bg-transparent border-0 pt-3 px-3">
              <h5 className="h6 fw-bold mb-0 text-dark">My Recent Actions Taken (Performed by You)</h5>
            </div>
            <div className="card-body p-3">
              {myRecentActions.length === 0 ? (
                <p className="text-secondary small mb-0 fst-italic">
                  You haven't recorded any actions taken yet. Open a ticket from your queue to log work.
                </p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {myRecentActions.map((action) => (
                    <div
                      key={action.id}
                      className="p-2 rounded border"
                      style={{ backgroundColor: "#FBFDFB", borderColor: "#E5EAE7" }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <Link
                          to={`/staff/tickets/${action.ticketId}`}
                          className="fw-bold small text-decoration-none"
                          style={{ color: "#006B3C" }}
                        >
                          {action.ticketNumber}
                        </Link>
                        <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                          {formatDate(action.actionDate)}
                        </span>
                      </div>
                      <div className="small fw-semibold text-dark text-truncate mb-1">{action.ticketTitle}</div>
                      <div className="small text-secondary mb-1">
                        <span className="fw-medium text-dark">Action:</span> {action.actionDescription}
                      </div>
                      {action.result && (
                        <div className="small text-secondary mb-1">
                          <span className="fw-medium text-dark">Result:</span> {action.result}
                        </div>
                      )}
                      {action.followUpRequired && (
                        <div className="mt-1">
                          <span
                            className="badge rounded-pill fw-medium"
                            style={{ backgroundColor: "#FEF3C7", color: "#B45309", fontSize: "0.7rem" }}
                          >
                            Follow-up required
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="card shadow-sm border-0 mb-4 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <h5 className="h6 fw-bold mb-3 text-dark">Quick Actions</h5>
            <div className="d-flex flex-column gap-2">
              <Link
                to="/staff/tickets?ownership=unassigned"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-start gap-2 py-2"
                style={{ borderColor: "#D5DDD8", color: "#24272A" }}
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
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.99-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
                <span>Unassigned Queue</span>
              </Link>

              <Link
                to="/staff/tickets"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-start gap-2 py-2"
                style={{ borderColor: "#D5DDD8", color: "#24272A" }}
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
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <span>Search Tickets</span>
              </Link>

              <Link
                to="/staff/tickets?ownership=assigned_to_me"
                className="btn btn-sm d-flex align-items-center justify-content-start gap-2 py-2 text-white fw-semibold"
                style={{ backgroundColor: "#006B3C" }}
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
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <span>My Assigned Queue</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
