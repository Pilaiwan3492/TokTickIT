import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/authGuard.js";
import { getPrisma } from "../prisma.js";
import { Priority, TicketStatus } from "@prisma/client";

// BR-16: Status Transition Matrix
export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: [TicketStatus.OPEN, TicketStatus.CANCELLED],
  OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.CANCELLED],
  IN_PROGRESS: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  WAITING_FOR_REQUESTER: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  RESOLVED: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  REOPENED: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  CLOSED: [], // Terminal
  CANCELLED: [], // Terminal
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/v1/staff/tickets
 * IT Staff Ticket Queue with search, filters (status, priority, ownership), sorting, and pagination.
 */
export const getStaffQueueHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    const {
      search,
      status,
      priority,
      ownership = "ALL",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      pageSize,
      limit,
    } = req.query;

    // Pagination parsing
    const parsedPage = Math.max(1, parseInt(String(page), 10) || 1);
    const rawLimit = pageSize || limit || "10";
    const parsedPageSize = Math.max(1, Math.min(100, parseInt(String(rawLimit), 10) || 10));

    // Construct Prisma where clause using AND conditions to allow all filters to combine seamlessly
    const andConditions: any[] = [];

    // 1. Search (matches ticketNo, summary, requester name, or requester email)
    if (search && typeof search === "string" && search.trim() !== "") {
      const term = search.trim();
      andConditions.push({
        OR: [
          { ticketNo: { contains: term } },
          { summary: { contains: term } },
          {
            user: {
              name: { contains: term },
            },
          },
          {
            user: {
              email: { contains: term },
            },
          },
          {
            requester: {
              name: { contains: term },
            },
          },
          {
            requester: {
              email: { contains: term },
            },
          },
        ],
      });
    }

    // 2. Status filter (supports comma-separated list or single status)
    if (status && typeof status === "string" && status.trim() !== "") {
      const statusTokens = status
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => Object.values(TicketStatus).includes(s as TicketStatus));

      if (statusTokens.length === 1) {
        andConditions.push({ currentStatus: statusTokens[0] as TicketStatus });
      } else if (statusTokens.length > 1) {
        andConditions.push({ currentStatus: { in: statusTokens as TicketStatus[] } });
      }
    }

    // 3. Priority filter (matches itPriority or requestedPriority fallback)
    if (priority && typeof priority === "string" && priority.trim() !== "") {
      const prioUpper = priority.trim().toUpperCase();
      if (Object.values(Priority).includes(prioUpper as Priority)) {
        andConditions.push({
          OR: [
            { itPriority: prioUpper as Priority },
            {
              AND: [
                { itPriority: null },
                { requestedPriority: prioUpper as Priority },
              ],
            },
          ],
        });
      }
    }

    // 4. Ownership filter: ALL, UNASSIGNED, ASSIGNED_TO_ME
    const ownershipUpper = String(ownership).toUpperCase();
    if (ownershipUpper === "UNASSIGNED") {
      andConditions.push({ ownerId: null });
    } else if (ownershipUpper === "ASSIGNED_TO_ME") {
      andConditions.push({ ownerId: userId });
    }

    const where: any = andConditions.length > 0 ? { AND: andConditions } : {};

    // 5. Deterministic sorting (API-24: primary sort + secondary id desc)
    const validSortFields: Record<string, string> = {
      ticketNo: "ticketNo",
      createdAt: "createdAt",
      summary: "summary",
      itPriority: "itPriority",
      status: "currentStatus",
      owner: "ownerId",
    };

    const sortField = validSortFields[String(sortBy)] || "createdAt";
    const direction = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    const orderBy: any[] = [{ [sortField]: direction }];
    if (sortField !== "id") {
      orderBy.push({ id: "desc" });
    }

    const skip = (parsedPage - 1) * parsedPageSize;

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: parsedPageSize,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          user: { select: { id: true, name: true, email: true, role: true } },
          owner: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / parsedPageSize);

    // Format output according to API Specification Section 6.1
    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketNo: t.ticketNo,
      summary: t.summary,
      category: t.category,
      relatedSystem: t.relatedSystem,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority || t.requestedPriority,
      status: t.currentStatus || t.status,
      currentStatus: t.currentStatus || t.status,
      isRequesterResolved: t.isRequesterResolved,
      requester: t.user || t.requester,
      owner: t.owner
        ? { id: t.owner.id, name: t.owner.name, role: t.owner.role, email: t.owner.email }
        : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return res.status(200).json({
      data: formattedTickets,
      pagination: {
        page: parsedPage,
        pageSize: parsedPageSize,
        totalItems,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPreviousPage: parsedPage > 1,
      },
      meta: {
        total: totalItems,
        page: parsedPage,
        limit: parsedPageSize,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error retrieving staff ticket queue:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * GET /api/v1/staff/tickets/:id
 * Retrieve operational ticket detail for IT Staff and Administrators.
 * Includes category, relatedSystem, attachments, comments, and internal notes.
 */
export const getStaffTicketDetailHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true, isActive: true } },
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        owner: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
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
        notes: {
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

    const formattedTicket = {
      ...ticket,
      itPriority: ticket.itPriority || ticket.requestedPriority,
      status: ticket.currentStatus || ticket.status,
      currentStatus: ticket.currentStatus || ticket.status,
      requester: ticket.user || ticket.requester,
    };

    return res.status(200).json({
      data: formattedTicket,
    });
  } catch (error) {
    console.error("Error retrieving staff ticket detail:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * PATCH /api/v1/staff/tickets/:id/assignment
 * Claim unassigned ticket or reassign ownership to active IT Staff or Administrator.
 */
export const updateTicketAssignmentHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const { ownerId } = req.body;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    let targetOwnerId: string | null = null;

    if (ownerId === "me") {
      targetOwnerId = req.user!.id;
    } else if (ownerId === null || ownerId === "" || ownerId === undefined) {
      targetOwnerId = null;
    } else if (typeof ownerId === "string") {
      targetOwnerId = ownerId;
    } else {
      return res.status(400).json({
        error: {
          code: "INVALID_OWNER",
          message: "Owner ID must be a valid user UUID, 'me', or null.",
        },
      });
    }

    // If assigning to a specific user, validate they are active IT_STAFF or ADMIN
    if (targetOwnerId !== null) {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetOwnerId },
      });

      if (!targetUser || !targetUser.isActive || targetUser.role === "REQUESTER") {
        return res.status(400).json({
          error: {
            code: "INVALID_OWNER",
            message: "Ticket owner must be an active IT Staff or Administrator.",
          },
        });
      }
    }

    // Check ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTicket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { ownerId: targetOwnerId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({
      data: {
        ...updatedTicket,
        status: updatedTicket.currentStatus || updatedTicket.status,
        itPriority: updatedTicket.itPriority || updatedTicket.requestedPriority,
      },
    });
  } catch (error) {
    console.error("Error updating ticket assignment:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * PATCH /api/v1/staff/tickets/:id/priority
 * Update IT Priority independently of Requested Priority (BR-14).
 */
export const updateTicketPriorityHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const { itPriority } = req.body;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    const validPriorities = Object.values(Priority);
    const normalizedPriority = typeof itPriority === "string" ? itPriority.toUpperCase() : "";

    if (!validPriorities.includes(normalizedPriority as Priority)) {
      return res.status(400).json({
        error: {
          code: "INVALID_PRIORITY",
          message: `Priority must be one of: ${validPriorities.join(", ")}`,
        },
      });
    }

    // Check ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, requestedPriority: true },
    });

    if (!existingTicket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: { itPriority: normalizedPriority as Priority },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        category: true,
        relatedSystem: true,
      },
    });

    return res.status(200).json({
      data: {
        ...updatedTicket,
        status: updatedTicket.currentStatus || updatedTicket.status,
      },
    });
  } catch (error) {
    console.error("Error updating ticket IT priority:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * PATCH /api/v1/staff/tickets/:id/status
 * Transition ticket status strictly according to the Transition Matrix (BR-16).
 */
export const transitionTicketStatusHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const { status: targetStatusRaw } = req.body;

    if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Ticket ID must be a valid UUID.",
        },
      });
    }

    const validStatuses = Object.values(TicketStatus);
    const targetStatus = typeof targetStatusRaw === "string" ? targetStatusRaw.toUpperCase() : "";

    if (!validStatuses.includes(targetStatus as TicketStatus)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
      });
    }

    // Check ticket exists
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, status: true, currentStatus: true },
    });

    if (!existingTicket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const currentStatus = (existingTicket.currentStatus || existingTicket.status) as TicketStatus;
    const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];

    // Verify transition compliance with Status Transition Matrix (BR-16)
    if (!allowedNextStatuses.includes(targetStatus as TicketStatus)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `Cannot transition status from ${currentStatus} to ${targetStatus}.`,
        },
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        status: targetStatus as TicketStatus,
        currentStatus: targetStatus as TicketStatus,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        category: true,
        relatedSystem: true,
      },
    });

    return res.status(200).json({
      data: {
        ...updatedTicket,
        itPriority: updatedTicket.itPriority || updatedTicket.requestedPriority,
      },
    });
  } catch (error) {
    console.error("Error transitioning ticket status:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};

/**
 * GET /api/v1/staff/assignees
 * Retrieve list of active IT Staff and Administrators for ticket assignment dropdown.
 */
export const getStaffAssigneesHandler = async (
  _req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();

    const assignees = await prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ["IT_STAFF", "ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      data: assignees,
    });
  } catch (error) {
    console.error("Error retrieving staff assignees:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    });
  }
};
