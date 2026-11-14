"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types/order";
import { Package, Clock, CheckCircle2, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";

export default function OrdersListPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Banner - Neo-Brutalist Layout */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-grid-pattern">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                <Package className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  My Orders &amp; Handover Tracking
                </h1>
                <p className="text-xs font-mono font-bold text-ink-600 mt-0.5">
                  MSRUAS Safe Peer Handovers &bull; CCTV Meetup Points
                </p>
              </div>
            </div>
          </div>

          <span className="px-3.5 py-1.5 bg-brutal-purple-light text-brutal-purple-dark text-xs font-mono font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
            {orders.length} Handover Records
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto shadow-[2px_2px_0px_#000]" />
            <p className="text-xs font-mono font-bold text-ink-600">Loading order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-3xl p-12 text-center space-y-4 shadow-brutal">
            <div className="w-14 h-14 bg-brutal-yellow border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
              <ShoppingBag className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-sans text-xl font-black text-black">
              No Orders Placed Yet
            </h3>
            <p className="text-xs font-semibold text-ink-600 max-w-sm mx-auto">
              You haven&apos;t placed any campus orders yet. Explore the verified notice board to buy study materials and lab gear.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <span>Browse Notice Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white border-2 border-black rounded-2xl p-5 shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] transition-all group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-sans font-black text-base text-black group-hover:text-brutal-purple-dark transition-colors">
                        {order.listingTitle || "Campus Item"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-mono font-black rounded-md border-2 border-black uppercase shadow-[1px_1px_0px_#000] ${
                          order.status === "completed"
                            ? "bg-brutal-green text-black"
                            : order.status === "cancelled"
                            ? "bg-brutal-pink text-black"
                            : "bg-brutal-yellow text-black"
                        }`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs font-mono font-semibold text-ink-600">
                      Order ID: <span className="text-black font-bold">#{order.id.slice(0, 8)}</span> &bull; Meetup Spot: <strong className="text-black">{order.meetupSpot || "CCTV Safe Zone"}</strong>
                    </p>
                    <p className="text-[11px] text-ink-600 font-mono">
                      Payment: {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI"} &bull; {order.paymentStatus}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-black/10">
                    <div className="font-sans text-2xl font-black text-black">
                      ₹{order.price.toLocaleString("en-IN")}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-paper-100 group-hover:bg-brutal-yellow border-2 border-black flex items-center justify-center transition shadow-[1px_1px_0px_#000]">
                      <ChevronRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition" />
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
