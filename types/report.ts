export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Report {
  id: string; // usually listingId_reporterId
  listingId: string;
  listingTitle?: string;
  reporterId: string;
  reporterName?: string;
  reason: string;
  status: ReportStatus;
  createdAt: any;
  resolvedAt?: any;
  adminNote?: string;
}

export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded";

export interface ReturnRequest {
  id: string;
  orderId: string;
  listingTitle?: string;
  buyerId: string;
  buyerName?: string;
  sellerId?: string;
  reason: string;
  status: ReturnStatus;
  reviewNote?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface InAppNotification {
  id: string;
  type: "verification" | "order" | "chat" | "report" | "system";
  text: string;
  link?: string;
  read: boolean;
  createdAt: any;
}

export interface AuditLogEntry {
  id?: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  targetId: string;
  targetType?: string;
  details?: Record<string, any>;
  at: any;
}

