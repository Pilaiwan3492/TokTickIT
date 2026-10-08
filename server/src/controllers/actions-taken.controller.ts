import { Response } from "express";
import { getPrisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import { validateFollowUpNote, isConcurrencyStale } from "../utils/actionValidation.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/tickets/:id/actions-taken
 * Retrieve all Actions Taken for a ticket, chronologically sorted by actionDate ASC.
 * - Requester: Allowed only if requester owns the ticket (returns 403 FORBIDDEN if not owned).
 * - IT Staff / Admin: Allowed for all tickets.
 */
export const getActionsTakenHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Lookup ticket with requester details to verify ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, email: true, userId: true },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Role-based authorization & ownership check for Requesters
    if (req.user?.role === "REQUESTER") {
      const isOwner =
        ticket.userId === req.user.id ||
        (ticket.requester && ticket.requester.userId === req.user.id) ||
        (ticket.requester && ticket.requester.email.toLowerCase() === req.user.email.toLowerCase());

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to view Actions Taken for this ticket.",
          },
        });
      }
    }

    // Query Actions Taken ordered chronologically by actionDate ASC (BR-06)
    const actionsTaken = await prisma.actionTaken.findMany({
      where: { ticketId: id },
      orderBy: { actionDate: "asc" },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNo,
        actionsTaken,
      },
    });
  } catch (error) {
    console.error("Error in getActionsTakenHandler:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while retrieving Actions Taken.",
      },
    });
  }
};

/**
 * POST /api/v1/tickets/:id/actions-taken
 * Record a new operational Action Taken under a ticket.
 * - Allowed Roles: IT_STAFF, ADMIN (Requester rejected with 403 FORBIDDEN).
 * - Automatic performedBy binding: Authed user ID is used; client cannot supply arbitrary actor.
 * - Enforces active actor check, followUpNote validation, closed/cancelled ticket lock,
 *   mandatory expectedTicketUpdatedAt, and atomic compare-and-swap optimistic concurrency.
 */
