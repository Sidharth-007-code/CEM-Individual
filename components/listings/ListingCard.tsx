"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Listing } from "@/types/listing";
import { Heart, ShieldCheck, Tag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
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

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group bg-paper-100 border border-ink-200 hover:border-ink-400 rounded-notice overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col relative"
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-[4/3] bg-paper-200 overflow-hidden">
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
            <Tag className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-mono">No Image</span>
          </div>
        )}

        {/* Sold Overlay Banner */}
        {isSold && (
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-3 py-1 bg-admin-600 text-white font-serif font-black text-xs tracking-widest uppercase border border-white shadow-float rotate-[-6deg]">
              SOLD
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        {user && !isSold && (
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={savingWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition shadow ${
              isWishlisted
                ? "bg-saffron-500 text-white"
                : "bg-paper-50/80 text-ink-700 hover:text-saffron-600 hover:bg-paper-50"
            }`}
            title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-white" : ""}`} />
          </button>
        )}

        {/* Verified Badge */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-1 px-1.5 py-0.5 bg-paper-50/90 backdrop-blur-md rounded text-[10px] font-mono text-verifier-800 border border-verifier-600/30">
          <ShieldCheck className="w-3 h-3 text-verifier-600" />
          <span>Verified</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center justify-between text-[11px] text-ink-500 font-mono mb-1">
            <span className="truncate max-w-[140px]">{listing.category}</span>
            <span className="capitalize">{listing.condition.replace("_", " ")}</span>
          </div>
          <h3 className="font-serif font-bold text-sm text-ink-950 line-clamp-2 leading-snug group-hover:text-saffron-600 transition-colors">
            {listing.title}
          </h3>
        </div>

        <div className="flex items-baseline justify-between pt-1 border-t border-ink-100">
          <div className="font-serif text-base font-black text-ink-950">
            ₹{listing.price.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-ink-500 font-mono">
            {listing.sellerName?.split(" ")[0] || "Student"}
          </span>
        </div>
      </div>
    </Link>
  );
}

