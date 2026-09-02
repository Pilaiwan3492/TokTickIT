import { Router } from 'express';
import { createTicketHandler, getTicketsHandler } from '../controllers/ticket.controller.js';
import { requireRequester } from '../middleware/requesterGuard.js';

const router = Router();
// POST /api/v1/tickets
router.post('/tickets', createTicketHandler);

// GET /api/v1/tickets
router.get('/tickets', getTicketsHandler);

export default router;