export const createActionTakenHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    // 1. Role check: Only IT_STAFF and ADMIN are allowed (FR-06, BR-07, API-03)
    if (!req.user || (req.user.role !== "IT_STAFF" && req.user.role !== "ADMIN")) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only IT Staff and Administrators are permitted to create Actions Taken.",
        },
      });
    }

    // 2. Inactive actor check (FR-05, BR-04, API-08)
    if (!req.user || !req.user.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INACTIVE_ACTOR_REJECTED",
          message: "The authenticated user performing this operation is marked inactive.",
        },
      });
    }

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const {
      actionDate,
      actionDescription,
      result,
      followUpRequired,
      followUpNote,
      attachmentNotes,
      expectedTicketUpdatedAt,
    } = req.body || {};

    // 3. Mandatory expectedTicketUpdatedAt validation (BR-17, api-spec.md)
    if (
      !expectedTicketUpdatedAt ||
      typeof expectedTicketUpdatedAt !== "string" ||
      isNaN(new Date(expectedTicketUpdatedAt).getTime())
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "expectedTicketUpdatedAt is required as a valid ISO timestamp.",
        },
      });
    }

    // 4. Payload validation
    if (!actionDescription || typeof actionDescription !== "string" || actionDescription.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Action description is required.",
        },
      });
    }

    if (!result || typeof result !== "string" || result.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Result is required.",
        },
      });
    }

    const isFollowUpReq = Boolean(followUpRequired);
    const followUpValidation = validateFollowUpNote(isFollowUpReq, followUpNote);
    if (!followUpValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: followUpValidation.errorCode,
          message: followUpValidation.errorMessage,
        },
      });
    }

    let parsedActionDate = new Date();
    if (actionDate) {
      const parsed = new Date(actionDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid actionDate format.",
          },
        });
      }
      parsedActionDate = parsed;
    }

    // 5. Atomic transaction with row-level lock (Compare-and-Swap / concurrency guard)
    const txResult = await prisma.$transaction(async (tx) => {
      // Row-lock Ticket to ensure atomic serialized evaluation
      const tickets = await tx.$queryRaw<Array<{
        id: string;
        status: string;
        updatedAt: Date;
      }>>`SELECT id, status, "updatedAt" FROM "Ticket" WHERE id = ${id} FOR UPDATE`;

      if (!tickets || tickets.length === 0) {
        return {
          status: 404,
          body: {
            success: false,
            error: {
              code: "TICKET_NOT_FOUND",
              message: "Ticket not found.",
            },
          },
        };
      }

      const ticket = tickets[0];

      // Closed or cancelled guard (FR-07, BR-12, API-06)
      if (ticket.status === "CLOSED" || ticket.status === "CANCELLED") {
        return {
          status: 400,
          body: {
            success: false,
            error: {
              code: "TICKET_LOCKED",
              message: "Actions Taken cannot be added to a closed or cancelled ticket.",
            },
          },
        };
      }

      // Optimistic concurrency check under row lock
      if (isConcurrencyStale(expectedTicketUpdatedAt, ticket.updatedAt)) {
        return {
          status: 409,
          body: {
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Ticket was modified by another user concurrently. Please refresh and try again.",
            },
          },
        };
      }

      // Create ActionTaken record
      const createdAction = await tx.actionTaken.create({
        data: {
          ticketId: id,
          actionDate: parsedActionDate,
          actionDescription: actionDescription.trim(),
          result: result.trim(),
          performedById: req.user!.id, // Authoritative binding to authenticated actor (BR-03)
          followUpRequired: isFollowUpReq,
          followUpNote: isFollowUpReq ? followUpNote?.trim() : (followUpNote ? followUpNote.trim() : null),
          attachmentNotes: attachmentNotes ? String(attachmentNotes).trim() : null,
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Update parent ticket updatedAt to advance concurrency timestamp
      await tx.ticket.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return {
        status: 201,
        body: {
          success: true,
          data: createdAction,
          message: "Action Taken successfully recorded",
        },
      };
    });

    return res.status(txResult.status).json(txResult.body);
  } catch (error) {
    console.error("Error in createActionTakenHandler:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while creating Action Taken.",
      },
    });
  }
};

/**
 * PATCH /api/v1/tickets/:id/actions-taken/:actionId
 * Modify details of an existing Action Taken record.
 * - Allowed Roles: IT_STAFF, ADMIN (Requester rejected with 403 FORBIDDEN).
 * - Performer Immutability: original performedById is preserved and cannot be altered.
 * - Enforces active actor check, followUpNote validation, closed/cancelled ticket lock,
 *   mandatory expectedUpdatedAt, and atomic optimistic concurrency.
 */
