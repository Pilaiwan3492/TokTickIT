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
      prisma.requesterUser.findUnique({ where: { id: categoryIdNum ? requesterIdNum : 0 } }),
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
    const requesterIdNum = Number(rawRequesterId);

    if (
      !rawRequesterId ||
      typeof rawRequesterId === "boolean" ||
      !Number.isInteger(requesterIdNum) ||
      requesterIdNum <= 0
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Requester ID is required and must be a positive integer.",
        },
      });
    }

    // 2. Parse query parameters
    const {
      search,
      categoryId,
      priority,
      status,
      page = "1",
      limit = "10",
      sort = "createdAt_desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // 3. Build Prisma filter conditions (Strict Requester Ownership)
    const where: any = {
      requesterId: requesterIdNum,
    };

    if (categoryId) {
      const catIdNum = Number(categoryId);
      if (Number.isInteger(catIdNum) && catIdNum > 0) {
        where.categoryId = catIdNum;
      }
    }

    if (priority && typeof priority === "string") {
      where.requestedPriority = priority.toUpperCase();
    }

    if (status && typeof status === "string") {
      where.currentStatus = status.toUpperCase();
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const queryStr = search.trim();
      where.OR = [
        { ticketNo: { contains: queryStr, mode: "insensitive" } },
        { summary: { contains: queryStr, mode: "insensitive" } },
      ];
    }

    // 4. Sorting logic
    let orderBy: any = { createdAt: "desc" };
    if (typeof sort === "string") {
      const [field, order] = sort.split("_");
      const validOrder = order?.toLowerCase() === "asc" ? "asc" : "desc";

      if (field === "ticketNo") orderBy = { ticketNo: validOrder };
      else if (field === "createdAt" || field === "createdDate") orderBy = { createdAt: validOrder };
      else if (field === "summary") orderBy = { summary: validOrder };
      else if (field === "priority") orderBy = { requestedPriority: validOrder };
      else if (field === "status") orderBy = { currentStatus: validOrder };
    }

    // 5. Query execution with relational data
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
