"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Listing } from "@/types/listing";
import { Heart, ShieldCheck, Tag, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { validateListingAI } from "@/lib/ai";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isDemoListing } from "@/lib/demoListings";

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
    if (isDemoListing(listing)) return;
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
  const isDemo = isDemoListing(listing);

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
      className="group flex flex-col h-full"
    >
      <Card variant="elevated" padding="none" className="flex flex-col h-full group-hover:shadow-modern-lg transition-all duration-200">
        {/* Thumbnail Aspect Box */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-modern-surface-hover">
          {listing.thumbnail ? (
            <img
              src={listing.thumbnail}
              alt={listing.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                isSold ? "grayscale opacity-60" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-modern-text-tertiary">
              <Tag className="w-8 h-8 mb-1 text-modern-text-tertiary" aria-hidden="true" />
              <span className="text-xs font-mono font-medium text-modern-text-tertiary">Verified Item</span>
            </div>
          )}

          {/* Sold Overlay Banner */}
          {isSold && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="danger" size="md" className="text-sm font-sans">
                SOLD
              </Badge>
            </div>
          )}

          {/* Wishlist Button */}
          {user && !isSold && !isDemo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 p-1.5 rounded-xl transition-colors"
              onClick={toggleWishlist}
              disabled={savingWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              leftIcon={savingWishlist ? undefined : isWishlisted ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
              isLoading={savingWishlist}
            />
          )}

          {/* Verified Badge */}
          {!isDemo && <div className="absolute bottom-2 left-2">
            <Badge variant="verifier" size="xs" dot>
              <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
              Verified
            </Badge>
          </div>}
        </div>

        {/* Card Content */}
        <CardContent className="flex-1 flex flex-col p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs text-modern-text-tertiary font-mono font-medium mb-1.5">
              <Badge variant="outline" size="xs" className="truncate max-w-[140px]">
                {listing.category}
              </Badge>
              <Badge variant="outline" size="xs" className="capitalize">
                {listing.condition.replace("_", " ")}
              </Badge>
            </div>
            <h3 className="font-sans font-semibold text-sm text-modern-text-primary line-clamp-2 leading-snug group-hover:text-modern-primary transition-colors">
              {listing.title}
            </h3>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-modern-border/50">
            <div className="flex items-center space-x-2">
              <div className="font-sans font-bold text-lg text-modern-text-primary">
                ₹{listing.price.toLocaleString("en-IN")}
              </div>
              {aiEval.priceEval.rating === "GREAT_DEAL" ? (
                <Badge variant="success" size="xs" className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  <span>Great Deal</span>
                </Badge>
              ) : aiEval.priceEval.rating === "FAIR_PRICE" ? (
                <Badge variant="warm" size="xs">
                  Fair Price
                </Badge>
              ) : null}
            </div>
            <span className="text-xs text-modern-text-tertiary font-mono">
              {listing.sellerName?.split(" ")[0] || "Student"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
