import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";

interface Ticket {
  id: string;
  ticketNo: string;
  summary: string;
  description: string;
  currentStatus: string;
  requestedPriority: string;
  createdAt: string;
  category?: { name: string };
  relatedSystem?: { name: string };
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRequester?.id) {
      navigate("/select-requester");
      return;
    }

    async function fetchTicket() {
      const requesterId = selectedRequester?.id;
      if (!id || !requesterId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/v1/tickets/${id}?requesterId=${requesterId}`, {
          headers: {
            "x-requester-id": String(requesterId),
          },
        });

        if (res.status === 403) {
          throw new Error("Access denied: You do not have permission to view this ticket.");
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Failed to fetch ticket details.");
        }

        const data = await res.json();
        setTicket(data.data || data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [id, selectedRequester, navigate]);

  const renderPriorityBadge = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">High</span>;
      case "MEDIUM":
        return <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">Medium</span>;
      case "LOW":
        return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">Low</span>;
      default:
        return <span className="badge bg-light text-dark rounded-pill px-2.5 py-1 fw-medium">{priority || "-"}</span>;
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "NEW":
        return <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">New</span>;
      case "IN_PROGRESS":
        return <span className="badge text-white rounded-pill px-2.5 py-1 fw-medium" style={{ backgroundColor: "#52C41A" }}>In Progress</span>;
      case "PENDING":
        return <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">Pending</span>;
      case "RESOLVED":
        return <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">Resolved</span>;
      case "CLOSED":
        return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1 fw-medium">Closed</span>;
      default:
        return <span className="badge bg-light text-dark rounded-pill px-2.5 py-1 fw-medium">{status || "-"}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border spinner-border-sm text-success me-2" role="status"></div>
        Loading ticket details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4" style={{ maxWidth: 800 }}>
        <div className="alert alert-danger border-0 shadow-sm rounded-3 mb-3" role="alert">
          {error}
        </div>
        <Link to="/tickets" className="btn btn-outline-secondary btn-sm rounded-2">
          &larr; Back to My Tickets
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container py-4 text-center text-secondary" style={{ maxWidth: 800 }}>
        <p>Ticket not found.</p>
        <Link to="/tickets" className="btn btn-outline-secondary btn-sm rounded-2">
          &larr; Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      {/* Back Button */}
      <div className="mb-3">
        <Link to="/tickets" className="btn btn-outline-secondary btn-sm rounded-2 fw-medium d-inline-flex align-items-center gap-1">
          &larr; Back to My Tickets
        </Link>
      </div>

      {/* Detail Card */}
      <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h4 fw-bold font-monospace mb-0" style={{ color: "#006B3C" }}>
            {ticket.ticketNo}
          </h1>
          <div>{renderStatusBadge(ticket.currentStatus)}</div>
        </div>

        {/* Title / Summary */}
        <h2 className="h5 fw-bold text-dark mb-3">{ticket.summary}</h2>

        {/* Metadata Read-Only Box */}
        <div className="p-3 rounded-2 mb-4" style={{ backgroundColor: "#F5F7F6", border: "1px solid #EAF6EF" }}>
          <div className="row g-3 small">
            <div className="col-sm-6">
              <span className="text-secondary d-block mb-1">Category</span>
              <span className="fw-semibold text-dark">{ticket.category?.name || "-"}</span>
            </div>
            <div className="col-sm-6">
              <span className="text-secondary d-block mb-1">Related System</span>
              <span className="fw-semibold text-dark">{ticket.relatedSystem?.name || "-"}</span>
            </div>
            <div className="col-sm-6">
              <span className="text-secondary d-block mb-1">Priority</span>
              <div>{renderPriorityBadge(ticket.requestedPriority)}</div>
            </div>
            <div className="col-sm-6">
              <span className="text-secondary d-block mb-1">Created At</span>
              <span className="fw-semibold text-dark">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <h3 className="h6 fw-semibold text-secondary mb-2">Description</h3>
          <p className="text-dark mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
            {ticket.description}
          </p>
        </div>
      </div>
    </div>
  );
}