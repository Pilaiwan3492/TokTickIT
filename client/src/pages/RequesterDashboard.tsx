import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRequesterDashboard } from "../api/dashboard.api";
import { RequesterDashboardData } from "../types/dashboard";

export const RequesterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dashboardData = await getRequesterDashboard();
      setData(dashboardData);
    } catch (err: any) {
      console.error("Failed to load Requester Dashboard:", err);
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
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  // Strict role boundary: Requester Dashboard is strictly for REQUESTER role
  if (user && user.role !== "REQUESTER") {
    return (
      <div className="container py-5" style={{ maxWidth: 1200 }}>
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">403 Forbidden</h4>
          <p>Only Requesters are permitted to access the Requester Dashboard.</p>
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
        <p className="mt-3 text-secondary small">Loading your dashboard...</p>
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

  const requesterName = data?.requesterName || user?.name || "Requester";


  const metrics = data?.metrics || {
    openTickets: 0,
    waitingForRequester: 0,
    resolved: 0,
    closed: 0,
  };
  const drillDownPaths = data?.drillDownPaths || {
    openTickets: "/my-tickets?status=open_all",
    waitingForRequester: "/my-tickets?status=WAITING_FOR_REQUESTER",
    resolved: "/my-tickets?status=RESOLVED",
    closed: "/my-tickets?status=CLOSED",
  };
  const recentTickets = data?.recentTickets || [];
  const recentlyResolvedTickets = data?.recentlyResolvedTickets || [];

  const isCompletelyEmpty =
    metrics.openTickets === 0 &&
    metrics.waitingForRequester === 0 &&
    metrics.resolved === 0 &&
    metrics.closed === 0 &&
    recentTickets.length === 0;

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }}>
      {/* Welcome Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#24272A" }}>
            Welcome, {requesterName}!
          </h1>
          <p className="text-secondary small mb-0">Here's the latest on your requests.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm"
          onClick={loadDashboard}
          title="Refresh dashboard metrics"
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

      {/* 4 Primary Metric Summary Cards (UI Spec Section 3.2) */}
      <div className="row g-3 mb-4">
        {/* Card 1: My Open Tickets */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">My Open Tickets</span>
            <div className="display-6 fw-bold mb-2" style={{ color: "#006B3C" }}>
              {metrics.openTickets}
            </div>
            <Link
              to={drillDownPaths.openTickets}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#006B3C" }}
              aria-label="View all open tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* Card 2: Waiting for Me */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">Waiting for Requester</span>
            <div className="display-6 fw-bold mb-2" style={{ color: "#B45309" }}>
              {metrics.waitingForRequester}
            </div>
            <Link
              to={drillDownPaths.waitingForRequester}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#B45309" }}
              aria-label="View tickets waiting for requester"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* Card 3: Resolved */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">Resolved</span>
            <div className="display-6 fw-bold mb-2" style={{ color: "#15803D" }}>
              {metrics.resolved}
            </div>
            <Link
              to={drillDownPaths.resolved}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#15803D" }}
              aria-label="View resolved tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>

        {/* Card 4: Closed */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0 h-100 p-3" style={{ backgroundColor: "#FFFFFF" }}>
            <span className="text-secondary small fw-medium mb-1">Closed</span>
            <div className="display-6 fw-bold mb-2" style={{ color: "#475569" }}>
              {metrics.closed}
            </div>
            <Link
              to={drillDownPaths.closed}
              className="text-decoration-none small fw-semibold d-flex align-items-center gap-1 mt-auto"
              style={{ color: "#475569" }}
              aria-label="View closed tickets"
            >
              View all &gt;
            </Link>
          </div>
        </div>
      </div>

      {/* Zero Ticket Empty State */}
      {isCompletelyEmpty ? (
        <div className="card shadow-sm border-0 py-5 text-center text-muted mb-4" style={{ backgroundColor: "#FFFFFF" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="mx-auto mb-3 text-secondary"
            style={{ width: 48, height: 48 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
            />
          </svg>
          <h4 className="fw-semibold text-dark mb-1">You haven't submitted any tickets yet</h4>
          <p className="small mb-3 text-secondary" style={{ maxWidth: 420, margin: "0 auto" }}>
            Need assistance with hardware, software, or network access?
          </p>
          <div>
            <Link
              to="/create-ticket"
              className="btn btn-sm text-white fw-semibold px-3 py-2"
              style={{ backgroundColor: "#006B3C" }}
            >
              + Create Ticket
            </Link>
          </div>
        </div>
      ) : (
        /* Main Grid: Left Column (Recent & Resolved Tickets) + Right Column (Quick Actions) */
        <div className="row g-4">
          {/* Left Column: Tickets Panels */}
          <div className="col-12 col-lg-8">
            {/* My Recent Tickets (Max 5) */}
            <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex justify-content-between align-items-center">
                <h5 className="h6 fw-bold mb-0 text-dark">My Recent Tickets</h5>
                <Link
                  to="/my-tickets"
                  className="small text-decoration-none fw-semibold"
                  style={{ color: "#006B3C" }}
                >
                  View all
                </Link>
              </div>
              <div className="card-body p-0">
                {recentTickets.length === 0 ? (
                  <p className="text-secondary small p-3 mb-0">No recent tickets.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ backgroundColor: "#F0F4F2", borderBottom: "1px solid #D5DDD8" }}>
                        <tr className="text-secondary small fw-semibold text-uppercase">
                          <th style={{ padding: "10px 16px" }}>Ticket No</th>
                          <th style={{ padding: "10px 16px" }}>Summary</th>
                          <th style={{ padding: "10px 16px" }}>Priority</th>
                          <th style={{ padding: "10px 16px" }}>Status</th>
                          <th style={{ padding: "10px 16px" }}>Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTickets.map((t) => (
                          <tr key={t.id} style={{ borderBottom: "1px solid #E5EAE7" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <Link
                                to={`/my-tickets/${t.id}`}
                                className="fw-bold text-decoration-none"
                                style={{ color: "#006B3C" }}
                              >
                                {t.ticketNumber}
                              </Link>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div className="fw-medium text-dark text-truncate" style={{ maxWidth: 220 }} title={t.title}>
                                {t.title}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>{renderPriorityBadge(t.priority)}</td>
                            <td style={{ padding: "12px 16px" }}>{renderStatusBadge(t.status)}</td>
                            <td className="small text-secondary" style={{ padding: "12px 16px" }}>
                              {formatDate(t.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Resolved Tickets (Max 5) */}
            <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: "#FFFFFF" }}>
              <div className="card-header bg-transparent border-0 pt-3 px-3 d-flex justify-content-between align-items-center">
                <h5 className="h6 fw-bold mb-0 text-dark">Recently Resolved Tickets (Max 5)</h5>
                <Link
                  to={drillDownPaths.resolved}
                  className="small text-decoration-none fw-semibold"
                  style={{ color: "#006B3C" }}
                >
                  View all
                </Link>
              </div>
              <div className="card-body p-0">
                {recentlyResolvedTickets.length === 0 ? (
                  <p className="text-secondary small p-3 mb-0">No recently resolved tickets</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ backgroundColor: "#F0F4F2", borderBottom: "1px solid #D5DDD8" }}>
                        <tr className="text-secondary small fw-semibold text-uppercase">
                          <th style={{ padding: "10px 16px" }}>Ticket No</th>
                          <th style={{ padding: "10px 16px" }}>Summary</th>
                          <th style={{ padding: "10px 16px" }}>Priority</th>
                          <th style={{ padding: "10px 16px" }}>Status</th>
                          <th style={{ padding: "10px 16px" }}>Resolved On</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentlyResolvedTickets.map((t) => (
                          <tr key={t.id} style={{ borderBottom: "1px solid #E5EAE7" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <Link
                                to={`/my-tickets/${t.id}`}
                                className="fw-bold text-decoration-none"
                                style={{ color: "#006B3C" }}
                              >
                                {t.ticketNumber}
                              </Link>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div className="fw-medium text-dark text-truncate" style={{ maxWidth: 220 }} title={t.title}>
                                {t.title}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>{renderPriorityBadge(t.priority)}</td>
                            <td style={{ padding: "12px 16px" }}>{renderStatusBadge(t.status)}</td>
                            <td className="small text-secondary" style={{ padding: "12px 16px" }}>
                              {formatDate(t.updatedAt)}
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

          {/* Right Column: Quick Actions Panel */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border-0 mb-4 p-3" style={{ backgroundColor: "#FFFFFF" }}>
              <h5 className="h6 fw-bold mb-3 text-dark">Quick Actions</h5>
              <div className="d-flex flex-column gap-3">
                <Link
                  to="/create-ticket"
                  className="card text-decoration-none p-3 border-0 transition-all"
                  style={{ backgroundColor: "#EAF6EF", borderLeft: "4px solid #006B3C" }}
                >
                  <div className="fw-bold d-flex align-items-center gap-2" style={{ color: "#006B3C" }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      style={{ width: 18, height: 18 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create Ticket
                  </div>
                  <div className="small text-secondary mt-1">Submit a new service desk request</div>
                </Link>

                <Link
                  to="/my-tickets"
                  className="card text-decoration-none p-3 border-0 transition-all"
                  style={{ backgroundColor: "#F5F7F6", borderLeft: "4px solid #6C757D" }}
                >
                  <div className="fw-bold d-flex align-items-center gap-2 text-dark">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      style={{ width: 18, height: 18 }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    </svg>
                    View My Tickets
                  </div>
                  <div className="small text-secondary mt-1">Track and review existing requests</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequesterDashboard;
