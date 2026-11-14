import {
  Firestore,
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from "@/types/order";

export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["confirmed", "cancelled"],
  confirmed: ["meetup_scheduled", "cancelled"],
  meetup_scheduled: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isValidStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

export function generateInvoiceNumber(orderId: string): string {
  const cleanId = orderId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const year = new Date().getFullYear();
  return `MSRUAS-${year}-${cleanId}`;
}

export interface CreateOrderParams {
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  meetupSpot?: string;
}

/**
 * [FR-11] Transactional Order Creation (Single-Sale Guarantee)
 * Atomically re-reads the listing inside a Firestore transaction.
 * Requires status === 'available', creates the order, transitions the listing
 * to 'sold', and appends the initial tracking event.
 * If another buyer checks out concurrently, one will fail with "This item is no longer available."
 */
export async function createOrderTransaction(
  db: Firestore,
  params: CreateOrderParams
): Promise<string> {
  const listingRef = doc(db, "listings", params.listingId);
  const orderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (tx) => {
    // 1. Re-read listing
    const listingSnap = await tx.get(listingRef);

    if (!listingSnap.exists()) {
      throw new Error("Listing not found.");
    }

    const listingData = listingSnap.data();

    // 2. Enforce available state
    if (listingData.status !== "available") {
      throw new Error("This item is no longer available. Another student may have just purchased it.");
    }

    // 3. Forbid seller buying own item
    if (listingData.sellerId === params.buyerId) {
      throw new Error("Sellers cannot purchase their own listing.");
    }

    // 4. Atomically mark listing as 'sold'
    tx.update(listingRef, {
      status: "sold",
      updatedAt: serverTimestamp(),
    });

    // 5. Generate official invoice record
    const invoiceNumber = generateInvoiceNumber(orderRef.id);

    const initialStatus: OrderStatus =
      params.paymentMethod === "upi_sim" && params.paymentStatus === "success"
        ? "confirmed"
        : "created";

    // 6. Create order document
    tx.set(orderRef, {
      id: orderRef.id,
      listingId: params.listingId,
      listingTitle: params.listingTitle,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      sellerId: params.sellerId,
      sellerName: params.sellerName,
      price: params.price,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      status: initialStatus,
      meetupSpot: params.meetupSpot || "University Central Library Entrance",
      invoice: {
        number: invoiceNumber,
        issuedAt: new Date().toISOString(),
        total: params.price,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 7. Write initial event to subcollection orders/{id}/tracking
    const trackingRef = doc(collection(db, `orders/${orderRef.id}/tracking`));
    tx.set(trackingRef, {
      status: initialStatus,
      note: params.paymentMethod === "cash"
        ? "Order initiated with Cash at Meetup agreement."
        : "Simulated UPI payment verified successfully.",
      at: serverTimestamp(),
    });
  });

  return orderRef.id;
}

