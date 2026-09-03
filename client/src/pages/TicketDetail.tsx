import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";

interface Attachment {
  id: string;
  fileName?: string;
  filename?: string;
  originalName?: string;
  fileSize?: number;
  size?: number;
  mimeType?: string;
  contentType?: string;
  createdAt?: string;
  uploadedAt?: string;
  isRemoved?: boolean;
  removedAt?: string | null;
}

interface Ticket {
  id: string;
  ticketNo: string;
  requesterId?: number;
  requester?: {
    id: number;
    name: string;
    email?: string;
  };
  summary: string;
  description: string;
  currentStatus: string;
  requestedPriority: string;
  createdAt: string;
  updatedAt?: string;
  category?: {
    id?: number;
    name: string;
  };
  relatedSystem?: {
    id?: number;
    name: string;
  };
  attachments?: Attachment[];
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No requester selected -> go to requester selection.
    if (!selectedRequester?.id) {
      navigate("/select-requester");
      return;
    }

    // Store the narrowed requester value so TypeScript knows
    // it cannot become null inside the async function.
    const requester = selectedRequester;

    async function fetchTicket() {
      if (!id) {
        setError("Ticket not found.");
        setLoading(false);
        return;
      }

      const requesterId = requester.id;

      try {
        setLoading(true);
        setError(null);

        // Lab 2 API:
        // GET /api/v1/tickets/:id?requesterId={requesterId}
        const res = await fetch(
          `/api/v1/tickets/${id}?requesterId=${requesterId}`
        );

        // Cross-requester access.
        if (res.status === 403) {
          setError(
            "You do not have permission to access this ticket."
          );
          return;
        }

        // Ticket does not exist.
        if (res.status === 404) {
          setError("Ticket not found.");
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));

          setError(
            errData.error?.message ||
              "Unable to load ticket details. Please try again."
          );
          return;
        }

        const responseData = await res.json();

