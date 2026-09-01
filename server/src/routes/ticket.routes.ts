import { Router } from 'express';
import { createTicketHandler } from '../controllers/ticket.controller.js';
import { requireRequester } from '../middleware/requesterGuard.js';

const router = Router();
router.post('/tickets', requireRequester, createTicketHandler);

export default router;