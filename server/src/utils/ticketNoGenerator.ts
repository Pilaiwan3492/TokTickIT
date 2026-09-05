import { getPrisma } from '../prisma.js';

export async function generateTicketNumber(prismaInstance?: any): Promise<string> {
  const year = new Date().getFullYear();
  const prisma = prismaInstance || getPrisma();
  
  let isUnique = false;
  let ticketNo = '';
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    const count = await prisma.ticket.count();
    const sequence = String(count + attempts).padStart(6, '0');
    ticketNo = `TKT-${year}-${sequence}`;

    const existing = await prisma.ticket.findUnique({
      where: { ticketNo },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return ticketNo;
}