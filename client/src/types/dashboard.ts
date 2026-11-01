export interface RequesterDashboardMetrics {
  openTickets: number;
  waitingForRequester: number;
  resolved: number;
  closed: number;
}

export interface RequesterRecentTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
}

export interface RequesterDrillDownPaths {
  openTickets: string;
  waitingForRequester: string;
  resolved: string;
  closed: string;
}

export interface RequesterDashboardData {
  requesterName: string;
  metrics: RequesterDashboardMetrics;
  recentTickets: RequesterRecentTicket[];
  recentlyResolvedTickets: RequesterRecentTicket[];
  drillDownPaths: RequesterDrillDownPaths;
}

export interface StaffDashboardMetrics {
  newCount: number;
  openCount: number;
  inProgressCount: number;
  waitingForRequesterCount: number;
  myAssignedCount: number;
  unassignedCount: number;
  urgentCount: number;
  highCount: number;
  myActionsCount: number;
}

export interface StaffRecentTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  owner: {
    id: string;
    name: string;
  } | null;
  updatedAt: string;
}

export interface StaffRecentAction {
  id: string;
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  ticketStatus: string;
  actionDate: string;
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string | null;
}

export interface AdminUserStats {
  activeUsers: number;
  activeStaff: number;
  activeAdmins: number;
}

export interface StaffDrillDownPaths {
  newCount: string;
  openCount: string;
  inProgressCount: string;
  waitingForRequesterCount: string;
  myAssignedCount: string;
  unassignedCount: string;
  urgentCount: string;
  highCount: string;
}

export interface StaffDashboardData {
  staffName: string;
  role: "IT_STAFF" | "ADMIN";
  metrics: StaffDashboardMetrics;
  byStatus: Record<string, number>;
  recentTickets: StaffRecentTicket[];
  myRecentActions: StaffRecentAction[];
  userStats: AdminUserStats | null;
  drillDownPaths: StaffDrillDownPaths;
}
