import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { StaffQueueTicket, QueuePagination, TicketPriority, TicketStatusType } from "../types/staff";

export const StaffTicketQueue: React.FC = () => {
  const { user } = useAuth();

  // Query & Filter State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [ownershipFilter, setOwnershipFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED_TO_ME">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Data State
  const [tickets, setTickets] = useState<StaffQueueTicket[]>([]);
  const [pagination, setPagination] = useState<QueuePagination>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Tickets
  const fetchQueueTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (ownershipFilter !== "ALL") params.append("ownership", ownershipFilter);
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      const res = await apiFetch(`/api/v1/staff/tickets?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to load ticket queue.");
      }

      setTickets(data.data || []);
      if (data.pagination) {
        setPagination(data.pagination);
      } else if (data.meta) {
        setPagination({
          page: data.meta.page,
          pageSize: data.meta.limit,
          totalItems: data.meta.total,
          totalPages: data.meta.totalPages,
          hasNextPage: data.meta.page < data.meta.totalPages,
          hasPreviousPage: data.meta.page > 1,
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch queue tickets:", err);
      setError(err.message || "An unexpected error occurred loading tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, ownershipFilter, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchQueueTickets();
  }, [fetchQueueTickets]);

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setOwnershipFilter("ALL");
    setPage(1);
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasActiveFilters = Boolean(
    debouncedSearch || statusFilter || priorityFilter || ownershipFilter !== "ALL"
  );

  // Status Badge Helper (Zen Green Palette - Section 2.2)
  const renderStatusBadge = (status: TicketStatusType) => {
    const config: Record<TicketStatusType, { bg: string; text: string; label: string }> = {
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
        style={{ backgroundColor: current.bg, color: current.text, padding: "5px 10px" }}
      >
        {current.label}
      </span>
    );
  };

  // Priority Badge Helper (Zen Green Palette - Section 2.2)
  const renderPriorityBadge = (priority: TicketPriority) => {
    const config: Record<TicketPriority, { bg: string; text: string; label: string }> = {
      LOW: { bg: "#F1F5F9", text: "#475569", label: "Low" },
      MEDIUM: { bg: "#EAF6EF", text: "#0B7A46", label: "Medium" },
      HIGH: { bg: "#FEF3C7", text: "#B45309", label: "High" },
      URGENT: { bg: "#FEE2E2", text: "#B91C1C", label: "Urgent" },
    };

    const current = config[priority] || { bg: "#F1F5F9", text: "#475569", label: priority };

    return (
      <span
        className="badge rounded-pill fw-medium"
        style={{ backgroundColor: current.bg, color: current.text, padding: "5px 10px" }}
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

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }}>
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#24272A" }}>
            Ticket Queue
          </h1>
          <p className="text-secondary small mb-0">
            {pagination.totalItems > 0
              ? `Showing ${(pagination.page - 1) * pagination.pageSize + 1} to ${Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.totalItems
                )} of ${pagination.totalItems} tickets`
              : "0 tickets in queue"}
          </p>
        </div>

        {/* Ownership Toggle Buttons */}
        <div className="btn-group shadow-sm" role="group" aria-label="Ownership filter">
          <button
            type="button"
            className={`btn btn-sm ${
              ownershipFilter === "ALL" ? "btn-success text-white fw-semibold" : "btn-outline-secondary"
            }`}
            style={ownershipFilter === "ALL" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : {}}
            onClick={() => {
              setOwnershipFilter("ALL");
              setPage(1);
            }}
          >
            All Tickets
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              ownershipFilter === "UNASSIGNED"
                ? "btn-success text-white fw-semibold"
                : "btn-outline-secondary"
            }`}
            style={
              ownershipFilter === "UNASSIGNED" ? { backgroundColor: "#006B3C", borderColor: "#006B3C" } : {}
            }
            onClick={() => {
              setOwnershipFilter("UNASSIGNED");
              setPage(1);
            }}
          >
            Unassigned
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              ownershipFilter === "ASSIGNED_TO_ME"
                ? "btn-success text-white fw-semibold"
                : "btn-outline-secondary"
            }`}
            style={
              ownershipFilter === "ASSIGNED_TO_ME"
                ? { backgroundColor: "#006B3C", borderColor: "#006B3C" }
                : {}
            }
            onClick={() => {
              setOwnershipFilter("ASSIGNED_TO_ME");
              setPage(1);
            }}
          >
            Assigned to Me
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="card shadow-sm border-0 mb-4 p-3" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="row g-3 align-items-center">
          {/* Search Box */}
          <div className="col-12 col-md-5">
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
                className="form-control border-start-0 ps-0"
                placeholder="Search by ticket number, summary, or requester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tickets"
              />
              {search && (
                <button
                  className="btn btn-outline-secondary border-start-0"
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_REQUESTER">Waiting for Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="col-12 col-md-1 d-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-link text-decoration-none text-danger small p-0"
                onClick={handleClearFilters}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger py-2 d-flex justify-content-between align-items-center mb-4" role="alert">
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger" onClick={fetchQueueTickets}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="card shadow-sm border-0 py-5 text-center text-muted">
          <div className="spinner-border text-success mx-auto mb-2" role="status">
            <span className="visually-hidden">Loading queue...</span>
          </div>
          <p className="mb-0 small">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card shadow-sm border-0 py-5 text-center text-muted">
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
          <h5 className="fw-semibold text-dark mb-1">
            {hasActiveFilters ? "No tickets match your filters" : "No tickets currently in the queue"}
          </h5>
          <p className="small mb-3 text-secondary">
            {hasActiveFilters
              ? "Try adjusting or clearing your search filters to find tickets."
              : "New tickets submitted by Requesters will appear here."}
          </p>
          {hasActiveFilters && (
            <div>
              <button
                className="btn btn-sm text-white"
                style={{ backgroundColor: "#006B3C" }}
                onClick={handleClearFilters}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 1024px) */}
          <div className="d-none d-lg-block card shadow-sm border-0 mb-4 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#F0F4F2", borderBottom: "1px solid #D5DDD8" }}>
                  <tr className="text-secondary small fw-semibold text-uppercase">
                    <th style={{ width: "14%", padding: "12px 16px" }}>Ticket No</th>
                    <th style={{ width: "13%", padding: "12px 16px" }}>Date</th>
                    <th style={{ width: "24%", padding: "12px 16px" }}>Summary</th>
                    <th style={{ width: "10%", padding: "12px 16px" }}>Category</th>
                    <th style={{ width: "9%", padding: "12px 16px" }}>Req Prio</th>
                    <th style={{ width: "9%", padding: "12px 16px" }}>IT Prio</th>
                    <th style={{ width: "11%", padding: "12px 16px" }}>Status</th>
                    <th style={{ width: "10%", padding: "12px 16px" }}>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #E5EAE7" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <Link
                          to={`/queue/${t.id}`}
                          className="fw-bold text-decoration-none"
                          style={{ color: "#006B3C" }}
                        >
                          {t.ticketNo}
                        </Link>
                      </td>
                      <td className="small text-secondary" style={{ padding: "14px 16px" }}>
                        {formatDate(t.createdAt)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div
                          className="fw-medium text-dark text-truncate"
                          style={{ maxWidth: 260 }}
                          title={t.summary}
                        >
                          {t.summary}
                        </div>
                        {t.requester && (
                          <div className="small text-muted text-truncate" style={{ maxWidth: 260 }}>
                            By {t.requester.name}
                          </div>
                        )}
                      </td>
                      <td className="small" style={{ padding: "14px 16px" }}>
                        <span className="text-secondary">{t.category?.name || "-"}</span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {renderPriorityBadge(t.requestedPriority)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {renderPriorityBadge(t.itPriority)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {renderStatusBadge(t.currentStatus || t.status)}
                      </td>
                      <td className="small" style={{ padding: "14px 16px" }}>
                        {t.owner ? (
                          <span className="fw-medium text-dark">{t.owner.name}</span>
                        ) : (
                          <span className="text-muted fst-italic">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Cards View (< 1024px) */}
          <div className="d-lg-none d-flex flex-column gap-3 mb-4">
            {tickets.map((t) => (
              <div key={t.id} className="card shadow-sm border-0 p-3" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <Link
                      to={`/queue/${t.id}`}
                      className="fw-bold text-decoration-none fs-6"
                      style={{ color: "#006B3C" }}
                    >
                      {t.ticketNo}
                    </Link>
                    <div className="small text-muted">{formatDate(t.createdAt)}</div>
                  </div>
                  {renderStatusBadge(t.currentStatus || t.status)}
                </div>

                <h6 className="fw-semibold text-dark mb-2">{t.summary}</h6>

                <div className="d-flex flex-wrap gap-2 align-items-center small text-secondary mb-3">
                  <span>Req: {t.requester?.name || "-"}</span>
                  <span>•</span>
                  <span>Cat: {t.category?.name || "-"}</span>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <div className="d-flex gap-1 align-items-center">
                    <span className="small text-muted me-1">IT Prio:</span>
                    {renderPriorityBadge(t.itPriority)}
                  </div>
                  <div className="small">
                    {t.owner ? (
                      <span className="fw-medium text-dark">{t.owner.name}</span>
                    ) : (
                      <span className="text-muted fst-italic">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <Link
                    to={`/queue/${t.id}`}
                    className="btn btn-sm btn-outline-success w-100 fw-medium"
                    style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Navigation */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
              <span className="small text-secondary">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <nav aria-label="Ticket Queue Pagination">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${!pagination.hasPreviousPage ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!pagination.hasPreviousPage}
                      aria-label="Previous Page"
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <li className="page-item disabled"><span className="page-link">…</span></li>}
                          <li className={`page-item ${p === pagination.page ? "active" : ""}`}>
                            <button
                              className="page-link"
                              style={
                                p === pagination.page
                                  ? { backgroundColor: "#006B3C", borderColor: "#006B3C", color: "#FFFFFF" }
                                  : { color: "#006B3C" }
                              }
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </button>
                          </li>
                        </React.Fragment>
                      );
                    })}
                  <li className={`page-item ${!pagination.hasNextPage ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNextPage}
                      aria-label="Next Page"
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffTicketQueue;
