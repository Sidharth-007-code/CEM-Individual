"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { doc, getDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/types/listing";
import { PaymentMethod, PaymentStatus } from "@/types/order";
import { MEETUP_SPOTS, MeetupSpot } from "@/lib/constants";
import { createOrderTransaction } from "@/lib/orders";
import { UpiModal } from "@/components/checkout/UpiModal";
import { MockBadge } from "@/components/ui/MockBadge";
import {
  ShieldCheck,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checkout Options
  const [meetupSpot, setMeetupSpot] = useState<MeetupSpot>(MEETUP_SPOTS[0]);
  const [meetupTime, setMeetupTime] = useState("Tomorrow between 1:00 PM - 2:00 PM");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi_sim");

  // UPI Simulation Modal
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      try {
        const snap = await getDoc(doc(db, "listings", id));
        if (snap.exists()) {
          setListing({ id: snap.id, ...snap.data() } as Listing);
        } else {
          setListing(null);
        }
      } catch (e: any) {
        setError("Error loading listing details: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const executeOrderCreation = async (method: PaymentMethod, payStatus: PaymentStatus) => {
    if (!user || !listing) return;
    setProcessingOrder(true);
    setError(null);

    try {
      const orderId = await createOrderTransaction(db, {
        listingId: listing.id,
        listingTitle: listing.title,
        buyerId: user.uid,
        buyerName: profile?.name || "Student Buyer",
        sellerId: listing.sellerId,
        sellerName: listing.sellerName || "Student Seller",
        price: listing.price,
        paymentMethod: method,
        paymentStatus: payStatus,
        meetupSpot,
      });

      // Send in-app notification to seller
      const notifRef = doc(collection(db, `notifications/${listing.sellerId}/items`));
      await setDoc(notifRef, {
        id: notifRef.id,
        type: "order",
        text: `New order placed for "${listing.title}" by ${profile?.name || "Student"}. Meetup spot: ${meetupSpot}.`,
        link: `/orders/${orderId}`,
        read: false,
        createdAt: serverTimestamp(),
      });

      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      console.error("[Order creation error]:", err);
      setError(err.message || "Failed to create order.");
      setProcessingOrder(false);
    }
  };

  const handleProceedToPayment = () => {
    if (paymentMethod === "upi_sim") {
      setUpiModalOpen(true);
    } else {
      // Cash at Meetup
      executeOrderCreation("cash", "pending");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-ink-600">Preparing secure order checkout...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <AlertCircle className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Item Not Found</h2>
        <p className="text-xs font-mono text-ink-600">This listing may have been removed or updated.</p>
        <Link href="/browse" className="inline-block px-5 py-2.5 bg-brutal-yellow text-black border-2 border-black rounded-xl text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light">
          Return to Notice Board
        </Link>
      </div>
    );
  }

  if (listing.status !== "available") {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <AlertCircle className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Item No Longer Available</h2>
        <p className="text-xs font-mono text-ink-600 leading-relaxed">
          Another student has already purchased this item. Campus Marketplace guarantees single-sale exclusivity.
        </p>
        <Link href="/browse" className="inline-block px-5 py-2.5 bg-brutal-yellow text-black border-2 border-black rounded-xl text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light">
          Find Other Items
        </Link>
      </div>
    );
  }

  if (user?.uid === listing.sellerId) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <AlertCircle className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Self-Purchase Restricted</h2>
        <p className="text-xs font-mono text-ink-600">Sellers cannot buy their own listings.</p>
        <Link href="/dashboard" className="inline-block px-5 py-2.5 bg-brutal-yellow text-black border-2 border-black rounded-xl text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Breadcrumb */}
        <Link
          href={`/listings/${listing.id}`}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-paper-100 transition"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back to Listing</span>
        </Link>

        <div className="border-b-2 border-black/10 pb-4">
          <div className="flex items-center space-x-3">
            <h1 className="font-sans text-3xl font-black text-black tracking-tight">
              Order Checkout
            </h1>
            <span className="px-2.5 py-1 bg-brutal-green text-black font-mono font-black text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
              Atomic Single-Sale
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-ink-600 mt-1">
            Choose a safe campus meetup location and select your preferred payment method.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-admin-50 border-2 border-black text-admin-900 text-xs font-mono font-bold rounded-2xl shadow-[3px_3px_0px_#000] flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Order Details & Choices (7 Cols) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Meetup Spot Card */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 space-y-4 shadow-brutal">
              <h3 className="font-sans font-black text-base text-black flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Verified Campus Meetup Spot</span>
              </h3>
              <p className="text-xs font-mono text-ink-600">
                To guarantee student safety, handovers are restricted to designated, monitored public campus areas.
              </p>

              <div>
                <label className="block text-xs font-sans font-black text-black uppercase tracking-wider mb-1.5">
                  Select Safe Location
                </label>
                <select
                  value={meetupSpot}
                  onChange={(e) => setMeetupSpot(e.target.value as MeetupSpot)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000] focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
                >
                  {MEETUP_SPOTS.map((spot) => (
                    <option key={spot} value={spot}>
                      {spot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-sans font-black text-black uppercase tracking-wider mb-1.5">
                  Proposed Meetup Window
                </label>
                <input
                  type="text"
                  value={meetupTime}
                  onChange={(e) => setMeetupTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl font-mono text-xs font-bold text-black shadow-[2px_2px_0px_#000] focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
                />
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 space-y-4 shadow-brutal">
              <h3 className="font-sans font-black text-base text-black flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Select Payment Agreement</span>
              </h3>

              <div className="space-y-3 pt-1">
                <label
                  onClick={() => setPaymentMethod("upi_sim")}
                  className={`p-4 rounded-xl border-2 border-black cursor-pointer flex items-start space-x-3 transition ${
                    paymentMethod === "upi_sim"
                      ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                      : "bg-white text-black hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "upi_sim"}
                    onChange={() => setPaymentMethod("upi_sim")}
                    className="mt-1 accent-black"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-sans font-black text-xs text-black">
                        Simulated UPI Payment
                      </span>
                      <span className="px-1.5 py-0.2 bg-white text-black font-mono text-[9px] font-bold rounded border border-black">
                        Mocked
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-ink-800 mt-1">
                      Interactive test screen demonstrating success and failure handling with mock QR.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-4 rounded-xl border-2 border-black cursor-pointer flex items-start space-x-3 transition ${
                    paymentMethod === "cash"
                      ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                      : "bg-white text-black hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="mt-1 accent-black"
                  />
                  <div className="flex-1">
                    <span className="font-sans font-black text-xs text-black flex items-center space-x-1.5">
                      <Banknote className="w-3.5 h-3.5 text-black" />
                      <span>Cash at Meetup</span>
                    </span>
                    <p className="text-[11px] font-mono text-ink-800 mt-1">
                      Pay cash directly to the student seller when inspecting the item at the meetup spot.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Item Summary & Confirmation (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 space-y-4 shadow-brutal">
              <h3 className="font-sans font-black text-base text-black">
                Item Summary
              </h3>

              <div className="flex items-start space-x-3 pb-4 border-b-2 border-black/10">
                {listing.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.thumbnail}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-paper-200 border-2 border-black flex items-center justify-center text-xs font-mono text-ink-600">
                    No Pic
                  </div>
                )}
                <div>
                  <h4 className="font-sans font-black text-xs text-black line-clamp-2">
                    {listing.title}
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-ink-600 block mt-0.5">
                    {listing.category}
                  </span>
                  <span className="text-[10px] text-ink-500 font-mono">
                    Seller: {listing.sellerName || "Student"}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-ink-700">
                  <span>Item Asking Price</span>
                  <span className="font-black text-black">₹{listing.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-ink-700">
                  <span>Campus Platform Fee</span>
                  <span className="text-brutal-green font-black">₹0.00 (Free Academic)</span>
                </div>
                <div className="pt-2.5 border-t-2 border-black/10 flex justify-between text-sm font-sans font-black text-black">
                  <span>Total Amount</span>
                  <span className="font-mono text-black text-lg">₹{listing.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Final Confirm Button */}
              <button
                type="button"
                disabled={processingOrder}
                onClick={handleProceedToPayment}
                className="w-full mt-4 py-3.5 px-4 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {processingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Atomic Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {paymentMethod === "upi_sim"
                        ? "Continue to UPI Simulator"
                        : "Confirm Cash Order"}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Simulated UPI Modal */}
        <UpiModal
          amount={listing.price}
          listingTitle={listing.title}
          isOpen={upiModalOpen}
          onClose={() => setUpiModalOpen(false)}
          onSuccess={() => {
            setUpiModalOpen(false);
            executeOrderCreation("upi_sim", "success");
          }}
          onFailure={() => {
            // Failed simulated payment keeps order unconfirmed
          }}
        />
      </div>
    </RouteGuard>
  );
}

