import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useRequester } from "../context/RequesterContext";

interface Category {
  id: number;
  name: string;
}

interface Ticket {
  id: number;
  ticketNo: string;
  summary: string;
  description: string;
  requestedPriority: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    name: string;
  };
  relatedSystem?: {
    id: number;
    name: string;
  };
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  // Lab 2 / UI Spec:
  // 6 supported sort options
  const [sort, setSort] = useState("createdAt_desc");

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Request states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Used to distinguish an empty ticket list from a filtered no-results state
  const isFiltered = Boolean(
    debouncedSearch || categoryId || priority || status
  );

  // BR-22:
  // If no Development Requester is selected,
  // return to the Requester Selection screen.
  useEffect(() => {
    if (!selectedRequester?.id) {
      navigate("/select-requester");
    }
  }, [selectedRequester, navigate]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch active categories for the Category filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/v1/categories");

        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.data || [];

          setCategories(list);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch tickets whenever requester, filters, sorting,
  // or pagination changes.
  useEffect(() => {
    if (!selectedRequester?.id) {
      return;
    }

    const fetchTickets = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          requesterId: String(selectedRequester.id),
          page: String(page),
          limit: String(limit),
          sort,
        });

        if (debouncedSearch) {
          params.append("search", debouncedSearch);
        }

        if (categoryId) {
          params.append("categoryId", categoryId);
        }

        if (priority) {
          params.append("priority", priority);
        }

        if (status) {
          params.append("status", status);
        }

        const res = await fetch(
          `/api/v1/tickets?${params.toString()}`
        );

        const result = await res.json();

        if (res.ok) {
          setTickets(result.data || []);

          if (result.meta) {
            setTotal(result.meta.total ?? 0);
            setTotalPages(result.meta.totalPages ?? 0);
          } else {
            setTotal(0);
            setTotalPages(0);
          }
        } else {
          setTickets([]);
          setTotal(0);
          setTotalPages(0);

          setError(
            result.error?.message || "Failed to fetch tickets."
          );
        }
      } catch (err) {
        setTickets([]);
        setTotal(0);
        setTotalPages(0);

        setError("An error occurred while loading tickets.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [
    selectedRequester,
    debouncedSearch,
    categoryId,
    priority,
    status,
    sort,
    page,
    limit,
  ]);

  // Reset all filters and sorting
  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setPriority("");
    setStatus("");
    setSort("createdAt_desc");
    setPage(1);
  };

  const renderPriorityBadge = (p: string) => {
    switch (p.toUpperCase()) {
      case "HIGH":
      case "URGENT":
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            High
          </span>
        );

      case "MEDIUM":
        return (
          <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            Medium
          </span>
        );

      case "LOW":
        return (
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            Low
          </span>
        );

      default:
        return (
          <span className="badge bg-light text-dark rounded-pill px-2 py-1 fw-medium">
            {p}
          </span>
        );
    }
  };

  const renderStatusBadge = (s: string) => {
    switch (s.toUpperCase()) {
      case "NEW":
        return (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            New
          </span>
        );

      case "IN_PROGRESS":
        return (
          <span
            className="badge text-white rounded-pill px-2 py-1 fw-medium"
            style={{ backgroundColor: "#52C41A" }}
          >
            In Progress
          </span>
        );

      case "PENDING":
        return (
          <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            Pending
          </span>
        );

      case "RESOLVED":
        return (
          <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            Resolved
          </span>
        );

      case "CLOSED":
        return (
          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            Closed
          </span>
        );

      default:
        return (
          <span className="badge bg-light text-dark rounded-pill px-2 py-1 fw-medium">
            {s}
          </span>
        );
    }
  };

  return (
    <div
      className="container py-4"
      style={{ maxWidth: 1140 }}
    >
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1 text-dark">
            My Tickets
          </h1>

          <p className="text-secondary small mb-0">
            View and track all of your support requests.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleClearFilters}
            className="btn btn-outline-secondary rounded-2 px-3 py-2 small fw-medium d-inline-flex align-items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              style={{ width: 15, height: 15 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>

            Clear Filters
          </button>

          <button
            type="button"
            onClick={() => navigate("/create-ticket")}
            className="btn text-white rounded-2 px-3 py-2 small fw-medium shadow-sm d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: "#006B3C" }}
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
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
        <div className="row g-3 align-items-end">
          {/* Search */}
          <div className="col-lg-4 col-md-12">
            <label className="form-label text-secondary small fw-medium mb-1">
              Search
            </label>

            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 border-light-subtle text-secondary">
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
              </span>

              <input
                type="text"
                placeholder="Search by ticket number, summary, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control border-start-0 border-light-subtle rounded-end-2 small py-2"
              />
            </div>
          </div>

          {/* Category */}
          <div className="col-lg-2 col-md-4">
            <label className="form-label text-secondary small fw-medium mb-1">
              Category
            </label>

            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="form-select rounded-2 border-light-subtle small py-2 text-secondary"
            >
              <option value="">All Categories</option>

              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="col-lg-2 col-md-4">
            <label className="form-label text-secondary small fw-medium mb-1">
              Priority
            </label>

            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="form-select rounded-2 border-light-subtle small py-2 text-secondary"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Status */}
          <div className="col-lg-2 col-md-4">
            <label className="form-label text-secondary small fw-medium mb-1">
              Status
            </label>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="form-select rounded-2 border-light-subtle small py-2 text-secondary"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="col-lg-2 col-md-12">
            <label
              htmlFor="ticketSort"
              className="form-label text-secondary small fw-medium mb-1"
            >
              Sort
            </label>

            <select
              id="ticketSort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="form-select rounded-2 border-light-subtle small py-2 text-secondary"
            >
              <option value="createdAt_desc">
                Newest first
              </option>

              <option value="createdAt_asc">
                Oldest first
              </option>

              <option value="priority_desc">
                Priority: High → Low
              </option>

              <option value="priority_asc">
                Priority: Low → High
              </option>

              <option value="ticketNo_asc">
                Ticket No.: A → Z
              </option>

              <option value="ticketNo_desc">
                Ticket No.: Z → A
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="alert alert-danger border-0 shadow-sm rounded-3 mb-4 py-2 px-3 small"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Ticket List */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white mb-3">
        {isLoading ? (
          <div className="text-center py-5 text-secondary">
            <div
              className="spinner-border spinner-border-sm text-success me-2"
              role="status"
            />

            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          isFiltered ? (
            /* No-results state */
            <div className="text-center py-5 text-secondary">
              <div className="fs-2 mb-2">🔍</div>

              <p className="fw-medium text-dark mb-1">
                No tickets match your current filters.
              </p>

              <p className="small text-muted mb-3">
                Try adjusting or clearing your search and filter criteria.
              </p>

              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-sm btn-outline-secondary rounded-2 px-3"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-5 text-secondary">
              <div className="fs-2 mb-2">🎫</div>

              <p className="fw-medium text-dark mb-1">
                No tickets found
              </p>

              <p className="small text-muted mb-3">
                You haven't created any support tickets yet.
              </p>

              <button
                type="button"
                onClick={() => navigate("/create-ticket")}
                className="btn btn-sm text-white rounded-2 px-3 fw-medium"
                style={{ backgroundColor: "#006B3C" }}
              >
                Create Your First Ticket
              </button>
            </div>
          )
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light border-bottom">
                <tr className="small text-secondary">
                  <th className="py-3 px-3">
                    Ticket No.
                  </th>

                  <th className="py-3 px-3">
                    Created Date
                  </th>

                  <th className="py-3 px-3">
                    Summary
                  </th>

                  <th className="py-3 px-3">
                    Category
                  </th>

                  <th className="py-3 px-3">
                    Priority
                  </th>

                  <th className="py-3 px-3">
                    Status
                  </th>

                  <th className="py-3 px-3 text-end">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="small">
                    <td
                      className="py-3 px-3 font-monospace fw-semibold"
                      style={{ color: "#006B3C" }}
                    >
                      {t.ticketNo}
                    </td>

                    <td className="py-3 px-3 text-secondary">
                      {new Date(t.createdAt).toLocaleString(
                        "en-US",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      )}
                    </td>

                    <td
                      className="py-3 px-3 fw-medium text-dark text-truncate"
                      style={{ maxWidth: 250 }}
                      title={t.summary}
                    >
                      {t.summary}
                    </td>

                    <td className="py-3 px-3 text-secondary">
                      {t.category?.name || "-"}
                    </td>

                    <td className="py-3 px-3">
                      {renderPriorityBadge(
                        t.requestedPriority
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {renderStatusBadge(t.currentStatus)}
                    </td>

                    <td className="py-3 px-3 text-end">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/tickets/${t.id}`)
                        }
                        className="btn btn-sm btn-outline-success rounded-2 px-3 fw-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && tickets.length > 0 && (
        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 text-secondary small mt-3">
          <div>
            Showing{" "}
            <span className="fw-semibold text-dark">
              {(page - 1) * limit + 1}
            </span>{" "}
            to{" "}
            <span className="fw-semibold text-dark">
              {Math.min(page * limit, total)}
            </span>{" "}
            of{" "}
            <span className="fw-semibold text-dark">
              {total}
            </span>{" "}
            tickets
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn btn-sm btn-outline-secondary rounded-2 px-3"
            >
              &lt; Previous
            </button>

            {Array.from(
              { length: totalPages },
              (_, i) => i + 1
            ).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPage(p)}
                className={`btn btn-sm rounded-2 px-3 ${
                  page === p
                    ? "text-white fw-medium"
                    : "btn-outline-secondary"
                }`}
                style={
                  page === p
                    ? {
                        backgroundColor: "#006B3C",
                        borderColor: "#006B3C",
                      }
                    : {}
                }
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-sm btn-outline-secondary rounded-2 px-3"
            >
              Next &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}