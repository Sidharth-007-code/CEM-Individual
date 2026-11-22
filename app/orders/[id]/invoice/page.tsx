"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order } from "@/types/order";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Printer, ChevronLeft, AlertCircle } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

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
        <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-modern-text-tertiary">Generating student handover invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <Card variant="default" padding="lg" className="max-w-md mx-auto my-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-modern-error mx-auto" />
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Invoice Unavailable</h2>
        <p className="text-xs font-mono text-modern-text-tertiary">You do not have authorization to view this invoice.</p>
        <Link href="/orders" className="inline-flex px-5 py-2.5 bg-modern-primary hover:bg-modern-primary-hover text-white rounded-xl text-sm font-semibold shadow-modern-sm transition-colors">
          Return to Orders
        </Link>
      </Card>
    );
  }

  const invoiceNumber = order.invoice?.number || `MSRUAS-${new Date().getFullYear()}-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="no-print flex justify-between items-center border-b border-modern-border pb-4 gap-3">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-modern-border rounded-xl text-xs font-mono font-bold text-modern-text-primary shadow-modern-sm hover:bg-modern-surface-hover transition"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Order Tracking</span>
          </Link>

          <Button
            onClick={handlePrint}
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
          >
            <span>Print / Save as PDF</span>
          </Button>
        </div>

        {/* Printable University Invoice Document */}
        <div className="bg-white border border-modern-border rounded-2xl p-6 sm:p-10 shadow-modern-sm print:border-none print:shadow-none print:p-0 print:rounded-none print:space-y-6 space-y-8">
          
          {/* Header Masthead */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-modern-border pb-6 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-sans text-2xl font-semibold tracking-tight text-modern-text-primary uppercase">
                  Campus Market
                </span>
                <Badge variant="warm" size="xs">
                  RUAS VERIFIED
                </Badge>
              </div>
              <p className="text-xs font-mono font-bold text-modern-text-tertiary mt-1">
                M.S. Ramaiah University of Applied Sciences &bull; Student Exchange Record
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-sans font-semibold text-xl text-modern-text-primary block tracking-tight">
                OFFICIAL INVOICE
              </span>
              <span className="font-mono text-xs font-semibold text-modern-text-secondary block mt-0.5">
                {invoiceNumber}
              </span>
              <span className="text-[11px] text-modern-text-tertiary font-mono block">
                Issued: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
              </span>
            </div>
          </div>

          {/* Student Parties Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs font-mono">
            <div className="space-y-1">
              <span className="font-sans font-semibold text-modern-text-tertiary uppercase tracking-wider block">
                Buyer (Student):
              </span>
              <span className="font-sans font-semibold text-base text-modern-text-primary block">
                {order.buyerName}
              </span>
              <span className="text-modern-text-tertiary block">
                ID: {order.buyerId.slice(0, 10)}
              </span>
              <span className="text-modern-text-tertiary block">
                MSRUAS Enrolled Student
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-sans font-semibold text-modern-text-tertiary uppercase tracking-wider block">
                Seller (Student):
              </span>
              <span className="font-sans font-semibold text-base text-modern-text-primary block">
                {order.sellerName}
              </span>
              <span className="text-modern-text-tertiary block">
                ID: {order.sellerId.slice(0, 10)}
              </span>
              <span className="text-modern-text-tertiary block">
                MSRUAS Enrolled Student
              </span>
            </div>
          </div>

          {/* Handover & Payment Info */}
          <div className="p-4 bg-modern-bg rounded-2xl border border-modern-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono shadow-modern-sm">
            <div>
              <span className="font-sans font-semibold text-modern-text-tertiary block">Designated Meetup Spot:</span>
              <span className="text-modern-text-primary font-bold">{order.meetupSpot || "Main Campus"}</span>
            </div>
            <div>
              <span className="font-sans font-semibold text-modern-text-tertiary block">Payment Method:</span>
              <span className="text-modern-text-primary font-bold">
                {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI (Mocked)"}
              </span>
            </div>
            <div>
              <span className="font-sans font-semibold text-modern-text-tertiary block">Payment Status:</span>
              <Badge
                variant={order.paymentStatus === "success" ? "success" : order.paymentStatus === "failed" ? "secondary" : "warning"}
                size="xs"
                className={order.paymentStatus === "failed" ? "!bg-modern-error-light !text-modern-error !border-modern-error/30" : ""}
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-modern-border font-sans font-semibold text-modern-text-primary uppercase tracking-wider">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Price (₹)</th>
                  <th className="py-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-modern-border/70">
                <tr>
                  <td className="py-3">
                    <span className="font-sans font-semibold text-modern-text-primary text-sm block">
                      {order.listingTitle}
                    </span>
                    <span className="text-modern-text-tertiary font-mono text-[10px]">
                      Listing Ref: {order.listingId}
                    </span>
                  </td>
                  <td className="py-3 text-center font-mono font-bold">1</td>
                  <td className="py-3 text-right font-mono font-bold">₹{order.price.toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right font-mono font-semibold">₹{order.price.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-modern-border font-sans font-semibold text-sm">
                  <td colSpan={3} className="py-4 text-right">Total Exchange Amount:</td>
                  <td className="py-4 text-right font-mono font-semibold text-lg text-modern-text-primary">
                    ₹{order.price.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Compliance & Student Notice */}
          <div className="border-t border-modern-border pt-6 text-[11px] font-mono text-modern-text-tertiary leading-relaxed space-y-1">
            <p className="font-sans font-semibold text-modern-text-primary">MSRUAS Academic Fair-Trade Compliance</p>
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

