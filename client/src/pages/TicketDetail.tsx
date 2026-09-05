import { useEffect, useState, useCallback, useRef } from "react";
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
  removedAt?: string | null;
  removalReason?: string | null;
  isRemoved?: boolean;
}

interface Ticket {
  id: string;
  ticketNo: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority?: string | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  requesterId?: number;
  requester?: {
    id: number;
    name: string;
    email?: string;
  };
  category?: {
    id: number;
    name: string;
  };
  relatedSystem?: {
    id: number;
    name: string;
  };
  attachments?: Attachment[];
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [attachmentToRemove, setAttachmentToRemove] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalReasonError, setRemovalReasonError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!selectedRequester?.id) {
      navigate("/select-requester");
      return;
    }

    if (!id) {
      setError("Ticket not found.");
      setLoading(false);
      return;
    }

    const requesterId = selectedRequester.id;

    try {
      setLoading(true);
      setError(null);

      // Lab 2 API: GET /api/v1/tickets/:id?requesterId={requesterId}
      const res = await fetch(
        `/api/v1/tickets/${id}?requesterId=${requesterId}`
      );

      // Cross-requester access.
      if (res.status === 403) {
        setError("You do not have permission to access this ticket.");
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
      setTicket(responseData.data || responseData);
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setError("Unable to load ticket details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, selectedRequester, navigate]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const activeAttachments =
    ticket?.attachments?.filter(
      (att) => !att.removedAt && !att.isRemoved
    ) || [];
  const activeAttachmentsCount = activeAttachments.length;
  const isMaxAttachmentsReached = activeAttachmentsCount >= 5;

  const handleAddAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !selectedRequester?.id) return;
    e.target.value = ""; // reset file input

    setUploadError(null);
    setUploadSuccess(null);

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError("This file type is not supported. Allowed: JPG, JPEG, PNG, WEBP, PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must not exceed 5 MiB (5,242,880 bytes).");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/api/v1/tickets/${id}/attachments?requesterId=${selectedRequester.id}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const resData = await res.json();

      if (!res.ok) {
        setUploadError(resData.error?.message || "Failed to upload attachment.");
      } else {
        setUploadSuccess("Attachment uploaded successfully.");
        await fetchTicket();
      }
    } catch {
      setUploadError("Unable to upload the attachment. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    if (!selectedRequester?.id) return;
    setDownloadError(null);

    const downloadUrl = `/api/v1/attachments/${attachment.id}/download?requesterId=${selectedRequester.id}`;
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 404 && errData.error?.code === "ATTACHMENT_NOT_AVAILABLE") {
          setDownloadError("This attachment is no longer available for download.");
        } else {
          setDownloadError(errData.error?.message || "Unable to download the attachment. Please try again.");
        }
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getAttachmentName(attachment);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setDownloadError("Unable to download the attachment. Please try again.");
    }
  };

  const openRemoveModal = (attachment: Attachment) => {
    setAttachmentToRemove(attachment);
    setRemovalReason("");
    setRemovalReasonError(null);
  };

  const closeRemoveModal = () => {
    setAttachmentToRemove(null);
    setRemovalReason("");
    setRemovalReasonError(null);
  };

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentToRemove || !selectedRequester?.id) return;

    const trimmed = removalReason.trim();
    if (trimmed.length === 0) {
      setRemovalReasonError("Removal reason is required.");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 255) {
      setRemovalReasonError("Removal reason must be between 3 and 255 characters.");
      return;
    }

    setIsRemoving(true);
    try {
      const res = await fetch(
        `/api/v1/attachments/${attachmentToRemove.id}?requesterId=${selectedRequester.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removalReason: trimmed }),
        }
      );

      const resData = await res.json();
      if (!res.ok) {
        setRemovalReasonError(resData.error?.message || "Failed to remove attachment.");
      } else {
        setRemoveSuccess("Attachment removed successfully.");
        closeRemoveModal();
        await fetchTicket();
      }
    } catch (err) {
      console.error("Remove attachment error:", err);
      setRemovalReasonError("Unable to remove the attachment. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };


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
            <div>
              <h2 className="h6 fw-bold text-dark mb-0 d-inline me-2">
                Attachments
              </h2>
              <span className="text-secondary small">
                ({activeAttachmentsCount}/5 active)
              </span>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleAddAttachment}
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() => fileInputRef.current?.click()}
                disabled={isMaxAttachmentsReached || isUploading}
                style={{
                  borderColor: isMaxAttachmentsReached ? "#cbd5e1" : "#006B3C",
                  color: isMaxAttachmentsReached ? "#94a3b8" : "#006B3C",
                  fontWeight: "600",
                }}
              >
                {isUploading ? "Uploading..." : "+ Add Attachment"}
              </button>
            </div>
          </div>

          {isMaxAttachmentsReached && (
            <div className="small mb-3" style={{ color: "#b45309" }}>
              This ticket already has the maximum number of active attachments.
            </div>
          )}

          {uploadError && (
            <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success py-2 px-3 small mb-3" role="alert">
              {uploadSuccess}
            </div>
          )}

          {removeSuccess && (
            <div className="alert alert-success py-2 px-3 small mb-3" role="alert">
              {removeSuccess}
            </div>
          )}

          {downloadError && (
            <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
              {downloadError}
            </div>
          )}

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
                          <div className="mt-2 pt-2 border-top" style={{ borderColor: "#D5DDD8" }}>
                            <span className="badge bg-secondary me-2">
                              Status: Removed
                            </span>
                            {attachment.removedAt && (
                              <span className="small text-secondary me-2">
                                Removed: {formatDate(attachment.removedAt)}
                              </span>
                            )}
                            {attachment.removalReason && (
                              <div className="small text-secondary mt-1 fst-italic">
                                Reason: {attachment.removalReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons (Available only for active attachments) */}
                      {!isRemoved && (
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleDownload(attachment)}
                            style={{
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => openRemoveModal(attachment)}
                            style={{
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Remove Attachment Confirmation Dialog Modal */}
        {attachmentToRemove && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-modal-title"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1050,
              padding: "16px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                maxWidth: "480px",
                width: "100%",
                padding: "24px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
              }}
            >
              <h3
                id="remove-modal-title"
                style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "8px" }}
              >
                Remove attachment?
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>
                The attachment will no longer be available for download. Its metadata will remain in the ticket history.
              </p>

              <form onSubmit={handleConfirmRemove}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                      Removal reason <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {removalReason.trim().length} / 255
                    </span>
                  </div>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Uploaded the wrong screenshot."
                    value={removalReason}
                    onChange={(e) => {
                      setRemovalReason(e.target.value);
                      if (removalReasonError) setRemovalReasonError(null);
                    }}
                    style={{
                      borderColor: removalReasonError ? "#dc2626" : "#cbd5e1",
                    }}
                  />
                  {removalReasonError && (
                    <div style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
                      {removalReasonError}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={closeRemoveModal}
                    disabled={isRemoving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-danger"
                    disabled={isRemoving}
                  >
                    {isRemoving ? "Removing..." : "Remove Attachment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}