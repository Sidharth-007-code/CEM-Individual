"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Listing } from "@/types/listing";
import { Heart, ShieldCheck, Tag, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { validateListingAI } from "@/lib/ai";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ListingCardProps {
  listing: Listing;
  isWishlistedInitial?: boolean;
}

export function ListingCard({ listing, isWishlistedInitial = false }: ListingCardProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [savingWishlist, setSavingWishlist] = useState(false);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setSavingWishlist(true);
    const wishRef = doc(db, `wishlists/${user.uid}/items`, listing.id);

    try {
      if (isWishlisted) {
        await deleteDoc(wishRef);
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
    } catch (err: any) {
      console.error("[Wishlist toggle error]:", err);
    } finally {
      setSavingWishlist(false);
    }
  };

  const isSold = listing.status === "sold";
  const isDemo = Boolean((listing as any).isPresentationDemo);

  // AI Evaluation (precomputed or evaluated on demand)
  const aiEval =
    listing.aiValidation ||
    validateListingAI({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      price: listing.price,
      imageCount: 3,
    });

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all duration-200 flex flex-col relative"
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-[4/3] bg-paper-100 border-b-2 border-black overflow-hidden">
        {listing.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.thumbnail}
            alt={listing.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              isSold ? "grayscale opacity-60" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-400">
            <Tag className="w-8 h-8 mb-1 text-black" />
            <span className="text-[10px] font-mono font-bold text-black">Verified Item</span>
          </div>
        )}

        {/* Sold Overlay Banner */}
        {isSold && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-admin-600 text-white font-sans font-black text-xs tracking-widest uppercase border-2 border-white shadow-[2px_2px_0px_#000] rotate-[-6deg]">
              SOLD
            </span>
          </div>
        )}

        {/* Presentation Demo Badge */}
        {isDemo && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 bg-brutal-yellow text-black font-mono font-black text-[9px] uppercase tracking-wider rounded-md border border-black shadow-[1px_1px_0px_#000]">
              Demo
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        {user && !isSold && (
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={savingWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-xl border-2 border-black transition shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] ${
              isWishlisted
                ? "bg-brutal-pink text-black"
                : "bg-white text-black hover:bg-brutal-pink/30"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-black" : ""}`} />
          </button>
        )}

        {/* Verified Badge */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-1 px-2 py-0.5 bg-white/95 backdrop-blur-md rounded-lg text-[10px] font-mono font-bold text-black border border-black shadow-[1px_1px_0px_#000]">
          <ShieldCheck className="w-3 h-3 text-verifier-700" />
          <span>Verified</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-ink-600 font-mono font-semibold mb-1">
            <span className="truncate max-w-[140px]">{listing.category}</span>
            <span className="capitalize">{listing.condition.replace("_", " ")}</span>
          </div>
          <h3 className="font-sans font-black text-sm text-black line-clamp-2 leading-snug group-hover:text-brutal-purple-dark transition-colors">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-baseline justify-between pt-1.5 border-t border-black/10">
          <div className="flex items-center space-x-1.5">
            <div className="font-sans text-base font-black text-black">
              ₹{listing.price.toLocaleString("en-IN")}
            </div>
            {aiEval.priceEval.rating === "GREAT_DEAL" ? (
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-brutal-green text-black rounded-md border border-black flex items-center space-x-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Great Deal</span>
              </span>
            ) : aiEval.priceEval.rating === "FAIR_PRICE" ? (
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold text-black bg-paper-200 border border-black/30 rounded-md">
                Fair Price
              </span>
            ) : null}
          </div>
          <span className="text-[10px] text-ink-600 font-mono font-bold">
            {listing.sellerName?.split(" ")[0] || "Student"}
          </span>
        </div>
      </div>
    </Link>
  );
}
