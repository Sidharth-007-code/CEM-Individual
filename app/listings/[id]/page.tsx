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
import { getProductImageSet } from "@/lib/demoImages";
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

    if (!listing.sellerId) {
      alert("Seller information is missing from this listing.");
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
      console.error("[handleStartChat error]:", err);
      alert("Failed to start chat: " + err.message);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-ink-600">Loading item specifications...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <AlertCircle className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Listing Unavailable</h2>
        <p className="text-xs font-mono text-ink-600 leading-relaxed">
          This listing does not exist, has been removed, or was taken down by campus moderation.
        </p>
        <Link
          href="/browse"
          className="inline-block px-5 py-2.5 bg-brutal-yellow text-black border-2 border-black rounded-xl text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light"
        >
          Return to Notice Board
        </Link>
      </div>
    );
  }

  const isSold = listing.status === "sold";
  const isSeller = user?.uid === listing.sellerId;
  
  // Resolve multiple gallery images: subcollection -> listing.images array -> fallback demo image set
  const fallbackImages: string[] = getProductImageSet(listing.id + " " + listing.title).images.map((i) => i.dataUrl);
  const displayImages: string[] =
    images.length > 0
      ? images.map((i) => i.dataUrl)
      : (listing as any).images && (listing as any).images.length > 0
      ? ((listing as any).images as string[])
      : fallbackImages;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Back breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/browse"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-paper-100 transition"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back to Notice Board</span>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            className={`px-3 py-1.5 rounded-xl border-2 border-black transition flex items-center space-x-1.5 text-xs font-sans font-black shadow-[2px_2px_0px_#000] ${
              isWishlisted
                ? "bg-brutal-pink text-black"
                : "bg-white text-black hover:bg-brutal-pink/30"
            }`}
          >
            <Heart className={`w-4 h-4 stroke-[2.5] ${isWishlisted ? "fill-black" : ""}`} />
            <span>{isWishlisted ? "Saved" : "Save"}</span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="p-1.5 rounded-xl border-2 border-black bg-white text-ink-600 hover:text-admin-600 hover:bg-admin-50 shadow-[2px_2px_0px_#000] transition"
            title="Report this listing"
          >
            <Flag className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Sold Banner Notice */}
      {isSold && (
        <div className="p-4 bg-admin-50 border-2 border-black rounded-2xl text-admin-900 shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <span className="font-sans font-black text-xs uppercase tracking-wider bg-admin-600 text-white px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_#000]">
              ITEM SOLD
            </span>
            <span className="text-xs font-mono font-bold">
              This item has found a student buyer and is no longer available.
            </span>
          </div>
          <span className="text-xs font-mono font-black text-admin-700 bg-white px-2 py-0.5 rounded border border-black">
            Single-Sale Verified
          </span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal">
        
        {/* Gallery Column (6 Cols) */}
        <div className="md:col-span-6 space-y-4">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-black bg-paper-100 relative shadow-[2px_2px_0px_#000]">
            {displayImages[activeImgIndex] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayImages[activeImgIndex]}
                alt={listing.title}
                className={`w-full h-full object-cover ${isSold ? "grayscale" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-ink-400">
                No Photo Available
              </div>
            )}

            <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-xl text-xs font-mono font-black text-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
              <ShieldCheck className="w-4 h-4 text-verifier-600 stroke-[2.5]" />
              <span>Campus Verified Listing</span>
            </div>
          </div>

          {/* Thumbnails row */}
          {displayImages.length > 1 && (
            <div className="flex space-x-2.5 overflow-x-auto pb-1">
              {displayImages.map((src: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImgIndex(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    activeImgIndex === i
                      ? "border-black ring-2 ring-brutal-yellow shadow-[2px_2px_0px_#000]"
                      : "border-black/30 opacity-70 hover:opacity-100"
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
            
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-brutal-yellow text-black font-black rounded-xl border-2 border-black uppercase shadow-[1.5px_1.5px_0px_#000]">
                {listing.category}
              </span>
              <span className="px-2.5 py-1 bg-paper-100 text-black font-bold rounded-xl border-2 border-black capitalize shadow-[1.5px_1.5px_0px_#000]">
                Condition: {listing.condition.replace("_", " ")}
              </span>
            </div>

            <h1 className="font-sans text-2xl sm:text-3xl font-black text-black leading-tight tracking-tight">
              {listing.title}
            </h1>

            <div className="flex items-baseline space-x-3">
              <div className="font-sans text-3xl sm:text-4xl font-black text-black">
                ₹{listing.price.toLocaleString("en-IN")}
              </div>
              <span className="text-xs text-ink-600 font-mono font-bold">Fair-Trade Fixed Price</span>
            </div>

            {/* Description */}
            <div className="pt-2 border-t-2 border-black/10">
              <h3 className="text-xs font-sans font-black text-black uppercase tracking-wider mb-2">
                Item Description &amp; Usage Notes
              </h3>
              <p className="text-xs font-mono text-ink-900 leading-relaxed whitespace-pre-wrap bg-paper-50 p-4 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
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
                <div className="bg-brutal-yellow/20 border-2 border-black rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center font-sans font-black text-black overflow-hidden shadow-[2px_2px_0px_#000] shrink-0">
                      {sellerProfile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sellerProfile.photoURL} alt={sellerName} className="w-full h-full object-cover" />
                      ) : sellerAvatarPreset ? (
                        <span className="text-2xl leading-none">{sellerAvatarPreset.emoji}</span>
                      ) : (
                        <span>{sellerName ? sellerName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-black" />}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-sans font-black text-xs text-black">
                          {sellerName}
                        </span>
                        <span className="px-1.5 py-0.5 bg-brutal-green text-black text-[9px] font-mono font-bold rounded-md border border-black">
                          Verified Peer
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-ink-700 block">
                        {sellerCourse ? `${sellerCourse} ${sellerYear ? `• ${sellerYear}` : ""}` : "MSRUAS Enrolled Student"}
                      </span>
                      {sellerCampus && (
                        <span className="text-[10px] text-ink-600 font-mono block">
                          Campus: {sellerCampus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct Call Link */}
                  {sellerPhone && !isSeller && (
                    <a
                      href={`tel:${sellerPhone}`}
                      className="px-3.5 py-2 bg-white hover:bg-paper-100 border-2 border-black rounded-xl text-xs font-sans font-black text-black flex items-center justify-center space-x-1.5 transition shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] shrink-0"
                      title="Direct phone call (supported on mobile devices)"
                    >
                      <Phone className="w-3.5 h-3.5 text-black stroke-[2.5]" />
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
                  imageCount: displayImages.length || 3,
                  images: displayImages.map((src) => ({ dataUrl: src })),
                });

              return (
                <div className="bg-brutal-purple-light/50 border-2 border-black rounded-2xl p-4 space-y-2.5 shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-black text-xs text-black flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-black" />
                      <span>AI Fair Price &amp; Quality Assessment</span>
                    </span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-lg bg-brutal-green text-black border border-black shadow-[1px_1px_0px_#000]">
                      Grade {aiEval.qualityCheck.grade} ({aiEval.qualityCheck.qualityScore}/100)
                    </span>
                  </div>

                  {/* AI Visual Verification Badge */}
                  {aiEval.imageAnalysis && (
                    <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                      <span className="font-mono text-[11px] text-ink-700 font-bold flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-verifier-700" />
                        <span>AI Visual Authenticity:</span>
                      </span>
                      <span className="font-mono font-black text-black text-[11px]">
                        {aiEval.imageAnalysis.isGenuine ? "✓ Verified Genuine Physical Item" : "Under Review"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1 border-t-2 border-black/10">
                    <span className="font-mono text-ink-700">Fair Peer Benchmark:</span>
                    <span className="font-mono font-black text-black">
                      ₹{aiEval.priceEval.estimatedMin} - ₹{aiEval.priceEval.estimatedMax}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-ink-700 leading-normal">
                    {aiEval.priceEval.analysisSummary}
                  </p>

                  {aiEval.suggestedTags && aiEval.suggestedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aiEval.suggestedTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-white text-black text-[10px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000]">
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
          <div className="pt-4 border-t-2 border-black/10">
            {isSeller ? (
              <div className="p-3.5 bg-paper-100 border-2 border-black rounded-2xl text-center text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000]">
                This is your listing. Switch to Seller Dashboard to manage your items.
              </div>
            ) : isSold ? (
              <button
                disabled
                className="w-full py-3.5 bg-ink-200 text-ink-600 font-sans font-black text-sm rounded-xl border-2 border-black cursor-not-allowed uppercase tracking-wider"
              >
                Item Sold &bull; Checkout Closed
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="flex-1 py-3.5 px-4 bg-white hover:bg-paper-100 text-black border-2 border-black font-sans font-black text-xs sm:text-sm rounded-xl shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  <span>Chat with Seller</span>
                </button>

                <Link
                  href={`/checkout/${listing.id}`}
                  className="flex-1 py-3.5 px-4 bg-brutal-yellow hover:bg-brutal-yellow-light text-black border-2 border-black font-sans font-black text-xs sm:text-sm rounded-xl shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition flex items-center justify-center space-x-2"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  <span>Buy Now (₹{listing.price.toLocaleString("en-IN")})</span>
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
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-black" />
                <h3 className="font-sans font-black text-base text-black">
                  Similar Campus Gear &amp; Alternatives
                </h3>
              </div>
              <span className="text-xs text-ink-600 font-mono font-bold">
                AI Relevance Matched
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarGear.map((item) => (
                <div key={item.listing.id} className="flex flex-col">
                  <span className="mb-1.5 inline-flex items-center self-start px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold rounded-md border border-black shadow-[1px_1px_0px_#000] truncate max-w-full">
                    ★ {item.recommendationReason}
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

