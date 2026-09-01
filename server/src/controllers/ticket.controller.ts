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