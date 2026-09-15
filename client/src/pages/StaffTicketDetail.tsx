import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  StaffTicketDetailModel,
  StaffAssignee,
  TicketPriority,
  TicketStatusType,
} from "../types/staff";

// BR-16: Status Transition Matrix definition
const STATUS_TRANSITIONS: Record<TicketStatusType, TicketStatusType[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  REOPENED: ["IN_PROGRESS", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

const STATUS_LABELS: Record<TicketStatusType, string> = {
  NEW: "New",
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_REQUESTER: "Waiting for Requester",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
  CANCELLED: "Cancelled",
};

export const StaffTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data State
  const [ticket, setTicket] = useState<StaffTicketDetailModel | null>(null);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab: "comments" | "notes" | "attachments"
  const [activeTab, setActiveTab] = useState<"comments" | "notes" | "attachments">("comments");

  // In-flight form states
  const [isUpdatingOwner, setIsUpdatingOwner] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // New Comment & New Note states
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);

  // Fetch ticket details & assignees
  const fetchTicketData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [ticketRes, assigneesRes] = await Promise.all([
        apiFetch(`/api/v1/staff/tickets/${id}`),
        apiFetch("/api/v1/staff/assignees"),
      ]);

      const ticketData = await ticketRes.json();
      const assigneesData = await assigneesRes.json();

      if (!ticketRes.ok) {
        throw new Error(ticketData.error?.message || "Failed to load ticket details.");
      }

      setTicket(ticketData.data);
      if (assigneesRes.ok && assigneesData.data) {
        setAssignees(assigneesData.data);
      }
    } catch (err: any) {
      console.error("Failed to load staff ticket:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicketData();
  }, [fetchTicketData]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Claim / Reassign Ticket Owner
  const handleAssignOwner = async (targetOwnerId: string | null) => {
    if (!id || isUpdatingOwner) return;

    try {
      setIsUpdatingOwner(true);
      const res = await apiFetch(`/api/v1/staff/tickets/${id}/assignment`, {
        method: "PATCH",
        body: JSON.stringify({ ownerId: targetOwnerId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update ticket assignment.");
      }

      setTicket((prev) => (prev ? { ...prev, owner: data.data.owner } : prev));
      showToast(targetOwnerId ? "Ticket assigned successfully." : "Ticket unassigned.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingOwner(false);
    }
  };

  // 2. Update IT Priority independently
  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    if (!id || isUpdatingPriority) return;

    try {
      setIsUpdatingPriority(true);
      const res = await apiFetch(`/api/v1/staff/tickets/${id}/priority`, {
        method: "PATCH",
        body: JSON.stringify({ itPriority: newPriority }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to update IT Priority.");
      }

      setTicket((prev) => (prev ? { ...prev, itPriority: newPriority } : prev));
      showToast("IT Priority updated successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  // 3. Transition Status strictly per transition matrix
  const handleTransitionStatus = async (targetStatus: TicketStatusType) => {
    if (!id || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);
      const res = await apiFetch(`/api/v1/staff/tickets/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to transition ticket status.");
      }

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: targetStatus,
              currentStatus: targetStatus,
            }
          : prev
      );
      showToast(`Status updated to ${STATUS_LABELS[targetStatus]}.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 4. Post Public Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || isPostingComment) return;

    try {
      setIsPostingComment(true);
      const res = await apiFetch(`/api/v1/tickets/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to post comment.");
      }

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments || []), data.data],
            }
          : prev
      );
      setNewComment("");
      showToast("Comment posted successfully.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPostingComment(false);
    }
  };

  // 5. Post Internal Note (Restricted to Staff/Admin)
  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNote.trim() || isPostingNote) return;

    try {
      setIsPostingNote(true);
      const res = await apiFetch(`/api/v1/tickets/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: newNote.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to add internal note.");
      }

      setTicket((prev) =>
        prev
          ? {
              ...prev,
              notes: [...(prev.notes || []), data.data],
            }
          : prev
      );
      setNewNote("");
      showToast("Internal note added.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPostingNote(false);
    }
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority: TicketPriority) => {
    const config: Record<TicketPriority, { bg: string; text: string; label: string }> = {
      LOW: { bg: "#F1F5F9", text: "#475569", label: "Low" },
      MEDIUM: { bg: "#EAF6EF", text: "#0B7A46", label: "Medium" },
      HIGH: { bg: "#FEF3C7", text: "#B45309", label: "High" },
      URGENT: { bg: "#FEE2E2", text: "#B91C1C", label: "Urgent" },
    };
    const c = config[priority] || { bg: "#F1F5F9", text: "#475569", label: priority };
    return (
      <span className="badge rounded-pill fw-medium" style={{ backgroundColor: c.bg, color: c.text }}>
        {c.label}
      </span>
    );
  };

  // Status Badge Helper
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
    const c = config[status] || { bg: "#F1F5F9", text: "#475569", label: status };
    return (
      <span className="badge rounded-pill fw-medium" style={{ backgroundColor: c.bg, color: c.text }}>
        {c.label}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
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

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="mt-2 text-secondary small">Loading ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-5" style={{ maxWidth: 800 }}>
        <div className="alert alert-danger" role="alert">
          <h5 className="alert-heading">Error Loading Ticket</h5>
          <p className="mb-3">{error || "The requested ticket was not found."}</p>
          <Link to="/queue" className="btn btn-sm btn-outline-danger">
            &larr; Back to Ticket Queue
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = (ticket.currentStatus || ticket.status) as TicketStatusType;
  const permittedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  const isTerminalStatus = permittedTransitions.length === 0;

  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="alert alert-success position-fixed top-0 start-50 translate-middle-x mt-4 shadow-sm z-3 py-2 px-4"
          role="alert"
          style={{ minWidth: 300, backgroundColor: "#EAF6EF", borderColor: "#0B7A46", color: "#006B3C" }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/queue"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            style={{ minHeight: 38 }}
          >
            &larr; Back to Queue
          </Link>
          <div>
            <span className="h4 fw-bold mb-0 text-dark me-2">{ticket.ticketNo}</span>
            {renderStatusBadge(currentStatus)}
          </div>
        </div>

        {/* Claim shortcut if unassigned */}
        {!ticket.owner && (
          <button
            type="button"
            className="btn btn-success btn-sm text-white fw-semibold d-flex align-items-center gap-1"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C", minHeight: 38 }}
            disabled={isUpdatingOwner}
            onClick={() => handleAssignOwner("me")}
          >
            Claim Ticket
          </button>
        )}
      </div>

      {/* Operational Controls Card (Prominent Top Section) */}
      <div className="card shadow-sm border-0 mb-4 p-3" style={{ backgroundColor: "#FFFFFF" }}>
        <h6 className="fw-bold text-dark text-uppercase small mb-3" style={{ letterSpacing: 0.5 }}>
          Operational Controls
        </h6>
        <div className="row g-3">
          {/* Owner Dropdown */}
          <div className="col-12 col-md-4">
            <label htmlFor="owner-select" className="form-label small fw-semibold text-secondary mb-1">
              Ticket Owner
            </label>
            <select
              id="owner-select"
              className="form-select"
              value={ticket.owner?.id || ""}
              disabled={isUpdatingOwner}
              onChange={(e) => handleAssignOwner(e.target.value || null)}
              aria-label="Assign Ticket Owner"
            >
              <option value="">Unassigned</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role === "ADMIN" ? "Admin" : "IT Staff"})
                </option>
              ))}
            </select>
          </div>

          {/* IT Priority Dropdown */}
          <div className="col-12 col-md-4">
            <label htmlFor="it-priority-select" className="form-label small fw-semibold text-secondary mb-1">
              IT Priority (Req: {ticket.requestedPriority})
            </label>
            <select
              id="it-priority-select"
              className="form-select"
              value={ticket.itPriority}
              disabled={isUpdatingPriority}
              onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
              aria-label="Update IT Priority"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Status Transition Dropdown */}
          <div className="col-12 col-md-4">
            <label htmlFor="status-select" className="form-label small fw-semibold text-secondary mb-1">
              Workflow Status
            </label>
            <select
              id="status-select"
              className="form-select"
              value={currentStatus}
              disabled={isUpdatingStatus || isTerminalStatus}
              onChange={(e) => handleTransitionStatus(e.target.value as TicketStatusType)}
              aria-label="Transition Ticket Status"
            >
              <option value={currentStatus} disabled>
                Current: {STATUS_LABELS[currentStatus]}
              </option>
              {permittedTransitions.map((nextStatus) => (
                <option key={nextStatus} value={nextStatus}>
                  &rarr; {STATUS_LABELS[nextStatus]}
                </option>
              ))}
            </select>
            {isTerminalStatus && (
              <div className="small text-muted mt-1">Terminal status. No further transitions permitted.</div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Core Information (Read-only Card) */}
      <div className="card shadow-sm border-0 mb-4 p-4" style={{ backgroundColor: "#FFFFFF" }}>
        <h5 className="fw-bold text-dark mb-3">{ticket.summary}</h5>
        <p className="text-secondary mb-4" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {ticket.description || "No description provided."}
        </p>

        <div className="row g-3 pt-3 border-top">
          <div className="col-6 col-md-3">
            <div className="small text-muted">Requester</div>
            <div className="fw-medium text-dark">{ticket.requester?.name || "-"}</div>
            {ticket.requester?.email && <div className="small text-secondary">{ticket.requester.email}</div>}
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Category</div>
            <div className="fw-medium text-dark">{ticket.category?.name || "-"}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Related System</div>
            <div className="fw-medium text-dark">{ticket.relatedSystem?.name || "-"}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="small text-muted">Submitted At</div>
            <div className="fw-medium text-dark">{formatDate(ticket.createdAt)}</div>
          </div>
        </div>

        {/* Resolution Indicator Notice */}
        {ticket.isRequesterResolved && (
          <div
            className="alert alert-success mt-3 mb-0 py-2 d-flex align-items-center gap-2"
            style={{ backgroundColor: "#EAF6EF", borderColor: "#0B7A46", color: "#006B3C" }}
          >
            <span>&#10003;</span>
            <span className="small fw-semibold">Problem Appears Resolved (Indicated by Requester)</span>
          </div>
        )}
      </div>

      {/* Tabbed Communication & Attachments Section */}
      <div className="card shadow-sm border-0 p-3" style={{ backgroundColor: "#FFFFFF" }}>
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-semibold ${
                activeTab === "comments" ? "active text-success border-success border-bottom-0" : "text-secondary"
              }`}
              style={activeTab === "comments" ? { color: "#006B3C" } : {}}
              onClick={() => setActiveTab("comments")}
              type="button"
              role="tab"
            >
              Public Comments ({ticket.comments?.length || 0})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-semibold ${
                activeTab === "notes" ? "active fw-bold" : "text-secondary"
              }`}
              style={
                activeTab === "notes"
                  ? { color: "#854D0E", borderColor: "#854D0E", borderBottomColor: "#FFFFFF" }
                  : {}
              }
              onClick={() => setActiveTab("notes")}
              type="button"
              role="tab"
            >
              Internal Notes ({ticket.notes?.length || 0})
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-semibold ${
                activeTab === "attachments" ? "active text-success border-success border-bottom-0" : "text-secondary"
              }`}
              style={activeTab === "attachments" ? { color: "#006B3C" } : {}}
              onClick={() => setActiveTab("attachments")}
              type="button"
              role="tab"
            >
              Attachments ({ticket.attachments?.length || 0})
            </button>
          </li>
        </ul>

        {/* Tab 1: Public Comments */}
        {activeTab === "comments" && (
          <div>
            <div className="d-flex flex-column gap-3 mb-4">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <div className="text-muted text-center py-4 small">No public comments yet on this ticket.</div>
              ) : (
                ticket.comments.map((comment) => (
                  <div key={comment.id} className="d-flex gap-3 p-3 rounded-3" style={{ backgroundColor: "#F5F7F6" }}>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                      style={{ width: 38, height: 38, backgroundColor: "#006B3C", fontSize: 14 }}
                    >
                      {comment.author?.name ? comment.author.name.slice(0, 2).toUpperCase() : "U"}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-semibold text-dark">{comment.author?.name || "Anonymous"}</span>
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: comment.author?.role === "REQUESTER" ? "#E0F2FE" : "#EAF6EF",
                            color: comment.author?.role === "REQUESTER" ? "#0369A1" : "#006B3C",
                            fontSize: 11,
                          }}
                        >
                          {comment.author?.role === "REQUESTER" ? "Requester" : "IT Staff"}
                        </span>
                        <span className="small text-muted">{formatDate(comment.createdAt)}</span>
                      </div>
                      <div className="text-dark" style={{ whiteSpace: "pre-wrap" }}>
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Public Comment Form */}
            <form onSubmit={handlePostComment} className="border-top pt-3">
              <label htmlFor="staff-comment-input" className="form-label small fw-semibold text-secondary mb-1">
                Add Public Comment
              </label>
              <textarea
                id="staff-comment-input"
                className="form-control mb-2"
                rows={3}
                placeholder="Write a public comment to the requester..."
                value={newComment}
                maxLength={2000}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">{newComment.length} / 2000</span>
                <button
                  type="submit"
                  className="btn btn-sm text-white fw-semibold"
                  style={{ backgroundColor: "#006B3C", minHeight: 38 }}
                  disabled={!newComment.trim() || isPostingComment}
                >
                  {isPostingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Internal Notes (Amber Styling) */}
        {activeTab === "notes" && (
          <div>
            {/* Amber Distinction Banner (UI-23, BR-07, BR-25) */}
            <div
              className="alert py-2 px-3 mb-3 d-flex align-items-center gap-2"
              role="alert"
              style={{
                backgroundColor: "#FEFCE8",
                borderColor: "#854D0E",
                color: "#854D0E",
                borderWidth: 1,
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{ width: 18, height: 18, flexShrink: 0 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
              <span className="small fw-semibold">
                Internal Notes are private and never visible to the ticket Requester.
              </span>
            </div>

            {/* Notes List */}
            <div className="d-flex flex-column gap-3 mb-4">
              {(!ticket.notes || ticket.notes.length === 0) ? (
                <div className="text-muted text-center py-4 small">No internal notes added yet.</div>
              ) : (
                ticket.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-3"
                    style={{
                      backgroundColor: "#FFFBEB",
                      borderLeft: "4px solid #854D0E",
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold" style={{ color: "#854D0E" }}>
                          {note.author?.name || "IT Staff"}
                        </span>
                        <span className="badge rounded-pill bg-warning text-dark" style={{ fontSize: 11 }}>
                          Internal Note
                        </span>
                      </div>
                      <span className="small text-muted">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="text-dark" style={{ whiteSpace: "pre-wrap" }}>
                      {note.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Internal Note Form */}
            <form onSubmit={handlePostNote} className="border-top pt-3">
              <label htmlFor="staff-note-input" className="form-label small fw-semibold text-secondary mb-1">
                Add Internal Note
              </label>
              <textarea
                id="staff-note-input"
                className="form-control mb-2"
                rows={3}
                placeholder="Write an internal operational note (hidden from requester)..."
                value={newNote}
                maxLength={2000}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">{newNote.length} / 2000</span>
                <button
                  type="submit"
                  className="btn btn-sm fw-semibold text-white"
                  style={{ backgroundColor: "#854D0E", minHeight: 38 }}
                  disabled={!newNote.trim() || isPostingNote}
                >
                  {isPostingNote ? "Saving Note..." : "Add Internal Note"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Attachments */}
        {activeTab === "attachments" && (
          <div>
            {(!ticket.attachments || ticket.attachments.length === 0) ? (
              <div className="text-muted text-center py-4 small">No attachments associated with this ticket.</div>
            ) : (
              <div className="list-group list-group-flush">
                {ticket.attachments.map((att) => {
                  const isRemoved = Boolean(att.removedAt);
                  return (
                    <div
                      key={att.id}
                      className="list-group-item d-flex justify-content-between align-items-center px-0 py-2"
                    >
                      <div>
                        <div className={`fw-medium ${isRemoved ? "text-muted text-decoration-line-through" : "text-dark"}`}>
                          {att.fileName}
                        </div>
                        <div className="small text-muted">
                          {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : "-"} • {att.mimeType || "-"}
                          {isRemoved && (
                            <span className="text-danger ms-2">
                              (Removed: {att.removalReason || "No reason given"})
                            </span>
                          )}
                        </div>
                      </div>
                      {!isRemoved && (
                        <a
                          href={`/api/v1/attachments/${att.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-secondary"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTicketDetail;
