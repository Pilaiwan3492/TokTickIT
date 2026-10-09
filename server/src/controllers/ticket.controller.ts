import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import { getPrisma } from "../prisma.js";
import { generateTicketNumber } from "../utils/ticketNoGenerator.js";
import { isConcurrencyStale, isValidIsoDateTime } from "../utils/actionValidation.js";
import {
  isValidStatus,
  isValidTransition,
  isTerminalStatus,
  type TicketStatusType,
} from "../services/ticket-workflow.service.js";

export const createTicketHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    const fields: Record<string, string> = {};

    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (!requestedPriority || !validPriorities.includes(requestedPriority)) {
      fields.requestedPriority = "Requested priority must be LOW, MEDIUM, or HIGH.";
    }

    if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      fields.summary = "Summary must be between 5 and 150 characters.";
    }

    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      fields.description = "Description must be between 10 and 2,000 characters.";
    }

    const categoryIdNum = Number(categoryId);
    if (
      categoryId === undefined ||
      categoryId === null ||
      typeof categoryId === "boolean" ||
      !Number.isInteger(categoryIdNum) ||
      categoryIdNum <= 0
    ) {
      fields.categoryId = "Category is required.";
    }

    const relatedSystemIdNum = Number(relatedSystemId);
    if (
      relatedSystemId === undefined ||
      relatedSystemId === null ||
      typeof relatedSystemId === "boolean" ||
      !Number.isInteger(relatedSystemIdNum) ||
      relatedSystemIdNum <= 0
    ) {
      fields.relatedSystemId = "Related system is required.";
    }

    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields.",
          fields,
        },
      });
    }

    // Resolve requester profile for database foreign key compatibility (do NOT auto-create per Lab 3 canonical User architecture)
    const requester = await prisma.requesterUser.findFirst({
      where: {
        OR: [
          { userId },
          { email: req.user!.email },
        ],
      },
    });

    if (!requester || requester.isActive === false) {
      return res.status(400).json({
        error: {
          code: "REQUESTER_NOT_FOUND",
          message: "Requester profile not found or inactive for this user.",
        },
      });
    }

    // Invariant: RequesterUser must already be linked to the authenticated User (established during migration/seed/admin creation)
    if (requester.userId !== userId) {
      return res.status(400).json({
        error: {
          code: "REQUESTER_PROFILE_MISMATCH",
          message: "Requester profile is not linked to the authenticated user.",
        },
      });
    }

    const [category, relatedSystem] = await Promise.all([
      prisma.category.findUnique({ where: { id: categoryIdNum } }),
      prisma.relatedSystem.findUnique({ where: { id: relatedSystemIdNum } }),
    ]);

    const isCategoryInvalid = !category || (category as any).isActive === false;
    const isSystemInvalid = !relatedSystem || (relatedSystem as any).isActive === false;

    if (isCategoryInvalid || isSystemInvalid) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "One or more selected values are invalid.",
        },
      });
    }

    const ticketNo = await generateTicketNumber(prisma);

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNo,
        userId,
        requesterId: requester.id,
        categoryId: categoryIdNum,
        relatedSystemId: relatedSystemIdNum,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority,
        itPriority: requestedPriority,
        currentStatus: "NEW",
        status: "NEW",
      },
    });

    return res.status(201).json({
      data: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

export const getTicketsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    const requester = await prisma.requesterUser.findFirst({
      where: {
        OR: [
          { userId },
          { email: req.user!.email },
        ],
      },
    });

    const { search, categoryId, priority, status, page, limit, sort } = req.query;

    let pageNum = 1;
    if (page !== undefined) {
      if (typeof page !== "string" || !/^\d+$/.test(page) || parseInt(page, 10) < 1) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Page must be a positive integer.",
          },
        });
      }
      pageNum = parseInt(page, 10);
    }

    let limitNum = 10;
    if (limit !== undefined) {
      if (typeof limit !== "string" || !/^\d+$/.test(limit)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Limit must be an integer.",
          },
        });
      }
      const parsedLimit = parseInt(limit, 10);
      if (![10, 20, 50].includes(parsedLimit)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Limit must be 10, 20, or 50.",
          },
        });
      }
      limitNum = parsedLimit;
    }

    const allowedSorts = [
      "createdAt_desc",
      "createdAt_asc",
      "priority_desc",
      "priority_asc",
      "ticketNo_asc",
      "ticketNo_desc",
    ];
    let sortOption = "createdAt_desc";
    if (sort !== undefined) {
      if (typeof sort !== "string" || !allowedSorts.includes(sort)) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Invalid sort parameter.",
          },
        });
      }
      sortOption = sort;
    }

    let categoryIdNum: number | undefined;
    if (categoryId !== undefined) {
      if (typeof categoryId !== "string" || !/^\d+$/.test(categoryId) || parseInt(categoryId, 10) < 1) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Category ID must be a positive integer.",
          },
        });
      }
      categoryIdNum = parseInt(categoryId, 10);

      const category = await prisma.category.findUnique({
        where: { id: categoryIdNum },
      });

      if (!category) {
        return res.status(400).json({
          error: {
            code: "INVALID_REFERENCE",
            message: "Category not found.",
          },
        });
      }
    }

    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (priority !== undefined) {
      if (typeof priority !== "string" || !allowedPriorities.includes(priority.toUpperCase())) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Priority must be LOW, MEDIUM, or HIGH.",
          },
        });
      }
    }

    const allowedStatuses = ["NEW"];
    if (status !== undefined) {
      if (typeof status !== "string" || !allowedStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Invalid status filter. Only NEW is supported.",
          },
        });
      }
    }

    if (search !== undefined) {
      if (typeof search !== "string") {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Search query must be a string.",
          },
        });
      }
      if (search.trim().length > 100) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Search query must not exceed 100 characters.",
          },
        });
      }
    }

    // Canonical ownership: Ticket.userId === userId.
    // Legacy fallback ONLY for unmigrated tickets where userId is null but requesterId matches.
    const ownershipCondition = requester
      ? {
          OR: [
            { userId },
            { AND: [{ userId: null }, { requesterId: requester.id }] },
          ],
        }
      : { userId };

    const andConditions: any[] = [ownershipCondition];

    if (categoryIdNum) {
      andConditions.push({ categoryId: categoryIdNum });
    }

    if (priority && typeof priority === "string") {
      andConditions.push({ requestedPriority: priority.toUpperCase() });
    }

    if (status && typeof status === "string") {
      andConditions.push({ currentStatus: status.toUpperCase() });
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const queryStr = search.trim();
      andConditions.push({
        OR: [
          { ticketNo: { contains: queryStr, mode: "insensitive" } },
          { summary: { contains: queryStr, mode: "insensitive" } },
          { description: { contains: queryStr, mode: "insensitive" } },
        ],
      });
    }

    const where: any = {
      AND: andConditions,
    };

    let orderBy: any[] = [];
    switch (sortOption) {
      case "createdAt_asc":
        orderBy = [{ createdAt: "asc" }, { id: "desc" }];
        break;
      case "createdAt_desc":
        orderBy = [{ createdAt: "desc" }, { id: "desc" }];
        break;
      case "priority_asc":
        orderBy = [{ requestedPriority: "asc" }, { id: "desc" }];
        break;
      case "priority_desc":
        orderBy = [{ requestedPriority: "desc" }, { id: "desc" }];
        break;
      case "ticketNo_asc":
        orderBy = [{ ticketNo: "asc" }, { id: "desc" }];
        break;
      case "ticketNo_desc":
        orderBy = [{ ticketNo: "desc" }, { id: "desc" }];
        break;
      default:
        orderBy = [{ createdAt: "desc" }, { id: "desc" }];
    }

    const skip = (pageNum - 1) * limitNum;

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: true,
          relatedSystem: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      data: tickets,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

