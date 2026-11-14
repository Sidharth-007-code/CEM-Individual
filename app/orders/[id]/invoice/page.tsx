"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Printer, ChevronLeft, ShieldCheck, Download, AlertCircle } from "lucide-react";

export default function OrderInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Order;
          if (data.buyerId === user.uid || data.sellerId === user.uid || isAdmin) {
            setOrder(data);
          }
        }
      } catch (e) {
        console.warn("Invoice fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, user, isAdmin]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-ink-600">Generating student handover invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <AlertCircle className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Invoice Unavailable</h2>
        <p className="text-xs font-mono text-ink-600">You do not have authorization to view this invoice.</p>
        <Link href="/orders" className="inline-block px-5 py-2.5 bg-brutal-yellow text-black border-2 border-black rounded-xl text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light">
          Return to Orders
        </Link>
      </div>
    );
  }

  const invoiceNumber = order.invoice?.number || `MSRUAS-${new Date().getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="no-print flex justify-between items-center border-b-2 border-black/10 pb-4">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-paper-100 transition"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Order Tracking</span>
          </Link>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-2"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* Printable University Invoice Document */}
        <div className="bg-white border-2 border-black rounded-3xl p-8 sm:p-12 shadow-brutal print:border-none print:shadow-none print:p-0 space-y-8">
          
          {/* Header Masthead */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-sans text-2xl font-black tracking-tight text-black uppercase">
                  Campus Market
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-brutal-yellow text-black rounded-md border border-black shadow-[1px_1px_0px_#000]">
                  RUAS VERIFIED
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-ink-600 mt-1">
                M.S. Ramaiah University of Applied Sciences &bull; Student Exchange Record
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-sans font-black text-xl text-black block tracking-tight">
                OFFICIAL INVOICE
              </span>
              <span className="font-mono text-xs font-black text-ink-800 block mt-0.5">
                {invoiceNumber}
              </span>
              <span className="text-[11px] text-ink-500 font-mono block">
                Issued: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
              </span>
            </div>
          </div>

          {/* Student Parties Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-1">
              <span className="font-sans font-black text-ink-500 uppercase tracking-wider block">
                Buyer (Student):
              </span>
              <span className="font-sans font-black text-base text-black block">
                {order.buyerName}
              </span>
              <span className="text-ink-600 block">
                ID: {order.buyerId.slice(0, 10)}
              </span>
              <span className="text-ink-600 block">
                MSRUAS Enrolled Student
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-sans font-black text-ink-500 uppercase tracking-wider block">
                Seller (Student):
              </span>
              <span className="font-sans font-black text-base text-black block">
                {order.sellerName}
              </span>
              <span className="text-ink-600 block">
                ID: {order.sellerId.slice(0, 10)}
              </span>
              <span className="text-ink-600 block">
                MSRUAS Enrolled Student
              </span>
            </div>
          </div>

          {/* Handover & Payment Info */}
          <div className="p-4 bg-paper-50 rounded-2xl border-2 border-black grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono shadow-[2px_2px_0px_#000]">
            <div>
              <span className="font-sans font-black text-ink-600 block">Designated Meetup Spot:</span>
              <span className="text-black font-bold">{order.meetupSpot || "Main Campus"}</span>
            </div>
            <div>
              <span className="font-sans font-black text-ink-600 block">Payment Method:</span>
              <span className="text-black font-bold">
                {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI (Mocked)"}
              </span>
            </div>
            <div>
              <span className="font-sans font-black text-ink-600 block">Payment Status:</span>
              <span className="text-black font-black uppercase">
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-black font-sans font-black text-black uppercase tracking-wider">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Price (₹)</th>
                  <th className="py-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                <tr>
                  <td className="py-3">
                    <span className="font-sans font-black text-black text-sm block">
                      {order.listingTitle}
                    </span>
                    <span className="text-ink-500 font-mono text-[10px]">
                      Listing Ref: {order.listingId}
                    </span>
                  </td>
                  <td className="py-3 text-center font-mono font-bold">1</td>
                  <td className="py-3 text-right font-mono font-bold">₹{order.price.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right font-mono font-black">₹{order.price.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-sans font-black text-sm">
                  <td colSpan={3} className="py-4 text-right">Total Exchange Amount:</td>
                  <td className="py-4 text-right font-mono font-black text-lg text-black">
                    ₹{order.price.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Compliance & Student Notice */}
          <div className="border-t-2 border-black/10 pt-6 text-[11px] font-mono text-ink-600 leading-relaxed space-y-1">
            <p className="font-sans font-black text-black">MSRUAS Academic Fair-Trade Compliance</p>
            <p>
              This document serves as an academic proof of peer-to-peer textbook and resource exchange.
              Neither the university nor the course coordinators charge platform fees or act as escrow holders.
              All physical handovers must occur within designated campus CCTV zones.
            </p>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}

