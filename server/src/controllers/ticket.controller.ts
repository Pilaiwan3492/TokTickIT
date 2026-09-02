import { Response } from "express";
import { RequesterRequest } from "../middleware/requesterGuard.js";
import { getPrisma } from "../prisma.js";
import { generateTicketNumber } from "../utils/ticketNoGenerator.js";

export const createTicketHandler = async (req: RequesterRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    
    // 1. pull requesterId from request body or middleware context
    const requesterId = req.body?.requesterId || req.requester?.id;

    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    const fields: Record<string, string> = {};

    // ---------------------------------------------------------
    // Phase 1: Field Validation (Strict Integer & Boundary Checks)
    // ---------------------------------------------------------
    const requesterIdNum = Number(requesterId);
    if (
      requesterId === undefined ||
      requesterId === null ||
      typeof requesterId === "boolean" ||
      !Number.isInteger(requesterIdNum) ||
      requesterIdNum <= 0
    ) {
      fields.requesterId = "Requester ID is required and must be a positive integer.";
    }

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

    // ---------------------------------------------------------
    // Phase 2: Reference Validation 
    // ---------------------------------------------------------
    const [requester, category, relatedSystem] = await Promise.all([
      prisma.requesterUser.findUnique({ where: { id: requesterIdNum } }),
      prisma.category.findUnique({ where: { id: categoryIdNum } }),
      prisma.relatedSystem.findUnique({ where: { id: relatedSystemIdNum } }),
    ]);

    const isRequesterInvalid = !requester || (requester as any).isActive === false;
    const isCategoryInvalid = !category || (category as any).isActive === false;
    const isSystemInvalid = !relatedSystem || (relatedSystem as any).isActive === false;

    if (isRequesterInvalid || isCategoryInvalid || isSystemInvalid) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "One or more selected values are invalid.",
        },
      });
    }

    // ---------------------------------------------------------
    // Phase 3: Unique Ticket Generation & Database Creation
    // ---------------------------------------------------------
    const ticketNo = await generateTicketNumber(prisma);

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNo,
        requesterId: requesterIdNum,
        categoryId: categoryIdNum,
        relatedSystemId: relatedSystemIdNum,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority,
        currentStatus: "NEW",
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

// ---------------------------------------------------------
// Issue 14: Get Paginated Tickets by Requester Ownership
// ---------------------------------------------------------
export const getTicketsHandler = async (req: RequesterRequest, res: Response) => {
  try {
    const prisma = getPrisma();

    // 1. Ownership check - strict filter by Requester context or query parameter
    const rawRequesterId = req.query.requesterId || req.requester?.id;

    if (
      !rawRequesterId ||
      typeof rawRequesterId === "boolean" ||
      !/^\d+$/.test(String(rawRequesterId)) ||
      Number(rawRequesterId) <= 0
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY",
          message: "Requester ID is required and must be a positive integer.",
        },
      });
    }
    const requesterIdNum = Number(rawRequesterId);

    // 2. Strict Query Parameter Validation (Lab 2 Spec)
    const { search, categoryId, priority, status, page, limit, sort } = req.query;

    // Validation: page (must be positive integer, default: 1)
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

    // Validation: limit (strictly 10, 20, or 50, default: 10)
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

    // Validation: sort (Strict Whitelist, default: createdAt_desc)
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

    // Validation: categoryId
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
    }

    // Validation: priority
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

    // Validation: status
    const allowedStatuses = ["NEW", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"];
    if (status !== undefined) {
      if (typeof status !== "string" || !allowedStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY",
            message: "Invalid status filter.",
          },
        });
      }
    }

    // 3. Build Prisma filter conditions
    const where: any = {
      requesterId: requesterIdNum,
    };

    if (categoryIdNum) {
      where.categoryId = categoryIdNum;
    }

    if (priority && typeof priority === "string") {
      where.requestedPriority = priority.toUpperCase();
    }

    if (status && typeof status === "string") {
      where.currentStatus = status.toUpperCase();
    }

    // MUST FIX 1: Search ticketNo, summary, AND description (case-insensitive)
    if (search && typeof search === "string" && search.trim() !== "") {
      const queryStr = search.trim();
      where.OR = [
        { ticketNo: { contains: queryStr, mode: "insensitive" } },
        { summary: { contains: queryStr, mode: "insensitive" } },
        { description: { contains: queryStr, mode: "insensitive" } },
      ];
    }

    // MUST FIX 4: Primary sort + Secondary sort (id: desc) for deterministic order
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

    // 4. Query execution
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

    const totalPages = Math.ceil(total / limitNum) || 1;

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