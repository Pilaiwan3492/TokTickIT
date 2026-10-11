import React, { useState, useEffect, useMemo } from "react";
import {
  ActionTaken,
  CreateActionTakenPayload,
  UpdateActionTakenPayload,
} from "../../types/ticket";
import { AuthUser } from "../../types/auth";
import {
  getActionsTaken,
  createActionTaken,
  updateActionTaken,
} from "../../api/actionsTaken.api";
import { ActionTakenModal } from "./ActionTakenModal";

export interface ActionsTakenListProps {
  ticketId: string;
  ticketStatus: string;
  ticketUpdatedAt: string;
  actions: ActionTaken[];
  currentUser: AuthUser | null;
  readOnly?: boolean;
  onActionsChange?: (
    updatedActions: ActionTaken[],
    newTicketUpdatedAt?: string
  ) => void;
  onCreateAction?: (
    payload: CreateActionTakenPayload
  ) => Promise<{ action: ActionTaken; ticketUpdatedAt?: string } | ActionTaken | void>;
  onUpdateAction?: (
    actionId: string,
    payload: UpdateActionTakenPayload
  ) => Promise<{ action: ActionTaken; ticketUpdatedAt?: string } | ActionTaken | void>;
  onRefreshTicket?: () => Promise<void> | void;
}

