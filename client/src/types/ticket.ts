import { UserRole } from "./auth";

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface Attachment {
  id: string;
  fileName?: string;
  filename?: string;
  originalName?: string;
  fileSize?: number;
  size?: number;
  mimeType?: string;
  contentType?: string;
  createdAt?: string;
  uploadedAt?: string;
  removedAt?: string | null;
  removalReason?: string | null;
  isRemoved?: boolean;
}

export interface ActionTakenPerformer {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
}

export interface ActionTaken {
  id: string;
  ticketId: string;
  actionDate: string;
  actionDescription: string;
  result: string;
  performedById: string;
  performedBy?: ActionTakenPerformer;
  followUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  createdAt?: string;
  updatedAt: string;
}

export interface CreateActionTakenPayload {
  actionDate?: string;
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  expectedTicketUpdatedAt: string;
}

export interface UpdateActionTakenPayload {
  actionDate?: string;
  actionDescription?: string;
  result?: string;
  followUpRequired?: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  expectedUpdatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNo: string;
  summary: string;
  description: string;
  requestedPriority: string;
  itPriority?: string | null;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  isRequesterResolved?: boolean;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    role?: UserRole;
  };
  requesterId?: number;
  requester?: {
    id: number;
    name: string;
    email?: string;
  };
  category?: {
    id: number;
    name: string;
  };
  relatedSystem?: {
    id: number;
    name: string;
  };
  attachments?: Attachment[];
  comments?: TicketComment[];
  actionsTaken?: ActionTaken[];
}
