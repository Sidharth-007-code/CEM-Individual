"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types/order";
import { Package, Clock, CheckCircle2, ChevronRight, ShoppingBag } from "lucide-react";

export default function OrdersListPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const ordersRef = collection(db, "orders");
    // Listen to orders where user is either buyer or seller
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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="border-b border-ink-200 pb-3">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-saffron-600" />
            <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
              My Orders &amp; Handover Tracking
            </h1>
          </div>
          <p className="text-xs text-ink-600 mt-1">
            Track meetup schedules, inspect item invoices, and confirm receipt.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-serif text-ink-600">Loading order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-12 text-center space-y-3">
            <ShoppingBag className="w-8 h-8 text-ink-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-ink-950">
              No Orders Found
            </h3>
            <p className="text-xs text-ink-600 max-w-sm mx-auto">
              You haven&apos;t placed any campus orders yet. Explore the verified notice board to buy study materials.
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-ink-950 text-paper-50 text-xs font-serif font-bold rounded-notice shadow-sm"
            >
              Browse Notice Board
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-paper-100 border border-ink-200 hover:border-ink-300 rounded-notice p-4 shadow-card hover:shadow-card-hover transition group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-serif font-bold text-sm text-ink-950">
                        {order.listingTitle || "Campus Item"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                          order.status === "completed"
                            ? "bg-verifier-100 text-verifier-800 border border-verifier-600/30"
                            : order.status === "cancelled"
                            ? "bg-admin-100 text-admin-800 border border-admin-600/30"
                            : "bg-saffron-100 text-saffron-800 border border-saffron-300"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-ink-600">
                      Order ID: <span className="font-mono">{order.id.slice(0, 8)}</span> &bull; Meetup Spot: {order.meetupSpot}
                    </p>
                    <p className="text-[11px] text-ink-500 font-mono">
                      Payment: {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI"} ({order.paymentStatus})
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-ink-100">
                    <div className="font-serif text-lg font-black text-ink-950">
                      ₹{order.price.toLocaleString("en-IN")}
                    </div>
                    <ChevronRight className="w-5 h-5 text-ink-400 group-hover:text-ink-900 group-hover:translate-x-1 transition" />
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

