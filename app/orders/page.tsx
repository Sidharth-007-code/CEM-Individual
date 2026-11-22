"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types/order";
import { Package, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import { Badge, Card } from "@/components/ui";

function formatOrderDate(timestamp: any) {
  const date = timestamp?.toDate?.();
  return date ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date) : "Date unavailable";
}

export default function OrdersListPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ordersRef = collection(db, "orders");
    const qBuyer = query(ordersRef, where("buyerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      qBuyer,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Order[];
        setOrders(items);
        setLoading(false);
      },
      (err) => {
        console.warn("Orders fetch warning:", err.message);
        setLoadError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Banner - Neo-Brutalist Layout */}
        <Card variant="elevated" padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-modern-primary-light border border-modern-border flex items-center justify-center">
                <Package className="w-5 h-5 text-modern-primary" />
              </div>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-modern-text-primary tracking-tight">
                  My Orders &amp; Handover Tracking
                </h1>
                <p className="text-sm text-modern-text-secondary mt-0.5">
                  MSRUAS Safe Peer Handovers &bull; CCTV Meetup Points
                </p>
              </div>
            </div>
          </div>

          <Badge variant="primary" size="md">
            {orders.length} Handover Records
          </Badge>
        </Card>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-modern-text-secondary">Loading order records...</p>
          </div>
        ) : loadError ? (
          <Card variant="default" padding="lg" className="text-center space-y-3" role="alert">
            <Package className="w-9 h-9 text-modern-error mx-auto" />
            <h2 className="font-semibold text-modern-text-primary">Orders could not be loaded</h2>
            <p className="text-sm text-modern-text-secondary">Please refresh the page to reconnect to your order records.</p>
          </Card>
        ) : orders.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center space-y-4">
            <div className="w-14 h-14 bg-modern-primary-light border border-modern-border rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7 text-modern-primary" />
            </div>
            <h3 className="font-sans text-xl font-semibold text-modern-text-primary">
              No Orders Placed Yet
            </h3>
            <p className="text-sm text-modern-text-secondary max-w-sm mx-auto">
              You haven&apos;t placed any campus orders yet. Explore the verified notice board to buy study materials and lab gear.
            </p>
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 bg-modern-primary hover:bg-modern-primary-hover text-white font-semibold rounded-xl border border-modern-primary shadow-modern-sm transition-colors">
              <span>Browse Notice Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white border border-modern-border rounded-2xl p-5 shadow-modern-sm hover:shadow-modern-lg hover:border-modern-primary/30 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modern-primary"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-sans font-semibold text-base text-modern-text-primary group-hover:text-modern-primary transition-colors">
                        {order.listingTitle || "Campus Item"}
                      </span>
                      <Badge
                        variant={order.status === "completed" ? "success" : order.status === "cancelled" ? "secondary" : "warning"}
                        size="xs"
                        className={order.status === "cancelled" ? "!bg-modern-error-light !text-modern-error !border-modern-error/30" : ""}
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="text-xs font-mono font-semibold text-modern-text-tertiary">
                      Order ID: <span className="text-modern-text-primary font-bold">#{order.id.slice(0, 8)}</span> &bull; Meetup Spot: <strong className="text-modern-text-primary">{order.meetupSpot || "CCTV Safe Zone"}</strong>
                    </p>
                    <p className="text-[11px] text-modern-text-tertiary font-mono">
                      Seller: {order.sellerName || "Student Seller"} &bull; {formatOrderDate(order.createdAt)}
                    </p>
                    <p className="text-[11px] text-modern-text-tertiary font-mono">
                      Payment: {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI"} &bull; {order.paymentStatus}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-modern-border/70">
                    <div className="font-sans text-2xl font-semibold text-modern-text-primary">
                      ₹{order.price.toLocaleString("en-IN")}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-modern-surface-hover group-hover:bg-modern-warm border border-modern-border flex items-center justify-center transition shadow-modern-sm">
                      <ChevronRight className="w-4 h-4 text-modern-text-primary group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