export const updateActionTakenHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id, actionId } = req.params;

    // 1. Role check: Only IT_STAFF and ADMIN are allowed (FR-06, BR-07, API-04)
    if (!req.user || (req.user.role !== "IT_STAFF" && req.user.role !== "ADMIN")) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only IT Staff and Administrators are permitted to modify Actions Taken.",
        },
      });
    }

    // 2. Inactive actor check (FR-05, BR-04, API-08b)
    if (!req.user || !req.user.isActive) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INACTIVE_ACTOR_REJECTED",
          message: "The authenticated user performing this operation is marked inactive.",
        },
      });
    }

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const {
      actionDate,
      actionDescription,
      result,
      followUpRequired,
      followUpNote,
      attachmentNotes,
      expectedUpdatedAt,
    } = req.body || {};

    // 3. Mandatory expectedUpdatedAt validation (BR-17, api-spec.md)
    if (
      !expectedUpdatedAt ||
      typeof expectedUpdatedAt !== "string" ||
      isNaN(new Date(expectedUpdatedAt).getTime())
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "expectedUpdatedAt is required as a valid ISO timestamp.",
        },
      });
    }

    // 4. Field validations
    if (actionDescription !== undefined && (typeof actionDescription !== "string" || actionDescription.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Action description cannot be empty.",
        },
      });
    }

    if (result !== undefined && (typeof result !== "string" || result.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Result cannot be empty.",
        },
      });
    }

    let parsedActionDate: Date | undefined;
    if (actionDate !== undefined) {
      const parsed = new Date(actionDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid actionDate format.",
          },
        });
      }
      parsedActionDate = parsed;
    }

    // 5. Atomic transaction with row-level locks
    const txResult = await prisma.$transaction(async (tx) => {
      // Row-lock ActionTaken record
      const actions = await tx.$queryRaw<Array<{
        id: string;
        ticketId: string;
        followUpRequired: boolean;
        followUpNote: string | null;
        updatedAt: Date;
      }>>`SELECT id, "ticketId", "followUpRequired", "followUpNote", "updatedAt" FROM "ActionTaken" WHERE id = ${actionId} AND "ticketId" = ${id} FOR UPDATE`;

      if (!actions || actions.length === 0) {
        return {
          status: 404,
          body: {
            success: false,
            error: {
              code: "ACTION_NOT_FOUND",
              message: "Action Taken record not found for this ticket.",
            },
          },
        };
      }
      const existingAction = actions[0];

      // Row-lock parent Ticket
      const tickets = await tx.$queryRaw<Array<{
        id: string;
        status: string;
      }>>`SELECT id, status FROM "Ticket" WHERE id = ${id} FOR UPDATE`;

      if (!tickets || tickets.length === 0) {
        return {
          status: 404,
          body: {
            success: false,
            error: {
              code: "TICKET_NOT_FOUND",
              message: "Ticket not found.",
            },
          },
        };
      }
      const ticket = tickets[0];

      // Ticket lock guard
      if (ticket.status === "CLOSED" || ticket.status === "CANCELLED") {
        return {
          status: 400,
          body: {
            success: false,
            error: {
              code: "TICKET_LOCKED",
              message: "Actions Taken cannot be modified on a closed or cancelled ticket.",
            },
          },
        };
      }

      // Optimistic concurrency check under row lock
      if (isConcurrencyStale(expectedUpdatedAt, existingAction.updatedAt)) {
        return {
          status: 409,
          body: {
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Action Taken record was modified since expectedUpdatedAt. Please refresh.",
            },
          },
        };
      }

      const effectiveFollowUpRequired =
        followUpRequired !== undefined ? Boolean(followUpRequired) : existingAction.followUpRequired;

      let effectiveFollowUpNote: string | null | undefined;
      if (followUpNote !== undefined) {
        effectiveFollowUpNote = followUpNote;
      } else {
        effectiveFollowUpNote = existingAction.followUpNote;
      }

      const followUpValidation = validateFollowUpNote(effectiveFollowUpRequired, effectiveFollowUpNote);
      if (!followUpValidation.isValid) {
        return {
          status: 400,
          body: {
            success: false,
            error: {
              code: followUpValidation.errorCode,
              message: followUpValidation.errorMessage,
            },
          },
        };
      }

      // Update ActionTaken record
      const updatedAction = await tx.actionTaken.update({
        where: { id: actionId },
        data: {
          actionDate: parsedActionDate,
          actionDescription: actionDescription !== undefined ? actionDescription.trim() : undefined,
          result: result !== undefined ? result.trim() : undefined,
          followUpRequired: effectiveFollowUpRequired,
          followUpNote: effectiveFollowUpRequired
            ? (effectiveFollowUpNote ? effectiveFollowUpNote.trim() : null)
            : (followUpNote !== undefined ? followUpNote : null),
          attachmentNotes: attachmentNotes !== undefined ? (attachmentNotes ? String(attachmentNotes).trim() : null) : undefined,
          // performedById remains strictly unchanged (BR-03 Immutability Invariant)
        },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Advance parent ticket updatedAt
      await tx.ticket.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return {
        status: 200,
        body: {
          success: true,
          data: updatedAction,
          message: "Action Taken successfully updated",
        },
      };
    });

    return res.status(txResult.status).json(txResult.body);
  } catch (error) {
    console.error("Error in updateActionTakenHandler:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while updating Action Taken.",
      },
    });
  }
};
