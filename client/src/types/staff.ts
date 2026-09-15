import { UserRole } from "./auth";
import { Attachment, TicketComment } from "./ticket";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatusType =
  | "NEW"
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_FOR_REQUESTER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED"
  | "CANCELLED";

export interface StaffAssignee {
  id: string;
  name: string;
  email: string;
  role: "IT_STAFF" | "ADMIN";
}

export interface StaffQueueTicket {
  id: string;
  ticketNo: string;
  summary: string;
  category: {
    id: number;
    name: string;
  };
  relatedSystem?: {
    id: number;
    name: string;
  };
  requestedPriority: TicketPriority;
  itPriority: TicketPriority;
  status: TicketStatusType;
  currentStatus: TicketStatusType;
  isRequesterResolved: boolean;
  requester?: {
    id: string;
    name: string;
    email?: string;
  };
  owner: StaffAssignee | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueuePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InternalNoteItem {
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

export interface StaffTicketDetailModel extends StaffQueueTicket {
  description: string;
  attachments: Attachment[];
  comments: TicketComment[];
  notes: InternalNoteItem[];
}