export const ActionsTakenList: React.FC<ActionsTakenListProps> = ({
  ticketId,
  ticketStatus,
  ticketUpdatedAt,
  actions,
  currentUser,
  readOnly = false,
  onActionsChange,
  onCreateAction,
  onUpdateAction,
  onRefreshTicket,
}) => {
  const [localActions, setLocalActions] = useState<ActionTaken[]>(actions || []);
  const [localTicketUpdatedAt, setLocalTicketUpdatedAt] =
    useState<string>(ticketUpdatedAt);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  useEffect(() => {
    const nextActions = actions || [];
    setLocalActions(nextActions);
    setEditingAction((prev) => {
      if (!prev) return null;
      const refreshed = nextActions.find((item) => item.id === prev.id);
      return refreshed || prev;
    });
  }, [actions]);

  useEffect(() => {
    setLocalTicketUpdatedAt(ticketUpdatedAt);
  }, [ticketUpdatedAt]);

  // Role & state evaluation
  const isStaffOrAdmin =
    !readOnly &&
    Boolean(
      currentUser &&
        (currentUser.role === "IT_STAFF" || currentUser.role === "ADMIN")
    );

  const normalizedStatus = (ticketStatus || "").toUpperCase();
  const isTerminalTicket =
    normalizedStatus === "CLOSED" || normalizedStatus === "CANCELLED";

  const isActorInactive = Boolean(
    currentUser && currentUser.isActive === false
  );

  const isActionModificationDisabled = isTerminalTicket || isActorInactive;

  // Chronological sorting: oldest to newest (actionDate ASC) per BR-02, UI-05
  const sortedActions = useMemo(() => {
    return [...localActions].sort((a, b) => {
      const timeA = new Date(a.actionDate).getTime();
      const timeB = new Date(b.actionDate).getTime();
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
      return timeA - timeB;
    });
  }, [localActions]);

  const formatActionDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenCreateModal = () => {
    if (isActionModificationDisabled) return;
    setEditingAction(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (action: ActionTaken) => {
    if (isActionModificationDisabled) return;
    setEditingAction(action);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
  };

  const handleCreateSubmit = async (payload: CreateActionTakenPayload) => {
    if (onCreateAction) {
      const res = await onCreateAction(payload);
      if (res && typeof res === "object") {
        const created = "action" in res ? res.action : (res as ActionTaken);
        const newUpdatedAt =
          "ticketUpdatedAt" in res ? res.ticketUpdatedAt : undefined;
        if (created && created.id) {
          const next = [...localActions, created];
          setLocalActions(next);
          if (newUpdatedAt) setLocalTicketUpdatedAt(newUpdatedAt);
          onActionsChange?.(next, newUpdatedAt);
        }
      }
      return;
    }

    const { action: created, ticketUpdatedAt: newUpdatedAt } =
      await createActionTaken(ticketId, payload);
    const next = [...localActions, created];
    setLocalActions(next);
    if (newUpdatedAt) {
      setLocalTicketUpdatedAt(newUpdatedAt);
    }
    onActionsChange?.(next, newUpdatedAt);
  };

  const handleEditSubmit = async (
    actionId: string,
    payload: UpdateActionTakenPayload
  ) => {
    if (onUpdateAction) {
      const res = await onUpdateAction(actionId, payload);
      if (res && typeof res === "object") {
        const updated = "action" in res ? res.action : (res as ActionTaken);
        const newUpdatedAt =
          "ticketUpdatedAt" in res ? res.ticketUpdatedAt : undefined;
        if (updated && updated.id) {
          const next = localActions.map((item) =>
            item.id === actionId ? updated : item
          );
          setLocalActions(next);
          if (newUpdatedAt) setLocalTicketUpdatedAt(newUpdatedAt);
          onActionsChange?.(next, newUpdatedAt);
        }
      }
      return;
    }

    const { action: updated, ticketUpdatedAt: newUpdatedAt } =
      await updateActionTaken(ticketId, actionId, payload);
    const next = localActions.map((item) =>
      item.id === actionId ? updated : item
    );
    setLocalActions(next);
    if (newUpdatedAt) {
      setLocalTicketUpdatedAt(newUpdatedAt);
    }
    onActionsChange?.(next, newUpdatedAt);
  };

  const disabledReasonTooltip = isActorInactive
    ? "Your account is inactive. Inactive accounts cannot record or edit Actions Taken."
    : isTerminalTicket
    ? `Ticket is ${normalizedStatus.toLowerCase()}. Actions Taken are locked.`
    : undefined;

  return (
    <section
      id="actions-taken"
      data-testid="actions-taken-section"
      aria-labelledby="actions-taken-heading"
      className="card shadow-sm border-0 mb-4 p-4"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #D5DDD8",
        borderRadius: "10px",
      }}
    >
      {/* Section Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <h2
            id="actions-taken-heading"
            className="h6 fw-bold mb-0"
            style={{ color: "#24272A" }}
          >
            Actions Taken
          </h2>
          <span
            className="badge rounded-pill fw-semibold"
            style={{
              backgroundColor: "#EAF6EF",
              color: "#006B3C",
              fontSize: "12px",
            }}
          >
            {sortedActions.length}
          </span>
        </div>

        {/* + Add Action Taken Button — strictly visible only for IT_STAFF and ADMIN (UI-01, UI-06) */}
        {isStaffOrAdmin && (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              title={disabledReasonTooltip}
              data-testid="add-action-tooltip-wrapper"
              className="d-inline-block"
            >
              <button
                type="button"
                data-testid="add-action-taken-btn"
                className="btn btn-sm text-white fw-semibold d-inline-flex align-items-center gap-1 px-3"
                disabled={isActionModificationDisabled}
                aria-disabled={isActionModificationDisabled}
                title={disabledReasonTooltip}
                onClick={handleOpenCreateModal}
                style={{
                  backgroundColor: isActionModificationDisabled
                    ? "#94A3B8"
                    : "#006B3C",
                  borderColor: isActionModificationDisabled
                    ? "#94A3B8"
                    : "#006B3C",
                  minHeight: 44,
                  outlineOffset: "2px",
                }}
              >
                <span>+ Add Action Taken</span>
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Inactive Actor Safety Notice (UI-01b, UI-01c, FR-05, BR-04) */}
      {isStaffOrAdmin && isActorInactive && (
        <div
          role="status"
          data-testid="inactive-actor-notice"
          className="rounded-3 py-2 px-3 mb-3 small d-flex align-items-center gap-2"
          style={{
            backgroundColor: "#FEE4E2",
            color: "#B42318",
            border: "1px solid #FDA29B",
          }}
        >
          <span className="fw-semibold">
            Inactive account: Actions Taken creation and editing are disabled for inactive staff accounts.
          </span>
        </div>
      )}

      {/* Terminal Ticket Lock Notice (UI-08, BR-12, AC-07) */}
      {isStaffOrAdmin && isTerminalTicket && (
        <div
          role="status"
          data-testid="terminal-ticket-lock-notice"
          className="rounded-3 py-2 px-3 mb-3 small d-flex align-items-center gap-2"
          style={{
            backgroundColor: "#F0F4F2",
            color: "#5F6863",
            border: "1px solid #D5DDD8",
          }}
        >
          <span className="fw-semibold">
            Ticket is closed or cancelled ({normalizedStatus}) — Actions Taken are locked and read-only.
          </span>
        </div>
      )}

      {/* Empty State (ui-spec.md Section 4.2) */}
      {sortedActions.length === 0 ? (
        <div
          data-testid="actions-taken-empty"
          className="p-4 rounded-3 text-center small"
          style={{
            backgroundColor: "#F0F4F2",
            border: "1px solid #D5DDD8",
            color: "#5F6863",
          }}
        >
          {isStaffOrAdmin
            ? "No actions recorded yet. Click 'Add Action Taken' to log work done on this ticket."
            : "No actions have been logged for this ticket yet."}
        </div>
      ) : (
        /* Chronological Actions Taken Table / Responsive List */
        <div className="table-responsive">
          <table
            className="table align-middle mb-0"
            style={{ borderColor: "#D5DDD8" }}
          >
            <thead style={{ backgroundColor: "#F5F7F6" }}>
              <tr>
                <th
                  scope="col"
                  className="small fw-semibold text-uppercase"
                  style={{ color: "#5F6863", fontSize: 12, minWidth: 140 }}
                >
                  Date / Time
                </th>
                <th
                  scope="col"
                  className="small fw-semibold text-uppercase"
                  style={{ color: "#5F6863", fontSize: 12, minWidth: 200 }}
                >
                  Action Description
                </th>
                <th
                  scope="col"
                  className="small fw-semibold text-uppercase"
                  style={{ color: "#5F6863", fontSize: 12, minWidth: 180 }}
                >
                  Result
                </th>
                <th
                  scope="col"
                  className="small fw-semibold text-uppercase"
                  style={{ color: "#5F6863", fontSize: 12, minWidth: 150 }}
                >
                  Performed By
                </th>
                <th
                  scope="col"
                  className="small fw-semibold text-uppercase"
                  style={{ color: "#5F6863", fontSize: 12, minWidth: 180 }}
                >
                  Follow-Up
                </th>
                <th
                  scope="col"
                  className="small fw-semibold text-uppercase"
                  style={{ color: "#5F6863", fontSize: 12, minWidth: 140 }}
                >
                  Attachment Notes
                </th>
                {isStaffOrAdmin && (
                  <th
                    scope="col"
                    className="small fw-semibold text-uppercase text-end"
                    style={{ color: "#5F6863", fontSize: 12, minWidth: 90 }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedActions.map((action) => {
                const performerName =
                  action.performedBy?.name || "IT Staff";
                const performerRole =
                  action.performedBy?.role === "ADMIN"
                    ? "Admin"
                    : "IT Staff";

                return (
                  <tr
                    key={action.id}
                    data-testid={`action-taken-row-${action.id}`}
                  >
                    {/* 1. Action Date / Time */}
                    <td
                      className="small fw-medium"
                      style={{ color: "#24272A", whiteSpace: "nowrap" }}
                    >
                      {formatActionDate(action.actionDate)}
                    </td>

                    {/* 2. Action Description */}
                    <td
                      className="small text-break"
                      style={{
                        color: "#24272A",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {action.actionDescription}
                    </td>

                    {/* 3. Result */}
                    <td
                      className="small text-break"
                      style={{
                        color: "#24272A",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {action.result}
                    </td>

                    {/* 4. Performed By (Contributor Badge) */}
                    <td>
                      <div className="d-flex flex-column align-items-start gap-1">
                        <span
                          className="small fw-semibold"
                          style={{ color: "#24272A" }}
                        >
                          {performerName}
                        </span>
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: "#EAF6EF",
                            color: "#006B3C",
                            border: "1px solid #A3D9B8",
                            fontSize: "11px",
                          }}
                        >
                          {performerRole}
                        </span>
                      </div>
                    </td>

                    {/* 5. Follow-Up Flag & Note (UI-05, VIS-02) */}
                    <td
                      className="small text-break"
                      style={{ wordBreak: "break-word" }}
                    >
                      {action.followUpRequired ? (
                        <div className="d-flex flex-column align-items-start gap-1">
                          <span
                            data-testid={`followup-badge-${action.id}`}
                            className="badge rounded-pill fw-semibold"
                            style={{
                              backgroundColor: "#FEF3C7",
                              color: "#D97706",
                              border: "1px solid #FDE68A",
                              fontSize: "11px",
                            }}
                          >
                            Follow-up Required
                          </span>
                          {action.followUpNote && (
                            <span
                              className="small"
                              style={{ color: "#B45309", whiteSpace: "pre-wrap" }}
                            >
                              {action.followUpNote}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="small" style={{ color: "#5F6863" }}>
                          {action.followUpNote ? action.followUpNote : "None"}
                        </span>
                      )}
                    </td>

                    {/* 6. Attachment Notes */}
                    <td
                      className="small text-break"
                      style={{ color: "#5F6863", wordBreak: "break-word" }}
                    >
                      {action.attachmentNotes || "-"}
                    </td>

                    {/* 7. Edit Action Button (Staff/Admin only — UI-01c, UI-06, UI-07, UI-08) */}
                    {isStaffOrAdmin && (
                      <td className="text-end">
                        <span
                          title={disabledReasonTooltip}
                          className="d-inline-block"
                        >
                          <button
                            type="button"
                            data-testid={`edit-action-btn-${action.id}`}
                            aria-label={`Edit action ${action.actionDescription}`}
                            className="btn btn-sm btn-outline-secondary fw-medium"
                            disabled={isActionModificationDisabled}
                            aria-disabled={isActionModificationDisabled}
                            title={disabledReasonTooltip}
                            onClick={() => handleOpenEditModal(action)}
                            style={{
                              minHeight: 38,
                              borderColor: "#D5DDD8",
                              color: isActionModificationDisabled
                                ? "#94A3B8"
                                : "#006B3C",
                              outlineOffset: "2px",
                            }}
                          >
                            Edit
                          </button>
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Action Taken Modal */}
      {isStaffOrAdmin && (
        <ActionTakenModal
          isOpen={isModalOpen}
          mode={modalMode}
          ticketId={ticketId}
          ticketUpdatedAt={localTicketUpdatedAt}
          currentUser={currentUser}
          initialAction={editingAction}
          onClose={handleCloseModal}
          onSubmitCreate={handleCreateSubmit}
          onSubmitEdit={handleEditSubmit}
          onRefreshTicket={async () => {
            if (onRefreshTicket) {
              await onRefreshTicket();
            }
            try {
              const latestActions = await getActionsTaken(ticketId);
              if (Array.isArray(latestActions) && latestActions.length > 0) {
                setLocalActions(latestActions);
                setEditingAction((prev) => {
                  if (!prev) return null;
                  const match = latestActions.find((item) => item.id === prev.id);
                  return match || prev;
                });
                onActionsChange?.(latestActions);
              }
            } catch {
              // Ignore if parent refresh already handled ticket reload
            }
          }}
        />
      )}
    </section>
  );
};

export default ActionsTakenList;
