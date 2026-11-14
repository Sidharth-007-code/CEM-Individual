export type PaymentMethod = "cash" | "upi_sim";
export type PaymentStatus = "pending" | "success" | "failed";

export type OrderStatus =
  | "created"
  | "confirmed"
  | "meetup_scheduled"
  | "completed"
  | "cancelled";

export interface TrackingEvent {
  status: OrderStatus;
  note: string;
  at: any;
}

export interface OrderInvoice {
  number: string;
  issuedAt: any;
  total: number;
}

export interface Order {
  id: string;
  listingId: string;
  listingTitle?: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  price: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  meetupSpot?: string;
  meetupTime?: string;
  invoice?: OrderInvoice;
  createdAt: any;
  updatedAt?: any;
}

