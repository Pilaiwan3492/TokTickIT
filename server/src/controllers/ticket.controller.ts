import { Request, Response } from 'express';
import { getPrisma } from '../prisma'; 
import { generateTicketNumber } from '../utils/ticketNoGenerator';
    
export const createTicket = async (req: Request, res: Response) => {
  const { requesterId, categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
  const prisma = getPrisma();
  const trimmedSummary = summary?.trim() || '';
  const trimmedDescription = description?.trim() || '';
  const fields: Record<string, string> = {};

  if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 150) {
    fields.summary = 'Summary must be between 5 and 150 characters.';
  }
  if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
    fields.description = 'Description must be between 10 and 2,000 characters.';
  }
  if (!requesterId) fields.requesterId = 'Requester context is required.';
  if (!categoryId) fields.categoryId = 'Category is required.';
  if (!relatedSystemId) fields.relatedSystemId = 'Related System is required.';

  if (Object.keys(fields).length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields.',
        fields
      }
    });
  }

  try {
    const ticketNo = await generateTicketNumber();
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNo,
        requesterId: Number(requesterId),
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority,
        currentStatus: 'NEW'
      }
    });

    return res.status(201).json({ data: newTicket });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: 'TICKET_CREATION_FAILED',
        message: 'Unable to create the ticket. Please try again.'
      }
    });
  }
};