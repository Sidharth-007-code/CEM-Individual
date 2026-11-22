"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus, TrackingEvent } from "@/types/order";
import { UserProfile } from "@/types/user";
import { MEETUP_SPOTS, MeetupSpot } from "@/lib/constants";
import { ReturnModal } from "@/components/orders/ReturnModal";
import { Badge, Button, Card, Input, Select } from "@/components/ui";

function formatOrderDate(timestamp: any) {
  const date = timestamp?.toDate?.();
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date) : "Date unavailable";
}
import {
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  FileText,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  Calendar,
  XCircle,
  RefreshCw,
  Phone,
} from "lucide-react";

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, isAdmin, isVerifier, loading: authLoading } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Meetup update modal / drawer
  const [showMeetupEdit, setShowMeetupEdit] = useState(false);
  const [newMeetupSpot, setNewMeetupSpot] = useState<MeetupSpot>(MEETUP_SPOTS[0]);
  const [newMeetupTime, setNewMeetupTime] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Return modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!id || !user || (isVerifier && !isAdmin)) {
      setOrder(null);
      setTrackingEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setOrder(null);
    setTrackingEvents([]);
    const orderRef = doc(db, "orders", id);
    let unsubscribeTracking: (() => void) | undefined;

    const unsubscribeOrder = onSnapshot(
      orderRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Order;
          // Guard: user must be buyer, seller, or admin
          if (data.buyerId === user.uid || data.sellerId === user.uid || isAdmin) {
            setOrder(data);
            if (data.meetupSpot) {
              setNewMeetupSpot(data.meetupSpot as MeetupSpot);
            }

            // Only query tracking after the order snapshot proves this account
            // is a participant (or an admin). Firestore rules remain authoritative.
            if (!unsubscribeTracking) {
              const trackingRef = collection(db, `orders/${id}/tracking`);
              unsubscribeTracking = onSnapshot(
                trackingRef,
                (trackingSnap) => {
                  const events = trackingSnap.docs.map((d) => d.data() as TrackingEvent);
                  events.sort((a, b) => {
                    const aT = a.at?.toMillis ? a.at.toMillis() : 0;
                    const bT = b.at?.toMillis ? b.at.toMillis() : 0;
                    return aT - bT;
                  });
                  setTrackingEvents(events);
                },
                (err) => {
                  console.warn("Tracking subcollection error:", err.message);
                }
              );
            }
          } else {
            setOrder(null);
            setTrackingEvents([]);
          }
        } else {
          setOrder(null);
          setTrackingEvents([]);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Order snapshot error:", err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeOrder();
      unsubscribeTracking?.();
    };
  }, [id, user, isAdmin, isVerifier, authLoading]);

  // Fetch live peer student profile for contact phone and verification
  useEffect(() => {
    if (!order || !user) return;
    const peerId = user.uid === order.buyerId ? order.sellerId : order.buyerId;
    if (!peerId) return;

    const fetchPeer = async () => {
      try {
        const snap = await getDoc(doc(db, "users", peerId));
        if (snap.exists()) {
          setPeerProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
      } catch (e) {
        console.warn("[OrderTracking] Peer profile fetch error:", e);
      }
    };
    fetchPeer();
  }, [order, user]);

  const advanceOrderStatus = async (newStatus: OrderStatus, noteText: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    setFeedbackMsg(null);

    try {
      const orderRef = doc(db, "orders", order.id);
      const trackingRef = collection(db, `orders/${order.id}/tracking`);

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await addDoc(trackingRef, {
        status: newStatus,
        note: noteText,
        at: serverTimestamp(),
      });

      setFeedbackMsg(`Order updated to: ${newStatus.replace("_", " ")}`);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setUpdatingStatus(true);

    try {
      const orderRef = doc(db, "orders", order.id);
      const trackingRef = collection(db, `orders/${order.id}/tracking`);

      await updateDoc(orderRef, {
        status: "meetup_scheduled",
        meetupSpot: newMeetupSpot,
        meetupTime: newMeetupTime,
        updatedAt: serverTimestamp(),
      });

      await addDoc(trackingRef, {
        status: "meetup_scheduled",
        note: `Meetup scheduled at ${newMeetupSpot}. Proposed time: ${newMeetupTime}.`,
        at: serverTimestamp(),
      });

      setShowMeetupEdit(false);
      setFeedbackMsg("Meetup spot and schedule updated.");
    } catch (err: any) {
      alert("Failed to schedule meetup: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-modern-text-tertiary">Loading order timeline...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-modern-border rounded-2xl p-8 text-center space-y-4 shadow-modern-sm">
        <AlertCircle className="w-10 h-10 text-modern-error mx-auto" />
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Order Not Accessible</h2>
        <p className="text-xs font-mono text-modern-text-tertiary">You are not an authorized participant for this order.</p>
        <Link href="/orders" className="inline-block px-5 py-2.5 bg-modern-warm text-modern-text-primary border border-modern-border rounded-xl text-xs font-sans font-semibold shadow-modern-sm hover:bg-modern-warm-hover">
          Return to Orders
        </Link>
      </div>
    );
  }

  const isBuyer = user?.uid === order.buyerId;

  // Stages
  const stages: { key: OrderStatus; label: string }[] = [
    { key: "created", label: "Placed" },
    { key: "confirmed", label: "Payment Confirmed" },
    { key: "meetup_scheduled", label: "Meetup Scheduled" },
    { key: "completed", label: "Handover Complete" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === order.status);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-modern-border rounded-xl text-xs font-mono font-bold text-modern-text-primary shadow-modern-sm hover:bg-modern-surface-hover transition"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Orders List</span>
          </Link>

          <Link
            href={`/orders/${order.id}/invoice`}
            className="px-3.5 py-1.5 bg-modern-warm hover:bg-modern-warm-hover border border-modern-border rounded-xl text-xs font-sans font-semibold text-modern-text-primary flex items-center space-x-1.5 shadow-modern-sm active:translate-x-[1px] active:translate-y-[1px] transition"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>View Printable Invoice</span>
          </Link>
        </div>

        {/* Order Header Card */}
        <Card variant="elevated" padding="md" className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-modern-border pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-modern-text-primary tracking-tight">
                  Order #{order.id.slice(0, 8)}
                </h1>
                <Badge
                  variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "secondary" : "warning"}
                  size="sm"
                  className={order.status === "cancelled" ? "!bg-modern-error-light !text-modern-error !border-modern-error/30" : ""}
                >
                  {order.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs font-mono text-modern-text-secondary mt-1">
                Item: <strong className="text-modern-text-primary">{order.listingTitle}</strong> &bull; Amount: <strong className="text-modern-text-primary">₹{order.price.toLocaleString("en-IN")}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-mono text-modern-text-tertiary block">
                {isBuyer ? "Purchased from Seller" : "Sold to Student Buyer"}
              </span>
              <span className="font-sans font-semibold text-sm text-modern-text-primary block">
                {peerProfile?.name || (isBuyer ? order.sellerName : order.buyerName)}
              </span>
              {peerProfile?.course && (
                <span className="text-[11px] font-mono text-modern-text-tertiary block">
                  {peerProfile.course} {peerProfile.year ? `• ${peerProfile.year}` : ""}
                </span>
              )}
              {peerProfile?.phone && (
                <a
                  href={`tel:${peerProfile.phone}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-modern-text-primary underline mt-1"
                  title="Call for handover coordination"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Call {peerProfile.phone}</span>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-modern-bg border border-modern-border">
              <span className="text-xs text-modern-text-tertiary block">Payment method</span>
              <span className="text-sm font-semibold text-modern-text-primary">
                {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI"}
              </span>
              {order.paymentMethod === "upi_sim" && <span className="text-xs text-modern-text-tertiary block">Payment simulator; no real funds are transferred.</span>}
            </div>
            <div className="p-3 rounded-xl bg-modern-bg border border-modern-border">
              <span className="text-xs text-modern-text-tertiary block">Payment status</span>
              <Badge
                variant={order.paymentStatus === "success" ? "success" : order.paymentStatus === "failed" ? "secondary" : "warning"}
                size="xs"
                className={order.paymentStatus === "failed" ? "!bg-modern-error-light !text-modern-error !border-modern-error/30" : ""}
              >
                {order.paymentStatus}
              </Badge>
            </div>
            <div className="p-3 rounded-xl bg-modern-bg border border-modern-border">
              <span className="text-xs text-modern-text-tertiary block">Order placed</span>
              <span className="text-sm font-semibold text-modern-text-primary">{formatOrderDate(order.createdAt)}</span>
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3.5 bg-modern-success-light text-modern-success border border-modern-success/30 text-sm rounded-xl" role="status">
              {feedbackMsg}
            </div>
          )}

          {/* Progress Bar / Milestones */}
          {order.status !== "cancelled" ? (
            <div className="py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {stages.map((stg, i) => {
                  const isDone = currentStageIndex >= i;
                  const isCurrent = currentStageIndex === i;
                  return (
                    <div key={stg.key} className="space-y-1.5">
                      <div
                        className={`h-2.5 rounded-full border border-modern-border transition-all ${
                          isDone ? "bg-modern-success-light" : "bg-modern-surface-hover"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-mono block ${
                          isCurrent
                            ? "font-semibold text-modern-text-primary"
                            : isDone
                            ? "font-bold text-modern-text-primary"
                            : "text-modern-text-tertiary font-medium"
                        }`}
                      >
                        {stg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-modern-error-light border border-modern-border text-modern-error text-xs font-mono font-bold rounded-xl shadow-modern-sm flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-modern-error flex-shrink-0" />
              <span>This order was cancelled. Handover is terminated.</span>
            </div>
          )}
        </Card>

        {/* Handover Meetup Spot & Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left: Handover Spot & Timeline (7 Cols) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Spot Card */}
            <Card variant="default" padding="md" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-sans font-semibold text-base text-modern-text-primary flex items-center space-x-2">
                  <MapPin className="w-4 h-4 stroke-[2.5]" />
                  <span>Campus Meetup Handover Spot</span>
                </h3>
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <button
                    onClick={() => setShowMeetupEdit(!showMeetupEdit)}
                    className="text-xs font-mono font-bold text-modern-text-primary hover:underline"
                  >
                    {showMeetupEdit ? "Close" : "Reschedule Meetup"}
                  </button>
                )}
              </div>

              {!showMeetupEdit ? (
                <div className="p-4 bg-modern-bg rounded-xl border border-modern-border space-y-1">
                  <div className="font-sans font-semibold text-sm text-modern-text-primary">
                    {order.meetupSpot || "No meetup spot confirmed yet."}
                  </div>
                  {order.meetupTime && (
                    <div className="text-xs text-modern-text-secondary flex items-center space-x-1.5 font-mono pt-1">
                      <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{order.meetupTime}</span>
                    </div>
                  )}
                  <p className="text-[10px] font-mono text-modern-text-tertiary mt-1">
                    CCTV-monitored safe university exchange point.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateMeetup} className="p-4 bg-modern-bg rounded-xl border border-modern-border space-y-3">
                  <div>
                    <Select
                      label="Choose Monitored Spot"
                      value={newMeetupSpot}
                      onChange={(e) => setNewMeetupSpot(e.target.value as MeetupSpot)}
                      options={MEETUP_SPOTS.map((spot) => ({ value: spot, label: spot }))}
                    />
                  </div>

                  <div>
                    <Input
                      label="Proposed Time"
                      type="text"
                      required
                      placeholder="e.g. Today at 4:30 PM (after Lab)"
                      value={newMeetupTime}
                      onChange={(e) => setNewMeetupTime(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <Button
                      type="button"
                      onClick={() => setShowMeetupEdit(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updatingStatus}
                      variant="primary"
                      size="sm"
                    >
                      Save Meetup Plan
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* Tracking History Log */}
            <Card variant="default" padding="md" className="space-y-3">
              <h3 className="font-sans font-semibold text-base text-modern-text-primary flex items-center space-x-2">
                <Clock className="w-4 h-4 stroke-[2.5]" />
                <span>Tracking History Timeline</span>
              </h3>

              <div className="divide-y divide-modern-border/70 text-xs">
                {trackingEvents.length === 0 ? (
                  <p className="py-3 text-modern-text-tertiary font-mono italic">No events recorded.</p>
                ) : (
                  trackingEvents.map((evt, idx) => (
                    <div key={idx} className="py-3 flex items-start space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-modern-text-primary stroke-[2.5] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans font-semibold text-modern-text-primary block">
                          {evt.status.replace("_", " ").toUpperCase()}
                        </span>
                        <p className="text-modern-text-secondary font-mono text-xs mt-0.5">{evt.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right: Actions & Return (5 Cols) */}
          <div className="md:col-span-5 space-y-5">
            
            <Card variant="default" padding="md" className="space-y-4">
              <h3 className="font-sans font-semibold text-base text-modern-text-primary">
                Order Status Controls
              </h3>

              {order.status === "created" && (
                <Button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("confirmed", "Payment and handover terms confirmed.")}
                  variant="primary"
                  fullWidth
                >
                  Confirm Order &amp; Agreement
                </Button>
              )}

              {order.status === "meetup_scheduled" && (
                <Button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("completed", "Item inspected and physically handed over at meetup spot.")}
                  variant="success"
                  fullWidth
                >
                  Confirm Physical Handover Complete
                </Button>
              )}

              {order.status !== "completed" && order.status !== "cancelled" && (
                <Button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("cancelled", "Order cancelled by student.")}
                  variant="secondary"
                  className="!bg-modern-error-light !text-modern-error !border-modern-error/30 hover:!bg-modern-error-light"
                  fullWidth
                >
                  Cancel Order
                </Button>
              )}

              {/* Return Request (For Buyer if completed or issues) */}
              {isBuyer && order.status === "completed" && (
                <div className="pt-3 border-t border-modern-border">
                  <Button
                    type="button"
                    onClick={() => setReturnModalOpen(true)}
                    variant="outline"
                    fullWidth
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    <span>Report Issue / Request Return</span>
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Return Modal */}
        <ReturnModal
          orderId={order.id}
          listingTitle={order.listingTitle || "Item"}
          sellerId={order.sellerId}
          isOpen={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          onSuccess={() => {
            setReturnModalOpen(false);
            setFeedbackMsg("Return request submitted for seller & administration review.");
          }}
        />
      </div>
    </RouteGuard>
  );
}

