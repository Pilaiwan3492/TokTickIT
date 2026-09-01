import { Response } from "express";
import { RequesterRequest } from "../middleware/requesterGuard.js";
import { getPrisma } from "../prisma.js";

export const createTicketHandler = async (req: RequesterRequest, res: Response) => {
  try {
    const prisma = getPrisma();
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    const requesterId = req.requester?.id;

    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    const fields: Record<string, string> = {};

    // 1. Validate Required & Enum: requestedPriority
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (!requestedPriority || !validPriorities.includes(requestedPriority)) {
      fields.requestedPriority = "Requested priority must be LOW, MEDIUM, or HIGH.";
    }

    // 2. Validate Summary & Description length (after trimming)
    if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      fields.summary = "Summary must be between 5 and 150 characters.";
    }
    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      fields.description = "Description must be between 10 and 2,000 characters.";
    }

    // 3. Validate Category (must exist & be active)
    if (!categoryId || isNaN(Number(categoryId))) {
      fields.categoryId = "Category is required.";
    } else {
      const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });
      if (!category || (category as any).isActive === false) {
        fields.categoryId = "Selected category is invalid or inactive.";
      }
    }

    // 4. Validate Related System (must exist & be active)
    if (!relatedSystemId || isNaN(Number(relatedSystemId))) {
      fields.relatedSystemId = "Related system is required.";
    } else {
      const relatedSystem = await prisma.relatedSystem.findUnique({
        where: { id: Number(relatedSystemId) },
      });
      if (!relatedSystem || (relatedSystem as any).isActive === false) {
        fields.relatedSystemId = "Selected related system is invalid or inactive.";
      }
    }

    // Return 400 Bad Request if validation fails
    if (Object.keys(fields).length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields.",
          fields,
        },
      });
    }

    // Generate Ticket Number (TKT-YYYY-XXXXXX)
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count();
    const sequence = String(count + 1).padStart(6, "0");
    const ticketNo = `TKT-${year}-${sequence}`;

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNo,
        requesterId: Number(requesterId),
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
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