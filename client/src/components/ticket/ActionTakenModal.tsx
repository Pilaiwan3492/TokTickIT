import React, { useState, useEffect, useRef } from "react";
import {
  ActionTaken,
  CreateActionTakenPayload,
  UpdateActionTakenPayload,
} from "../../types/ticket";
import { AuthUser } from "../../types/auth";

export interface RefreshResult {
  action?: ActionTaken;
  ticketUpdatedAt?: string;
}

export interface ActionTakenModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  ticketId: string;
  ticketUpdatedAt: string;
  currentUser: AuthUser | null;
  initialAction?: ActionTaken | null;
  onClose: () => void;
  onSubmitCreate?: (payload: CreateActionTakenPayload) => Promise<void>;
  onSubmitEdit?: (
    actionId: string,
    payload: UpdateActionTakenPayload
  ) => Promise<void>;
  onRefreshTicket?: () =>
    | Promise<RefreshResult | ActionTaken | void>
    | RefreshResult
    | ActionTaken
    | void;
}

const formatForDateTimeLocal = (isoStr?: string): string => {
  const d = isoStr ? new Date(isoStr) : new Date();
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const ActionTakenModal: React.FC<ActionTakenModalProps> = ({
  isOpen,
  mode,
  ticketUpdatedAt,
  currentUser,
  initialAction,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
  onRefreshTicket,
}) => {
  const [actionDate, setActionDate] = useState<string>(() =>
    formatForDateTimeLocal(initialAction?.actionDate)
  );
  const [actionDescription, setActionDescription] = useState<string>(
    initialAction?.actionDescription || ""
  );
  const [result, setResult] = useState<string>(initialAction?.result || "");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(
    Boolean(initialAction?.followUpRequired)
  );
  const [followUpNote, setFollowUpNote] = useState<string>(
    initialAction?.followUpNote || ""
  );
  const [attachmentNotes, setAttachmentNotes] = useState<string>(
    initialAction?.attachmentNotes || ""
  );
  const [latestActionUpdatedAt, setLatestActionUpdatedAt] = useState<string | undefined>(
    initialAction?.updatedAt
  );
  const [latestTicketUpdatedAt, setLatestTicketUpdatedAt] = useState<string | undefined>(
    ticketUpdatedAt
  );

  // Validation & Error states
  const [fieldErrors, setFieldErrors] = useState<{
    actionDate?: string;
    actionDescription?: string;
    result?: string;
    followUpNote?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isConflictError, setIsConflictError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshingConflict, setIsRefreshingConflict] = useState<boolean>(false);

  // Synchronous ref lock to guarantee strict single-dispatch on rapid double-clicks (UI-26, BR-19)
  const isSubmittingRef = useRef<boolean>(false);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Synchronize expectedUpdatedAt when parent refreshes initialAction after a 409 conflict
  // without overwriting any user-edited form fields (BR-17, BR-18, UI-03, UI-13)
  useEffect(() => {
    if (initialAction?.updatedAt) {
      setLatestActionUpdatedAt(initialAction.updatedAt);
    }
  }, [initialAction?.updatedAt]);

  useEffect(() => {
    if (ticketUpdatedAt) {
      setLatestTicketUpdatedAt(ticketUpdatedAt);
    }
  }, [ticketUpdatedAt]);

  // Capture trigger element on open and restore focus when modal closes
  useEffect(() => {
    if (isOpen) {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        triggerElementRef.current = document.activeElement;
      }
    } else if (triggerElementRef.current) {
      const target = triggerElementRef.current;
      triggerElementRef.current = null;
      if (typeof target.focus === "function") {
        target.focus();
      }
    }
  }, [isOpen]);

  // Reset form state ONLY when modal opens or switches target record
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialAction) {
        setActionDate(formatForDateTimeLocal(initialAction.actionDate));
        setActionDescription(initialAction.actionDescription || "");
        setResult(initialAction.result || "");
        setFollowUpRequired(Boolean(initialAction.followUpRequired));
        setFollowUpNote(initialAction.followUpNote || "");
        setAttachmentNotes(initialAction.attachmentNotes || "");
        setLatestActionUpdatedAt(initialAction.updatedAt);
        setLatestTicketUpdatedAt(ticketUpdatedAt);
      } else {
        setActionDate(formatForDateTimeLocal());
        setActionDescription("");
        setResult("");
        setFollowUpRequired(false);
        setFollowUpNote("");
        setAttachmentNotes("");
        setLatestActionUpdatedAt(undefined);
        setLatestTicketUpdatedAt(ticketUpdatedAt);
      }
      setFieldErrors({});
      setSubmitError(null);
      setIsConflictError(false);
      setIsSubmitting(false);
      setIsRefreshingConflict(false);
      isSubmittingRef.current = false;

      // Focus primary input on open
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen, mode, initialAction?.id]);

  // Keyboard accessibility: Escape dismissal and Tab / Shift+Tab focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmittingRef.current) {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalContentRef.current) {
        const focusableSelector =
          'button:not([disabled]), [href], input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), [tabindex]:not([tabindex="-1"]):not([disabled])';
        const focusableElements = Array.from(
          modalContentRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        );
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (activeEl === firstEl || !modalContentRef.current.contains(activeEl)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (activeEl === lastEl || !modalContentRef.current.contains(activeEl)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRefreshConflict = async () => {
    if (!onRefreshTicket || isRefreshingConflict) return;
    try {
      setIsRefreshingConflict(true);
      const refreshResult = await onRefreshTicket();

      let refreshedAction: ActionTaken | undefined = undefined;
      let refreshedTicketUpdatedAt: string | undefined = undefined;

      if (refreshResult && typeof refreshResult === "object") {
        if ("updatedAt" in refreshResult && typeof (refreshResult as ActionTaken).id === "string") {
          refreshedAction = refreshResult as ActionTaken;
          refreshedTicketUpdatedAt =
            (refreshResult as any).ticketUpdatedAt || (refreshResult as ActionTaken).updatedAt;
        } else {
          refreshedAction = (refreshResult as any).action;
          refreshedTicketUpdatedAt = (refreshResult as any).ticketUpdatedAt;
        }
      } else if (typeof refreshResult === "string") {
        refreshedTicketUpdatedAt = refreshResult;
      }

      if (mode === "edit") {
        if (
          !refreshedAction ||
          refreshedAction.id !== initialAction?.id ||
          !refreshedAction.updatedAt
        ) {
          throw new Error(
            "Unable to verify the latest Action Taken version after refresh. Please close and reopen the editor."
          );
        }
        setLatestActionUpdatedAt(refreshedAction.updatedAt);
        if (refreshedTicketUpdatedAt) {
          setLatestTicketUpdatedAt(refreshedTicketUpdatedAt);
        }
      } else {
        const freshUpdatedAt =
          refreshedTicketUpdatedAt || ticketUpdatedAt || latestTicketUpdatedAt;
        if (!freshUpdatedAt) {
          throw new Error(
            "Unable to verify the latest ticket version after refresh. Please reload the ticket."
          );
        }
        setLatestTicketUpdatedAt(freshUpdatedAt);
      }

      setIsConflictError(false);
      setSubmitError(null);
    } catch (err: any) {
      setIsConflictError(true);
      if (mode === "edit") {
        setLatestActionUpdatedAt(undefined);
      } else {
        setLatestTicketUpdatedAt(undefined);
      }
      setSubmitError(
        err?.message || "Refresh failed. Please try again before saving."
      );
    } finally {
      setIsRefreshingConflict(false);
    }
  };

  // Determine immutable Performer display (BR-03, UI-04)
  const performerName =
    mode === "edit" && initialAction?.performedBy?.name
      ? initialAction.performedBy.name
      : currentUser?.name || "IT Staff";

  const performerRoleRaw =
    mode === "edit" && initialAction?.performedBy?.role
      ? initialAction.performedBy.role
      : currentUser?.role || "IT_STAFF";

  const performerRoleLabel =
    performerRoleRaw === "ADMIN"
      ? "Admin"
      : performerRoleRaw === "IT_STAFF"
      ? "IT Staff"
      : performerRoleRaw;

  const validateForm = (): boolean => {
    const errors: {
      actionDate?: string;
      actionDescription?: string;
      result?: string;
      followUpNote?: string;
    } = {};

    if (!actionDate || Number.isNaN(new Date(actionDate).getTime())) {
      errors.actionDate = "Valid action date and time is required.";
    }

    if (!actionDescription || actionDescription.trim().length === 0) {
      errors.actionDescription = "Action description is required.";
    }

    if (!result || result.trim().length === 0) {
      errors.result = "Result is required.";
    }

    // Dynamic validation rule: Follow-up note required when followUpRequired is checked (BR-05, UI-02)
    if (followUpRequired && (!followUpNote || followUpNote.trim().length === 0)) {
      errors.followUpNote =
        "Follow-up note is required when follow-up is marked as required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission while request is in-flight (UI-26, BR-19, AC-25)
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }

    // Block saving if a concurrency conflict has not been resolved via Refresh Ticket
    if (
      isConflictError ||
      (mode === "edit" && !latestActionUpdatedAt) ||
      (mode === "create" && !latestTicketUpdatedAt)
    ) {
      setIsConflictError(true);
      setSubmitError(
        (prev) =>
          prev ||
          "Please refresh the ticket to load the latest version before saving."
      );
      return;
    }

    setSubmitError(null);
    setIsConflictError(false);

    if (!validateForm()) {
      // Preserve all entered form values on validation error (UI-03, BR-18)
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const isoActionDate = new Date(actionDate).toISOString();
      const trimmedDescription = actionDescription.trim();
      const trimmedResult = result.trim();
      const trimmedFollowUpNote = followUpRequired
        ? followUpNote.trim()
        : followUpNote.trim()
        ? followUpNote.trim()
        : null;
      const trimmedAttachmentNotes = attachmentNotes.trim()
        ? attachmentNotes.trim()
        : null;

      if (mode === "edit" && initialAction && onSubmitEdit) {
        await onSubmitEdit(initialAction.id, {
          actionDate: isoActionDate,
          actionDescription: trimmedDescription,
          result: trimmedResult,
          followUpRequired,
          followUpNote: trimmedFollowUpNote,
          attachmentNotes: trimmedAttachmentNotes,
          expectedUpdatedAt: latestActionUpdatedAt!,
        });
      } else if (onSubmitCreate) {
        await onSubmitCreate({
          actionDate: isoActionDate,
          actionDescription: trimmedDescription,
          result: trimmedResult,
          followUpRequired,
          followUpNote: trimmedFollowUpNote,
          attachmentNotes: trimmedAttachmentNotes,
          expectedTicketUpdatedAt: latestTicketUpdatedAt!,
        });
      }

      isSubmittingRef.current = false;
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      // Preserve form state on network or API error (UI-03, BR-18, AC-24)
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      const status = err?.status;
      const code = err?.code || err?.data?.error?.code;
      if (status === 409 || code === "STALE_UPDATE_CONFLICT") {
        setIsConflictError(true);
        if (mode === "edit") {
          setLatestActionUpdatedAt(undefined);
        } else {
          setLatestTicketUpdatedAt(undefined);
        }
        setSubmitError(
          err?.message ||
            "This record was modified by another user. Please refresh the ticket and try again."
        );
      } else {
        setSubmitError(
          err?.message ||
            "An error occurred while saving the Action Taken. Your input has been preserved."
        );
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-taken-modal-title"
      aria-describedby="action-taken-modal-desc"
      data-testid="action-taken-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(36, 39, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1055,
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        ref={modalContentRef}
        className="bg-white rounded-3 shadow p-3 p-sm-4"
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "92vh",
          overflowY: "auto",
          overflowX: "hidden",
          border: "1px solid #D5DDD8",
        }}
      >
        {/* Modal Header */}
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div style={{ minWidth: 0 }}>
            <h3
              id="action-taken-modal-title"
              className="h5 fw-bold mb-1 text-break"
              style={{ color: "#24272A" }}
            >
              {mode === "edit" ? "Edit Action Taken" : "Add Action Taken"}
            </h3>
            <p
              id="action-taken-modal-desc"
              className="small mb-0 text-break"
              style={{ color: "#5F6863" }}
            >
              Record diagnostic steps, technical work performed, and outcomes for this ticket.
            </p>
          </div>
          <button
            type="button"
            className="btn-close flex-shrink-0"
            aria-label="Close modal"
            disabled={isSubmitting}
            onClick={onClose}
            style={{ minWidth: 32, minHeight: 32 }}
          />
        </div>

        <hr style={{ borderColor: "#D5DDD8", margin: "16px 0" }} />

        {/* Submit / Concurrency Error Alert Banner (UI-03, UI-13) */}
        {submitError && (
          <div
            role="alert"
            data-testid="action-modal-error-banner"
            className="rounded-3 p-3 mb-3 small"
            style={{
              backgroundColor: "#FEE4E2",
              color: "#B42318",
              border: "1px solid #FDA29B",
            }}
          >
            <div className="fw-semibold mb-1">
              {isConflictError
                ? "Concurrency Conflict Detected (HTTP 409)"
                : "Unable to Save Action Taken"}
            </div>
            <div>{submitError}</div>
            {isConflictError && onRefreshTicket && (
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-sm fw-semibold"
                  disabled={isRefreshingConflict}
                  onClick={handleRefreshConflict}
                  style={{
                    backgroundColor: "#B42318",
                    color: "#FFFFFF",
                    minHeight: 38,
                  }}
                >
                  {isRefreshingConflict ? "Refreshing..." : "Refresh Ticket"}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Row 1: Action Date/Time & Performed By (Read-Only) */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label
                htmlFor="action-date-input"
                className="form-label small fw-semibold mb-1"
                style={{ color: "#24272A" }}
              >
                Action Date / Time <span style={{ color: "#B42318" }}>*</span>
              </label>
              <input
                id="action-date-input"
                type="datetime-local"
                className="form-control"
                value={actionDate}
                disabled={isSubmitting}
                onChange={(e) => {
                  setActionDate(e.target.value);
                  if (fieldErrors.actionDate) {
                    setFieldErrors((prev) => ({ ...prev, actionDate: undefined }));
                  }
                }}
                style={{
                  minHeight: 44,
                  maxWidth: "100%",
                  borderColor: fieldErrors.actionDate ? "#B42318" : "#D5DDD8",
                }}
              />
              {fieldErrors.actionDate && (
                <div
                  role="alert"
                  className="small mt-1"
                  style={{ color: "#B42318" }}
                >
                  {fieldErrors.actionDate}
                </div>
              )}
            </div>

            {/* Performed By (Read-Only Auto-Populated per BR-03, UI-04) */}
            <div className="col-12 col-md-6">
              <label
                htmlFor="action-performed-by-input"
                className="form-label small fw-semibold mb-1"
                style={{ color: "#24272A" }}
              >
                Performed By
              </label>
              <div
                className="d-flex align-items-center justify-content-between rounded-2 px-3"
                style={{
                  minHeight: 44,
                  maxWidth: "100%",
                  overflow: "hidden",
                  backgroundColor: "#F0F4F2",
                  border: "1px solid #D5DDD8",
                }}
              >
                <input
                  id="action-performed-by-input"
                  type="text"
                  readOnly
                  disabled
                  aria-readonly="true"
                  value={performerName}
                  className="border-0 bg-transparent fw-semibold p-0 flex-grow-1"
                  style={{
                    color: "#24272A",
                    fontSize: "14px",
                    outline: "none",
                    minWidth: 0,
                    width: "100%",
                  }}
                />
                <span
                  className="badge rounded-pill ms-2 flex-shrink-0"
                  style={{
                    backgroundColor: "#EAF6EF",
                    color: "#006B3C",
                    border: "1px solid #A3D9B8",
                    fontSize: "11px",
                  }}
                >
                  {performerRoleLabel}
                </span>
              </div>
              <div className="small mt-1" style={{ color: "#5F6863", fontSize: 12 }}>
                Automatically attributed to authenticated staff member
              </div>
            </div>
          </div>

          {/* Action Description */}
          <div className="mb-3">
            <label
              htmlFor="action-description-input"
              className="form-label small fw-semibold mb-1"
              style={{ color: "#24272A" }}
            >
              Action Description <span style={{ color: "#B42318" }}>*</span>
            </label>
            <textarea
              id="action-description-input"
              ref={descriptionInputRef}
              className="form-control"
              rows={3}
              placeholder="Describe the diagnostic steps or remediation work performed..."
              value={actionDescription}
              disabled={isSubmitting}
              onChange={(e) => {
                setActionDescription(e.target.value);
                if (fieldErrors.actionDescription) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    actionDescription: undefined,
                  }));
                }
              }}
              style={{
                borderColor: fieldErrors.actionDescription ? "#B42318" : "#D5DDD8",
              }}
            />
            {fieldErrors.actionDescription && (
              <div
                role="alert"
                data-testid="error-action-description"
                className="small mt-1"
                style={{ color: "#B42318" }}
              >
                {fieldErrors.actionDescription}
              </div>
            )}
          </div>

          {/* Result */}
          <div className="mb-3">
            <label
              htmlFor="action-result-input"
              className="form-label small fw-semibold mb-1"
              style={{ color: "#24272A" }}
            >
              Result <span style={{ color: "#B42318" }}>*</span>
            </label>
            <textarea
              id="action-result-input"
              className="form-control"
              rows={2}
              placeholder="Describe the outcome or verification result..."
              value={result}
              disabled={isSubmitting}
              onChange={(e) => {
                setResult(e.target.value);
                if (fieldErrors.result) {
                  setFieldErrors((prev) => ({ ...prev, result: undefined }));
                }
              }}
              style={{
                borderColor: fieldErrors.result ? "#B42318" : "#D5DDD8",
              }}
            />
            {fieldErrors.result && (
              <div
                role="alert"
                data-testid="error-action-result"
                className="small mt-1"
                style={{ color: "#B42318" }}
              >
                {fieldErrors.result}
              </div>
            )}
          </div>

          {/* Follow-Up Required Checkbox & Conditional Note (UI-02, BR-05) */}
          <div
            className="p-3 rounded-3 mb-3"
            style={{
              backgroundColor: followUpRequired ? "#FFFBEB" : "#F5F7F6",
              border: `1px solid ${followUpRequired ? "#FDE68A" : "#D5DDD8"}`,
            }}
          >
            <div className="form-check d-flex align-items-center gap-2 mb-0">
              <input
                id="action-followup-checkbox"
                type="checkbox"
                className="form-check-input mt-0"
                checked={followUpRequired}
                disabled={isSubmitting}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFollowUpRequired(checked);
                  if (!checked && fieldErrors.followUpNote) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      followUpNote: undefined,
                    }));
                  }
                }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <label
                htmlFor="action-followup-checkbox"
                className="form-check-label fw-semibold small"
                style={{ color: "#24272A", cursor: "pointer" }}
              >
                Follow-Up Required?
              </label>
            </div>

            {followUpRequired && (
              <div className="mt-3">
                <label
                  htmlFor="action-followup-note-input"
                  className="form-label small fw-semibold mb-1"
                  style={{ color: "#24272A" }}
                >
                  Follow-Up Note <span style={{ color: "#B42318" }}>*</span>
                </label>
                <div className="small mb-1" style={{ color: "#B45309", fontSize: 12 }}>
                  Please describe the required follow-up step
                </div>
                <textarea
                  id="action-followup-note-input"
                  className="form-control"
                  rows={2}
                  required={followUpRequired}
                  placeholder="Specify next steps, monitoring schedule, or pending vendor action..."
                  value={followUpNote}
                  disabled={isSubmitting}
                  onChange={(e) => {
                    setFollowUpNote(e.target.value);
                    if (fieldErrors.followUpNote) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        followUpNote: undefined,
                      }));
                    }
                  }}
                  style={{
                    borderColor: fieldErrors.followUpNote ? "#B42318" : "#D5DDD8",
                  }}
                />
                {fieldErrors.followUpNote && (
                  <div
                    role="alert"
                    data-testid="error-followup-note"
                    className="small mt-1 fw-medium"
                    style={{ color: "#B42318" }}
                  >
                    {fieldErrors.followUpNote}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachment Notes (Optional) */}
          <div className="mb-4">
            <label
              htmlFor="action-attachment-notes-input"
              className="form-label small fw-semibold mb-1"
              style={{ color: "#24272A" }}
            >
              Attachment Notes (Optional)
            </label>
            <input
              id="action-attachment-notes-input"
              type="text"
              className="form-control"
              placeholder="Reference physical equipment tags, external logs, or ticket attachments..."
              value={attachmentNotes}
              disabled={isSubmitting}
              onChange={(e) => setAttachmentNotes(e.target.value)}
              style={{
                minHeight: 44,
                borderColor: "#D5DDD8",
              }}
            />
          </div>

          {/* Footer Action Buttons */}
          <div
            className="d-flex flex-wrap justify-content-end gap-2 pt-2 border-top"
            style={{ borderColor: "#D5DDD8" }}
          >
            <button
              type="button"
              className="btn btn-outline-secondary fw-medium px-3"
              disabled={isSubmitting}
              onClick={onClose}
              style={{ minHeight: 44 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-action-taken-btn"
              className="btn text-white fw-semibold px-4 d-inline-flex align-items-center justify-content-center gap-2"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#006B3C",
                borderColor: "#006B3C",
                minHeight: 44,
                outlineOffset: "2px",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span>Saving...</span>
                </>
              ) : mode === "edit" ? (
                "Save Changes"
              ) : (
                "Save Action Taken"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionTakenModal;
