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
        <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-serif text-ink-600">Generating student handover invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-paper-100 border border-ink-200 rounded-notice p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-admin-600 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ink-950">Invoice Unavailable</h2>
        <p className="text-xs text-ink-600">You do not have authorization to view this invoice.</p>
        <Link href="/orders" className="inline-block px-4 py-2 bg-ink-950 text-paper-50 rounded text-xs font-serif font-bold">
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
        <div className="no-print flex justify-between items-center border-b border-ink-200 pb-4">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center space-x-1 text-xs font-medium text-ink-600 hover:text-ink-950"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Order Tracking</span>
          </Link>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-ink-950 hover:bg-ink-900 text-paper-50 text-xs font-serif font-bold rounded-notice shadow-sm transition flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        {/* Printable University Invoice Document */}
        <div className="bg-white border border-ink-200 rounded-notice p-8 sm:p-12 shadow-card print:border-none print:shadow-none print:p-0 space-y-8">
          
          {/* Header Masthead */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-ink-950 pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-2xl font-black tracking-tight text-ink-950">
                  CAMPUS<span className="text-saffron-600 font-sans font-light">MARKET</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-paper-200 text-ink-800 rounded border border-ink-300">
                  RUAS Verified
                </span>
              </div>
              <p className="text-xs text-ink-600 mt-1">
                M.S. Ramaiah University of Applied Sciences &bull; Student Exchange Record
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-serif font-black text-xl text-ink-950 block">
                OFFICIAL INVOICE
              </span>
              <span className="font-mono text-xs text-ink-600 block mt-0.5">
                {invoiceNumber}
              </span>
              <span className="text-[11px] text-ink-500 font-mono block">
                Issued: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
              </span>
            </div>
          </div>

          {/* Student Parties Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="font-serif font-bold text-ink-500 uppercase tracking-wider block">
                Buyer (Student):
              </span>
              <span className="font-serif font-bold text-sm text-ink-950 block">
                {order.buyerName}
              </span>
              <span className="text-ink-600 font-mono block">
                ID: {order.buyerId.slice(0, 10)}
              </span>
              <span className="text-ink-600 block">
                MSRUAS Enrolled Student
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-serif font-bold text-ink-500 uppercase tracking-wider block">
                Seller (Student):
              </span>
              <span className="font-serif font-bold text-sm text-ink-950 block">
                {order.sellerName}
              </span>
              <span className="text-ink-600 font-mono block">
                ID: {order.sellerId.slice(0, 10)}
              </span>
              <span className="text-ink-600 block">
                MSRUAS Enrolled Student
              </span>
            </div>
          </div>

          {/* Handover & Payment Info */}
          <div className="p-4 bg-paper-100 rounded border border-ink-200 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-serif font-bold text-ink-600 block">Designated Meetup Spot:</span>
              <span className="text-ink-950 font-medium">{order.meetupSpot || "Main Campus"}</span>
            </div>
            <div>
              <span className="font-serif font-bold text-ink-600 block">Payment Method:</span>
              <span className="text-ink-950 font-medium">
                {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI (Mocked)"}
              </span>
            </div>
            <div>
              <span className="font-serif font-bold text-ink-600 block">Payment Status:</span>
              <span className="text-verifier-800 font-bold uppercase font-mono">
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-ink-300 font-serif font-bold text-ink-800 uppercase tracking-wider">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Price (₹)</th>
                  <th className="py-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                <tr>
                  <td className="py-3">
                    <span className="font-serif font-bold text-ink-950 text-sm block">
                      {order.listingTitle}
                    </span>
                    <span className="text-ink-500 font-mono text-[10px]">
                      Listing Ref: {order.listingId}
                    </span>
                  </td>
                  <td className="py-3 text-center font-mono">1</td>
                  <td className="py-3 text-right font-mono">₹{order.price.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right font-mono font-bold">₹{order.price.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-950 font-serif font-black text-sm">
                  <td colSpan={3} className="py-4 text-right">Total Exchange Amount:</td>
                  <td className="py-4 text-right font-mono text-base text-ink-950">
                    ₹{order.price.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Compliance & Student Notice */}
          <div className="border-t border-ink-200 pt-6 text-[11px] text-ink-500 leading-relaxed space-y-1">
            <p className="font-bold text-ink-700">MSRUAS Academic Fair-Trade Compliance</p>
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