export const getTicketDetailHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    // Validate ticket ID (must be a valid UUID)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    // Step 1: Lightweight lookup with select id + userId + requesterId
    const ticketMeta = await prisma.ticket.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        requesterId: true,
      },
    });

    // Ticket does not exist
    if (!ticketMeta) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Step 2: Ownership enforcement for REQUESTER before querying sensitive full detail
    if (req.user!.role === "REQUESTER") {
      const requester = await prisma.requesterUser.findFirst({
        where: {
          OR: [
            { userId },
            { email: req.user!.email },
          ],
        },
      });

      const isOwner =
        ticketMeta.userId === userId ||
        (ticketMeta.userId === null && requester && ticketMeta.requesterId === requester.id);
      if (!isOwner) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to access this ticket.",
          },
        });
      }
    }

    // Step 3: Authorized: query full ticket detail including comments, attachments, relations
    const ticket = await prisma.ticket.findUnique({
      where: {
        id,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        category: true,
        relatedSystem: true,
        attachments: true,
        comments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            ticketId: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
        actionsTaken: {
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
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Return ticket detail.
    // Soft-removed attachments remain visible as metadata.
    // Download/preview restrictions are handled by attachment APIs.
    return res.status(200).json({
      data: ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket detail:", error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * POST /api/v1/tickets/:id/resolve-indicator
 * Allows ticket owner (REQUESTER) to indicate that the problem appears resolved.
 * Sets isRequesterResolved = true idempotently without changing official ticket status.
 */
export const setResolutionIndicatorHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Authentication token is required.",
        },
      });
    }

    // Role check: Only Requesters can trigger advisory resolution indicator
    if (req.user?.role !== "REQUESTER") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only the owning Requester can indicate resolution on a ticket.",
        },
      });
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const { expectedUpdatedAt } = req.body || {};

    // 3. Mandatory expectedUpdatedAt ISO DateTime validation (BR-17, api-spec.md Section 3.2)
    if (!isValidIsoDateTime(expectedUpdatedAt)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "expectedUpdatedAt is required as a valid ISO DateTime string.",
        },
      });
    }

    // Atomic transaction with row lock
    const txResult = await prisma.$transaction(async (tx) => {
      const tickets = await tx.$queryRaw<Array<{
        id: string;
        ticketNo: string;
        userId: string | null;
        requesterId: number;
        status: string;
        currentStatus: string;
        isRequesterResolved: boolean;
        updatedAt: Date;
      }>>`SELECT id, "ticketNo", "userId", "requesterId", status, "currentStatus", "isRequesterResolved", "updatedAt" FROM "Ticket" WHERE id = ${id} FOR UPDATE`;

      if (!tickets || tickets.length === 0) {
        return {
          statusCode: 404,
          payload: {
            success: false,
            error: {
              code: "TICKET_NOT_FOUND",
              message: "Ticket not found.",
            },
          },
        };
      }

      const ticket = tickets[0];

      // Ownership verification (checked before stale check to prevent info/status leaks)
      const requester = await tx.requesterUser.findFirst({
        where: {
          OR: [
            { userId },
            { email: req.user!.email },
          ],
        },
      });

      const isOwner =
        ticket.userId === userId ||
        (ticket.userId === null && requester && ticket.requesterId === requester.id);

      if (!isOwner) {
        return {
          statusCode: 403,
          payload: {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to indicate resolution on this ticket.",
            },
          },
        };
      }

      // Optimistic concurrency check under row lock (API-18b, BR-17)
      if (isConcurrencyStale(expectedUpdatedAt, ticket.updatedAt)) {
        return {
          statusCode: 409,
          payload: {
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Ticket was modified concurrently. Please refresh and try again.",
            },
          },
        };
      }

      // Set isRequesterResolved: true without altering formal status (BR-10, FR-10)
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          isRequesterResolved: true,
          updatedAt: new Date(),
        },
      });

      return {
        statusCode: 200,
        payload: {
          success: true,
          data: {
            id: updatedTicket.id,
            ticketId: updatedTicket.id,
            ticketNumber: updatedTicket.ticketNo,
            status: updatedTicket.status,
            isResolvedByUser: true,
            isRequesterResolved: true,
            updatedAt: updatedTicket.updatedAt,
          },
          message: "Resolution indication recorded. IT Staff will review and finalize the ticket.",
        },
      };
    });

    return res.status(txResult.statusCode).json(txResult.payload);
  } catch (error) {
    console.error("Error setting resolution indicator:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while setting resolution indicator.",
      },
    });
  }
};

