import { Response } from "express";
import { RequesterRequest } from "../middleware/requesterGuard.js";
import { getPrisma } from "../prisma.js";
import { generateTicketNumber } from "../utils/ticketNoGenerator.js";

export const createTicketHandler = async (req: RequesterRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    
    const requesterId = req.body?.requesterId || req.requester?.id;

    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    const fields: Record<string, string> = {};

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

export const getTicketsHandler = async (req: RequesterRequest, res: Response) => {
  try {
    const prisma = getPrisma();

    const rawRequesterId = req.query.requesterId || req.requester?.id;

    if (
      !rawRequesterId ||
      typeof rawRequesterId === "boolean" ||
      !/^\d+$/.test(String(rawRequesterId)) ||
      Number(rawRequesterId) <= 0
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "Requester ID is required and must be a positive integer.",
        },
      });
    }
    const requesterIdNum = Number(rawRequesterId);

    const requester = await prisma.requesterUser.findUnique({
      where: { id: requesterIdNum },
    });

    if (!requester || (requester as any).isActive === false) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "Requester not found or inactive.",
        },
      });
    }

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

    if (search && typeof search === "string" && search.trim() !== "") {
      const queryStr = search.trim();
      where.OR = [
        { ticketNo: { contains: queryStr, mode: "insensitive" } },
        { summary: { contains: queryStr, mode: "insensitive" } },
        { description: { contains: queryStr, mode: "insensitive" } },
      ];
    }

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
  req: RequesterRequest,
  res: Response
) => {
  try {
    const prisma = getPrisma();

    const { id } = req.params;

    const rawRequesterId =
      req.query.requesterId ?? req.requester?.id;

    // Validate requester context
    if (
      rawRequesterId === undefined ||
      rawRequesterId === null ||
      typeof rawRequesterId === "boolean" ||
      !/^\d+$/.test(String(rawRequesterId)) ||
      Number(rawRequesterId) <= 0
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message:
            "Requester ID is required and must be a positive integer.",
        },
      });
    }

    // Validate ticket ID
    if (!id || typeof id !== "string") {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    const requesterId = Number(rawRequesterId);

    // Verify requester exists and is active
    const requester = await prisma.requesterUser.findUnique({
      where: {
        id: requesterId,
      },
    });

    if (!requester || requester.isActive === false) {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "Requester not found or inactive.",
        },
      });
    }

    // Find ticket together with required detail data and attachments.
    const ticket = await prisma.ticket.findUnique({
      where: {
        id,
      },
      include: {
        requester: true,
        category: true,
        relatedSystem: true,
        attachments: true,
      },
    });

    // Ticket does not exist
    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "TICKET_NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Ownership enforcement
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this ticket.",
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