        // Lab 2 single-resource response:
        // { data: {...} }
        setTicket(responseData.data || responseData);
      } catch (err) {
        console.error("Error fetching ticket details:", err);

        setError(
          "Unable to load ticket details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [id, selectedRequester, navigate]);

  const renderPriorityBadge = (priority?: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
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
            {priority || "-"}
          </span>
        );
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "NEW":
        return (
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 fw-medium">
            New
          </span>
        );

      default:
        return (
          <span className="badge bg-light text-dark rounded-pill px-2 py-1 fw-medium">
            {status || "-"}
          </span>
        );
    }
  };

  const formatDate = (date?: string) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) {
      return "-";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAttachmentName = (attachment: Attachment) => {
    return (
      attachment.fileName ||
      attachment.filename ||
      attachment.originalName ||
      "Unnamed attachment"
    );
  };

  const getAttachmentSize = (attachment: Attachment) => {
    return attachment.fileSize ?? attachment.size;
  };

  const getAttachmentMimeType = (attachment: Attachment) => {
    return attachment.mimeType || attachment.contentType || "-";
  };

  const getAttachmentDate = (attachment: Attachment) => {
    return attachment.uploadedAt || attachment.createdAt;
  };

  if (loading) {
    return (
      <div
        className="container py-5 text-center text-secondary"
        style={{ maxWidth: 1280 }}
      >
        <div
          className="spinner-border spinner-border-sm text-success me-2"
          role="status"
          aria-hidden="true"
        ></div>

        Loading ticket details...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="container py-4"
        style={{ maxWidth: 1280 }}
      >
        <div
          className="alert alert-danger border-0 shadow-sm rounded-3 mb-3"
          role="alert"
        >
          {error}
        </div>

        <Link
          to="/tickets"
          className="btn btn-outline-secondary btn-sm rounded-2"
        >
          &larr; Back to My Tickets
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div
        className="container py-4 text-center text-secondary"
        style={{ maxWidth: 1280 }}
      >
        <p>Ticket not found.</p>

        <Link
          to="/tickets"
          className="btn btn-outline-secondary btn-sm rounded-2"
        >
          &larr; Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container py-4"
      style={{ maxWidth: 1280 }}
    >
      {/* Back to My Tickets */}
      <div className="mb-4">
        <Link
          to="/tickets"
          className="btn btn-outline-secondary btn-sm rounded-2 fw-medium d-inline-flex align-items-center gap-1"
        >
          &larr; Back to My Tickets
        </Link>
      </div>

      {/* Main Ticket Detail Card */}
      <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
          <div>
            <div className="text-secondary small mb-1">
              Ticket Detail
            </div>

            <h1
              className="h4 fw-bold font-monospace mb-0"
              style={{ color: "#006B3C" }}
            >
              {ticket.ticketNo}
            </h1>
          </div>

          <div>
            {renderStatusBadge(ticket.currentStatus)}
          </div>
        </div>

        {/* Ticket Information */}
        <section className="mb-4">
          <h2 className="h6 fw-bold text-dark mb-3">
            Ticket Information
          </h2>

          {/* Read-only fields */}
          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: "#F0F4F2",
              border: "1px solid #D5DDD8",
            }}
          >
            <div className="row g-3">
              {/* Requester */}
              <div className="col-12 col-md-6">
                <span className="text-secondary d-block small mb-1">
                  Requester
                </span>

                <span className="fw-semibold text-dark">
                  {ticket.requester?.name ||
                    (ticket.requesterId === selectedRequester?.id
                      ? selectedRequester?.name
                      : "-")}
                </span>
              </div>

              {/* Category */}
              <div className="col-12 col-md-6">
                <span className="text-secondary d-block small mb-1">
                  Category
                </span>

                <span className="fw-semibold text-dark">
                  {ticket.category?.name || "-"}
                </span>
              </div>

              {/* Related System */}
              <div className="col-12 col-md-6">
                <span className="text-secondary d-block small mb-1">
                  Related System
                </span>

                <span className="fw-semibold text-dark">
                  {ticket.relatedSystem?.name || "-"}
                </span>
              </div>

              {/* Requested Priority */}
              <div className="col-12 col-md-6">
                <span className="text-secondary d-block small mb-1">
                  Requested Priority
                </span>

                <div>
                  {renderPriorityBadge(
                    ticket.requestedPriority
                  )}
                </div>
              </div>

              {/* Created At */}
              <div className="col-12 col-md-6">
                <span className="text-secondary d-block small mb-1">
                  Created
                </span>

                <span className="fw-semibold text-dark">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>

              {/* Last Updated */}
              <div className="col-12 col-md-6">
                <span className="text-secondary d-block small mb-1">
                  Last Updated
                </span>

                <span className="fw-semibold text-dark">
                  {formatDate(ticket.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="mb-4">
          <h2 className="h6 fw-bold text-dark mb-2">
            Summary
          </h2>

          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: "#F0F4F2",
              border: "1px solid #D5DDD8",
            }}
          >
            <p className="text-dark mb-0">
              {ticket.summary}
            </p>
          </div>
        </section>

        {/* Description */}
        <section className="mb-4">
          <h2 className="h6 fw-bold text-dark mb-2">
            Description
          </h2>

          <div
            className="p-3 rounded-3"
            style={{
              backgroundColor: "#F0F4F2",
              border: "1px solid #D5DDD8",
            }}
          >
            <p
              className="text-dark mb-0"
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
              }}
            >
              {ticket.description}
            </p>
          </div>
        </section>

        {/* Attachments */}
        <section>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 fw-bold text-dark mb-0">
              Attachments
            </h2>

            <span className="text-secondary small">
              {ticket.attachments?.length || 0} attachment
              {ticket.attachments?.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Empty attachment state */}
          {!ticket.attachments ||
          ticket.attachments.length === 0 ? (
            <div
              className="p-4 rounded-3 text-center text-secondary"
              style={{
                backgroundColor: "#F0F4F2",
                border: "1px solid #D5DDD8",
              }}
            >
              No attachments.
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {ticket.attachments.map((attachment) => {
                const attachmentName =
                  getAttachmentName(attachment);

                const attachmentSize =
                  getAttachmentSize(attachment);

                const mimeType =
                  getAttachmentMimeType(attachment);

                const attachmentDate =
                  getAttachmentDate(attachment);

                const isRemoved =
                  attachment.isRemoved === true ||
                  Boolean(attachment.removedAt);

                return (
                  <div
                    key={attachment.id}
                    className="p-3 rounded-3"
                    style={{
                      backgroundColor: "#F0F4F2",
                      border: "1px solid #D5DDD8",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark text-break">
                          {attachmentName}
                        </div>

                        <div className="small text-secondary mt-1">
                          {formatFileSize(attachmentSize)}
                          {" · "}
                          {mimeType}
                        </div>

                        {attachmentDate && (
                          <div className="small text-secondary mt-1">
                            Uploaded{" "}
                            {formatDate(attachmentDate)}
                          </div>
                        )}

                        {isRemoved && (
                          <div className="small text-secondary mt-1">
                            Status: Removed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}