/**
 * PATCH /api/v1/tickets/:id/status
 * Transition a ticket status according to the canonical Status Transition Matrix.
 * - Allowed Roles: IT_STAFF, ADMIN (Requesters rejected with 403 FORBIDDEN).
 * - Enforces mandatory expectedUpdatedAt optimistic concurrency check (BR-17).
 * - Enforces atomic Compare-and-Swap with row-level locking (SELECT ... FOR UPDATE).
 * - Rejects disallowed transitions with HTTP 400 INVALID_STATUS_TRANSITION.
 * - Rejects terminal tickets (CLOSED / CANCELLED) with HTTP 400 INVALID_STATUS_TRANSITION.
 */
export const updateTicketStatusHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    // 1. Role-based access control (FR-11, BR-11, AC-11, API-13c, API-17)
    if (req.user?.role !== "IT_STAFF" && req.user?.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only IT Staff and Administrators are permitted to transition ticket status.",
        },
      });
    }

    // 2. Validate ticket ID UUID
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const { status: targetStatus, expectedUpdatedAt } = req.body || {};

    // 3. Mandatory expectedUpdatedAt ISO DateTime validation (BR-17, api-spec.md)
    if (!isValidIsoDateTime(expectedUpdatedAt)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "expectedUpdatedAt is required as a valid ISO DateTime string.",
        },
      });
    }

    // 4. Validate target status
    if (!targetStatus || !isValidStatus(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Target status is required and must be a valid ticket status.",
        },
      });
    }

    // 5. Atomic transaction with row lock
    const txResult = await prisma.$transaction(async (tx) => {
      // Row-lock ticket to guarantee atomic serialization against concurrent race conditions
      const tickets = await tx.$queryRaw<Array<{
        id: string;
        ticketNo: string;
        status: string;
        currentStatus: string;
        updatedAt: Date;
      }>>`SELECT id, "ticketNo", status, "currentStatus", "updatedAt" FROM "Ticket" WHERE id = ${id} FOR UPDATE`;

      if (!tickets || tickets.length === 0) {
        return {
          statusCode: 404,
          payload: {
            success: false,
            error: {
              code: "TICKET_NOT_FOUND",
              message: "Ticket not found.",
            },
          },
        };
      }

      const ticket = tickets[0];
      const currentStatus = (ticket.currentStatus || ticket.status) as TicketStatusType;

      // Optimistic concurrency check under row lock (BR-17, FR-12, AC-12, API-13d, API-18)
      // Must be evaluated FIRST after row lock before transition checks,
      // guaranteeing that any concurrent request acting on an outdated version
      // consistently receives 409 STALE_UPDATE_CONFLICT rather than 400 INVALID_STATUS_TRANSITION.
      if (isConcurrencyStale(expectedUpdatedAt, ticket.updatedAt)) {
        return {
          statusCode: 409,
          payload: {
            success: false,
            error: {
              code: "STALE_UPDATE_CONFLICT",
              message: "Ticket was modified concurrently. Please refresh and try again.",
            },
          },
        };
      }

      // Terminal status check: Cannot transition from CLOSED or CANCELLED (BR-12, AC-13, API-20, api-spec.md)
      if (isTerminalStatus(currentStatus)) {
        return {
          statusCode: 400,
          payload: {
            success: false,
            error: {
              code: "TICKET_LOCKED",
              message: `Cannot transition status from terminal state ${currentStatus}.`,
            },
          },
        };
      }

      // Transition matrix validation (FR-08, FR-09, BR-09, AC-08, AC-09, API-13, API-14)
      if (!isValidTransition(currentStatus, targetStatus)) {
        return {
          statusCode: 400,
          payload: {
            success: false,
            error: {
              code: "INVALID_STATUS_TRANSITION",
              message: `Transition from ${currentStatus} to ${targetStatus} is not permitted.`,
            },
          },
        };
      }

      // Apply transition
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          status: targetStatus as any,
          currentStatus: targetStatus as any,
          updatedAt: new Date(),
        },
      });

      return {
        statusCode: 200,
        payload: {
          success: true,
          data: {
            id: updatedTicket.id,
            ticketNumber: updatedTicket.ticketNo,
            previousStatus: currentStatus,
            status: updatedTicket.status,
            updatedAt: updatedTicket.updatedAt,
          },
          message: `Ticket status successfully transitioned to ${targetStatus}`,
        },
      };
    });

    return res.status(txResult.statusCode).json(txResult.payload);
  } catch (error) {
    console.error("Error in updateTicketStatusHandler:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "An unexpected error occurred while updating ticket status.",
      },
    });
  }
};