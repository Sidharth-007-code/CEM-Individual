"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, onSnapshot, setDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing, ListingImage } from "@/types/listing";
import { UserProfile } from "@/types/user";
import { PRESET_AVATARS } from "@/lib/constants";
import { validateListingAI, getSimilarListingsAI } from "@/lib/ai";
import { useAuth } from "@/context/AuthContext";
import { ReportModal } from "@/components/listings/ReportModal";
import { ListingCard } from "@/components/listings/ListingCard";
import {
  Phone,
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  Heart,
  Flag,
  ChevronLeft,
  Calendar,
  User,
  Tag,
  AlertCircle,
  GraduationCap,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [otherListings, setOtherListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!id) return;
    const listingRef = doc(db, "listings", id);

    const unsubscribe = onSnapshot(
      listingRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        } else {
          setListing(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Fetch error:", err.message);
        setLoading(false);
      }
    );

    // Fetch images subcollection
    const fetchImages = async () => {
      try {
        const snap = await getDocs(collection(db, `listings/${id}/images`));
        const imgs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ListingImage[];
        setImages(imgs);
      } catch (e) {
        console.warn("Subcollection images read error:", e);
      }
    };

    fetchImages();
    return () => unsubscribe();
  }, [id]);

  // Check wishlist
  useEffect(() => {
    if (!user || !id) return;
    const checkWish = async () => {
      try {
        const snap = await getDoc(doc(db, `wishlists/${user.uid}/items`, id));
        setIsWishlisted(snap.exists());
      } catch (e) {}
    };
    checkWish();
  }, [user, id]);

  // Fetch live seller profile for real-time contact and student verification
  useEffect(() => {
    if (!listing?.sellerId) return;
    const fetchSeller = async () => {
      try {
        const snap = await getDoc(doc(db, "users", listing.sellerId));
        if (snap.exists()) {
          setSellerProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
      } catch (e) {
        console.warn("[ListingDetailPage] Seller profile fetch warning:", e);
      }
    };
    fetchSeller();
  }, [listing?.sellerId]);

  // Fetch candidate listings for AI Similar Gear
  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const snap = await getDocs(query(collection(db, "listings"), where("status", "==", "available")));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Listing[];
        setOtherListings(items);
      } catch (e) {
        console.warn("[ListingDetailPage] Candidate listings fetch error:", e);
      }
    };
    fetchOthers();
  }, []);

  const toggleWishlist = async () => {
    if (!user || !listing) {
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }
    const wishRef = doc(db, `wishlists/${user.uid}/items`, listing.id);
    if (isWishlisted) {
      await import("firebase/firestore").then(({ deleteDoc }) => deleteDoc(wishRef));
      setIsWishlisted(false);
    } else {
      await setDoc(wishRef, {
        listingId: listing.id,
        title: listing.title,
        price: listing.price,
        category: listing.category,
        thumbnail: listing.thumbnail || "",
        savedAt: serverTimestamp(),
      });
      setIsWishlisted(true);
    }
  };

  const handleStartChat = async () => {
    if (!user || !listing) {
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }

    if (user.uid === listing.sellerId) {
      alert("You cannot start a conversation with yourself as the seller.");
      return;
    }

    setStartingChat(true);

    try {
      // Deterministic conversation ID between buyer and seller for this listing
      // to avoid duplicate conversation threads
      const conversationId = `${listing.id}_${user.uid}`;
      const convRef = doc(db, "conversations", conversationId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        await setDoc(convRef, {
          id: conversationId,
          listingId: listing.id,
          listingTitle: listing.title,
          participantIds: [user.uid, listing.sellerId],
          participantNames: {
            [user.uid]: profile?.name || "Student Buyer",
            [listing.sellerId]: listing.sellerName || "Student Seller",
          },
          lastMessage: "Conversation initiated",
          updatedAt: serverTimestamp(),
        });
      }

      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      alert("Failed to start chat: " + err.message);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-serif text-ink-600">Loading item specifications...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-12 bg-paper-100 border border-ink-200 rounded-notice p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-admin-600 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ink-950">Listing Unavailable</h2>
        <p className="text-xs text-ink-600 leading-relaxed">
          This listing does not exist, has been removed, or was taken down by campus moderation.
        </p>
        <Link
          href="/browse"
          className="inline-block px-4 py-2 bg-ink-950 text-paper-50 rounded text-xs font-serif font-bold"
        >
          Return to Notice Board
        </Link>
      </div>
    );
  }

  const isSold = listing.status === "sold";
  const isSeller = user?.uid === listing.sellerId;
  const displayImages = images.length > 0 ? images.map((i) => i.dataUrl) : [listing.thumbnail || ""];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Back breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/browse"
          className="inline-flex items-center space-x-1 text-xs font-medium text-ink-600 hover:text-ink-950"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Notice Board</span>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className={`p-2 rounded-full border transition flex items-center space-x-1 text-xs font-serif ${
              isWishlisted
                ? "bg-saffron-100 border-saffron-400 text-saffron-800"
                : "bg-paper-100 border-ink-200 text-ink-700 hover:bg-paper-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-saffron-500 text-saffron-500" : ""}`} />
            <span className="hidden sm:inline">{isWishlisted ? "Saved" : "Save"}</span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 rounded-full border border-ink-200 bg-paper-100 text-ink-600 hover:text-admin-600 hover:bg-paper-200 transition"
            title="Report this listing"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sold Banner Notice */}
      {isSold && (
        <div className="p-4 bg-admin-50 border border-admin-600 rounded-notice text-admin-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-black text-sm uppercase tracking-wider bg-admin-600 text-white px-2.5 py-0.5 rounded">
              ITEM SOLD
            </span>
            <span className="text-xs">
              This item has found a student buyer and is no longer available.
            </span>
          </div>
          <span className="text-xs font-mono text-admin-700">Single-Sale Verified</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-paper-100 border border-ink-200 rounded-notice p-6 sm:p-8 shadow-card">
        
        {/* Gallery Column (6 Cols) */}
        <div className="md:col-span-6 space-y-4">
          <div className="aspect-[4/3] rounded-notice overflow-hidden border border-ink-200 bg-paper-200 relative">
            {displayImages[activeImgIndex] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImages[activeImgIndex]}
                alt={listing.title}
                className={`w-full h-full object-cover ${isSold ? "grayscale" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ink-400">
                No Photo Available
              </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center space-x-1 px-2 py-0.5 bg-paper-50/90 backdrop-blur-md rounded text-[11px] font-mono text-verifier-800 border border-verifier-600/30">
              <ShieldCheck className="w-3.5 h-3.5 text-verifier-600" />
              <span>Campus Verified Listing</span>
            </div>
          </div>

          {/* Thumbnails row */}
          {displayImages.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {displayImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImgIndex(i)}
                  className={`w-16 h-16 rounded overflow-hidden border-2 flex-shrink-0 transition ${
                    activeImgIndex === i ? "border-saffron-500 shadow" : "border-ink-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications & Actions Column (6 Cols) */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-2 py-0.5 bg-paper-200 text-ink-800 rounded border border-ink-300 uppercase">
                {listing.category}
              </span>
              <span className="px-2 py-0.5 bg-paper-200 text-ink-800 rounded border border-ink-300 capitalize">
                Condition: {listing.condition.replace("_", " ")}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-black text-ink-950 leading-tight">
              {listing.title}
            </h1>

            <div className="flex items-baseline space-x-3">
              <div className="font-serif text-3xl font-black text-saffron-600">
                ₹{listing.price.toLocaleString("en-IN")}
              </div>
              <span className="text-xs text-ink-500 font-mono">Fair-Trade Fixed Price</span>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-ink-200">
              <h3 className="text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-2">
                Item Description &amp; Usage Notes
              </h3>
              <p className="text-xs text-ink-800 leading-relaxed whitespace-pre-wrap bg-paper-50 p-3.5 rounded border border-ink-200">
                {listing.description}
              </p>
            </div>

            {/* Seller Profile Card */}
            {(() => {
              const sellerName = sellerProfile?.name || listing.sellerName || "Verified Student";
              const sellerPhone = sellerProfile?.phone || listing.sellerPhone;
              const sellerCourse = sellerProfile?.course;
              const sellerYear = sellerProfile?.year;
              const sellerCampus = sellerProfile?.campus;
              const sellerAvatarPreset = PRESET_AVATARS.find((a) => a.id === sellerProfile?.avatarId);

              return (
                <div className="bg-paper-200/60 border border-ink-300 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full bg-paper-300 border border-ink-300 flex items-center justify-center font-serif font-bold text-ink-950 overflow-hidden shadow-inner shrink-0">
                      {sellerProfile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sellerProfile.photoURL} alt={sellerName} className="w-full h-full object-cover" />
                      ) : sellerAvatarPreset ? (
                        <span className="text-xl leading-none">{sellerAvatarPreset.emoji}</span>
                      ) : (
                        <span>{sellerName ? sellerName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-ink-700" />}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-serif font-bold text-xs text-ink-950">
                          {sellerName}
                        </span>
                        <span className="px-1.5 py-0.2 bg-verifier-100 text-verifier-800 text-[9px] font-mono rounded border border-verifier-600/30">
                          Verified Peer
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-600 block">
                        {sellerCourse ? `${sellerCourse} ${sellerYear ? `• ${sellerYear}` : ""}` : "MSRUAS Enrolled Student"}
                      </span>
                      {sellerCampus && (
                        <span className="text-[10px] text-ink-500 font-mono block">
                          Campus: {sellerCampus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct Call Link */}
                  {sellerPhone && !isSeller && (
                    <a
                      href={`tel:${sellerPhone}`}
                      className="px-3.5 py-2 bg-paper-50 hover:bg-paper-100 border border-ink-300 rounded-notice text-xs font-serif font-bold text-ink-900 flex items-center justify-center space-x-1.5 transition shadow-sm shrink-0"
                      title="Direct phone call (supported on mobile devices)"
                    >
                      <Phone className="w-3.5 h-3.5 text-verifier-600" />
                      <span>Call Seller</span>
                    </a>
                  )}
                </div>
              );
            })()}

            {/* AI Product Valuation & Quality Card */}
            {(() => {
              const aiEval =
                listing.aiValidation ||
                validateListingAI({
                  title: listing.title,
                  description: listing.description,
                  category: listing.category,
                  condition: listing.condition,
                  price: listing.price,
                  imageCount: images.length || 3,
                });

              return (
                <div className="bg-paper-200/50 border border-ink-300 rounded p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-ink-950 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
                      <span>AI Fair Price &amp; Quality Assessment</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-verifier-100 text-verifier-800 border border-verifier-400">
                      Grade {aiEval.qualityCheck.grade} ({aiEval.qualityCheck.qualityScore}/100)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-ink-200">
                    <span className="text-ink-600">Fair Peer Benchmark:</span>
                    <span className="font-mono font-bold text-ink-950">
                      ₹{aiEval.priceEval.estimatedMin} - ₹{aiEval.priceEval.estimatedMax}
                    </span>
                  </div>

                  <p className="text-[11px] text-ink-600 leading-normal">
                    {aiEval.priceEval.analysisSummary}
                  </p>

                  {aiEval.suggestedTags && aiEval.suggestedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {aiEval.suggestedTags.map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-paper-100 text-ink-700 text-[10px] font-mono rounded border border-ink-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 border-t border-ink-200 space-y-3">
            {isSeller ? (
              <div className="p-3 bg-paper-200 text-center text-xs text-ink-700 font-serif rounded">
                This is your listing. Switch to Seller Dashboard to manage your items.
              </div>
            ) : isSold ? (
              <button
                disabled
                className="w-full py-3 bg-ink-300 text-ink-600 font-serif font-bold text-sm rounded-notice cursor-not-allowed uppercase tracking-wider"
              >
                Item Sold &bull; Checkout Closed
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="py-3 bg-paper-50 hover:bg-paper-200 text-ink-950 border border-ink-300 font-serif font-bold text-xs sm:text-sm rounded-notice transition flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-saffron-600" />
                  <span>Chat with Seller</span>
                </button>

                <Link
                  href={`/checkout/${listing.id}`}
                  className="py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-serif font-bold text-xs sm:text-sm rounded-notice shadow-sm transition flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Now (₹{listing.price})</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommended Similar Products */}
      {(() => {
        const similarGear = getSimilarListingsAI(listing, otherListings, 3);
        if (similarGear.length === 0) return null;

        return (
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-ink-200 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-saffron-600" />
                <h3 className="font-serif font-bold text-base text-ink-950">
                  Similar Campus Gear &amp; Alternatives
                </h3>
              </div>
              <span className="text-xs text-ink-500 font-mono">
                AI Relevance Matched
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarGear.map((item) => (
                <div key={item.listing.id} className="relative flex flex-col">
                  <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-ink-950/85 backdrop-blur-sm text-paper-50 text-[9px] font-mono rounded shadow">
                    {item.recommendationReason}
                  </span>
                  <ListingCard listing={item.listing} isWishlistedInitial={isWishlisted} />
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Report Modal */}
      <ReportModal
        listingId={listing.id}
        listingTitle={listing.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}

