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
import { DEMO_LISTINGS_BY_ID, isDemoListing } from "@/lib/demoListings";
import { UpiModal } from "@/components/checkout/UpiModal";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import {
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ArrowRight,
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
        const demoListing = DEMO_LISTINGS_BY_ID[id];
        if (demoListing) {
          setListing(demoListing);
          return;
        }
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
    if (isDemoListing(listing)) {
      setError("Demo items are read-only previews and cannot be checked out.");
      return;
    }
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
        senderId: user.uid,
        type: "order",
        text: `New order placed for "${listing.title}" by ${profile?.name || "Student"}. Meetup spot: ${meetupSpot}.`,
        link: `/orders/${orderId}`,
        orderId: orderId,
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
        <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-modern-text-tertiary">Preparing secure order checkout...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-modern-border rounded-2xl p-8 text-center space-y-4 shadow-modern-sm">
        <AlertCircle className="w-10 h-10 text-modern-error mx-auto" />
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Item Not Found</h2>
        <p className="text-xs font-mono text-modern-text-tertiary">This listing may have been removed or updated.</p>
        <Link href="/browse" className="inline-block px-5 py-2.5 bg-modern-warm text-modern-text-primary border border-modern-border rounded-xl text-xs font-sans font-semibold shadow-modern-sm hover:bg-modern-warm-hover">
          Return to Notice Board
        </Link>
      </div>
    );
  }

  if (isDemoListing(listing)) {
    return (
      <Card variant="outlined" padding="lg" className="max-w-lg mx-auto my-12 text-center space-y-4">
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Checkout Unavailable</h2>
        <p className="text-sm text-modern-text-secondary">
          This read-only preview cannot be purchased. No order or Firestore listing will be created.
        </p>
        <Link href="/browse" className="inline-block px-5 py-2.5 bg-modern-warm text-modern-text-primary border border-modern-border rounded-xl text-xs font-sans font-semibold shadow-modern-sm hover:bg-modern-warm-hover">
          Return to Notice Board
        </Link>
      </Card>
    );
  }

  if (listing.status !== "available") {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-modern-border rounded-2xl p-8 text-center space-y-4 shadow-modern-sm">
        <AlertCircle className="w-10 h-10 text-modern-error mx-auto" />
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Item No Longer Available</h2>
        <p className="text-xs font-mono text-modern-text-tertiary leading-relaxed">
          Another student has already purchased this item. Campus Marketplace guarantees single-sale exclusivity.
        </p>
        <Link href="/browse" className="inline-block px-5 py-2.5 bg-modern-warm text-modern-text-primary border border-modern-border rounded-xl text-xs font-sans font-semibold shadow-modern-sm hover:bg-modern-warm-hover">
          Find Other Items
        </Link>
      </div>
    );
  }

  if (user?.uid === listing.sellerId) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-modern-border rounded-2xl p-8 text-center space-y-4 shadow-modern-sm">
        <AlertCircle className="w-10 h-10 text-modern-error mx-auto" />
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Self-Purchase Restricted</h2>
        <p className="text-xs font-mono text-modern-text-tertiary">Sellers cannot buy their own listings.</p>
        <Link href="/dashboard" className="inline-block px-5 py-2.5 bg-modern-warm text-modern-text-primary border border-modern-border rounded-xl text-xs font-sans font-semibold shadow-modern-sm hover:bg-modern-warm-hover">
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
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-modern-border rounded-xl text-xs font-mono font-bold text-modern-text-primary shadow-modern-sm hover:bg-modern-surface-hover transition"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back to Listing</span>
        </Link>

        <div className="border-b border-modern-border pb-4">
          <div className="flex items-center space-x-3">
            <h1 className="font-sans text-3xl font-semibold text-modern-text-primary tracking-tight">
              Order Checkout
            </h1>
            <Badge variant="success" size="sm">
              Atomic Single-Sale
            </Badge>
          </div>
          <p className="text-xs font-mono font-bold text-modern-text-tertiary mt-1">
            Choose a safe campus meetup location and select your preferred payment method.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-modern-error-light border border-modern-border text-modern-error text-sm rounded-2xl flex items-start space-x-2.5" role="alert">
            <AlertCircle className="w-4 h-4 text-modern-error flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Order Details & Choices (7 Cols) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Meetup Spot Card */}
            <Card variant="default" padding="md" className="space-y-4">
              <h3 className="font-sans font-semibold text-base text-modern-text-primary flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-modern-text-primary stroke-[2.5]" />
                <span>Verified Campus Meetup Spot</span>
              </h3>
              <p className="text-xs font-mono text-modern-text-tertiary">
                To guarantee student safety, handovers are restricted to designated, monitored public campus areas.
              </p>

              <div>
                <Select
                  label="Select Safe Location"
                  value={meetupSpot}
                  onChange={(e) => setMeetupSpot(e.target.value as MeetupSpot)}
                  options={MEETUP_SPOTS.map((spot) => ({ value: spot, label: spot }))}
                />
              </div>

              <div>
                <Input
                  label="Proposed Meetup Window"
                  type="text"
                  value={meetupTime}
                  onChange={(e) => setMeetupTime(e.target.value)}
                />
              </div>
            </Card>

            {/* Payment Method Card */}
            <Card variant="default" padding="md" className="space-y-4">
              <h3 className="font-sans font-semibold text-base text-modern-text-primary flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-modern-text-primary stroke-[2.5]" />
                <span>Select Payment Agreement</span>
              </h3>

              <div className="space-y-3 pt-1">
                <label
                  onClick={() => setPaymentMethod("upi_sim")}
                  className={`p-4 rounded-xl border border-modern-border cursor-pointer flex items-start space-x-3 transition ${
                    paymentMethod === "upi_sim"
                      ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                      : "bg-white text-modern-text-primary hover:bg-modern-surface-hover shadow-modern-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "upi_sim"}
                    onChange={() => setPaymentMethod("upi_sim")}
                    className="mt-1 accent-modern-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-sans font-semibold text-xs text-modern-text-primary">
                        Simulated UPI Payment
                      </span>
                      <Badge variant="warm" size="xs">
                        Mocked
                      </Badge>
                    </div>
                    <p className="text-[11px] font-mono text-modern-text-secondary mt-1">
                      Interactive test screen demonstrating success and failure handling with mock QR.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-4 rounded-xl border border-modern-border cursor-pointer flex items-start space-x-3 transition ${
                    paymentMethod === "cash"
                      ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                      : "bg-white text-modern-text-primary hover:bg-modern-surface-hover shadow-modern-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="mt-1 accent-modern-primary"
                  />
                  <div className="flex-1">
                    <span className="font-sans font-semibold text-xs text-modern-text-primary flex items-center space-x-1.5">
                      <Banknote className="w-3.5 h-3.5 text-modern-text-primary" />
                      <span>Cash at Meetup</span>
                    </span>
                    <p className="text-[11px] font-mono text-modern-text-secondary mt-1">
                      Pay cash directly to the student seller when inspecting the item at the meetup spot.
                    </p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Item Summary & Confirmation (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <Card variant="elevated" padding="md" className="space-y-4">
              <h3 className="font-sans font-semibold text-base text-modern-text-primary">
                Item Summary
              </h3>

              <div className="flex items-start space-x-3 pb-4 border-b border-modern-border">
                {listing.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.thumbnail}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border border-modern-border shadow-modern-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-modern-surface-hover border border-modern-border flex items-center justify-center text-xs font-mono text-modern-text-tertiary">
                    No Pic
                  </div>
                )}
                <div>
                  <h4 className="font-sans font-semibold text-xs text-modern-text-primary line-clamp-2">
                    {listing.title}
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-modern-text-tertiary block mt-0.5">
                    {listing.category}
                  </span>
                  <span className="text-[10px] text-modern-text-tertiary font-mono">
                    Seller: {listing.sellerName || "Student"}
                  </span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-modern-text-secondary">
                  <span>Item Asking Price</span>
                  <span className="font-semibold text-modern-text-primary">₹{listing.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-modern-text-secondary">
                  <span>Campus Platform Fee</span>
                  <span className="text-modern-success font-semibold">₹0.00 (Free Academic)</span>
                </div>
                <div className="pt-2.5 border-t border-modern-border flex justify-between text-sm font-sans font-semibold text-modern-text-primary">
                  <span>Total Amount</span>
                  <span className="font-mono text-modern-text-primary text-lg">₹{listing.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Final Confirm Button */}
              <Button
                type="button"
                disabled={processingOrder}
                onClick={handleProceedToPayment}
                variant="warm"
                size="lg"
                fullWidth
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
              </Button>
            </Card>
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

