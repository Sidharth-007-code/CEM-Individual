"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing, CATEGORIES, ListingCategory, ListingCondition } from "@/types/listing";
import { ListingCard } from "./ListingCard";
import { DEMO_LISTINGS, isDemoListing, prioritizeRealListings } from "@/lib/demoListings";
import { VoiceSearch } from "./VoiceSearch";
import { Search, SlidersHorizontal, Sparkles, Filter, X, ArrowUpDown, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { parseSearchIntentAI, rankListingsAI, getPersonalizedRecommendationsAI } from "@/lib/ai";
import { Card, CardContent, CardHeader, CardGrid } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, PillBadge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";

interface BrowseNoticeBoardProps {
  initialCategory?: string;
}

export function BrowseNoticeBoard({ initialCategory }: BrowseNoticeBoardProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedCondition, setSelectedCondition] = useState<ListingCondition | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Listen to wishlist items if user is logged in
  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }

    const wishRef = collection(db, `wishlists/${user.uid}/items`);
    const unsubscribe = onSnapshot(
      wishRef,
      (snap) => {
        const ids = new Set(snap.docs.map((d) => d.id));
        setWishlistIds(ids);
      },
      (err) => console.warn("Wishlist fetch warning:", err.message)
    );

    return () => unsubscribe();
  }, [user]);

  // Query only available listings (FR-04, FR-06)
useEffect(() => {
  // Wait until Firebase finishes restoring the authentication session.
  if (authLoading) return;

  // Do not query Firestore without an authenticated user.
  if (!user) {
    setListings([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  console.log("[Notice Board Auth Check]", {
    uid: user.uid,
    email: user.email,
    authenticated: true,
  });

  const listingsRef = collection(db, "listings");
  const q = query(listingsRef, where("status", "==", "available"));

  const unsubscribe = onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Listing[];

      setListings(items);
      setLoading(false);
    },
    (err) => {
      console.error("[BrowseNoticeBoard] Full Firestore error:", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      setError(err.message);
      setLoading(false);
    }
  );

  return () => unsubscribe();
}, [user, authLoading]);
  // AI Search & Intent Parsing
  const searchIntent = parseSearchIntentAI(searchTerm);

  // AI Personalized Recommendations
  const realListings = listings.filter((listing) => !isDemoListing(listing));
  const personalizedRecs = getPersonalizedRecommendationsAI(profile, realListings, 4);
  const allListings = [...listings, ...DEMO_LISTINGS];

  // Compute filtered & ranked listings
  let filteredListings: Listing[] = [];

  if (searchTerm.trim()) {
    // Run AI Semantic Matcher & Ranker
    const ranked = rankListingsAI(searchTerm, allListings);
    filteredListings = ranked
      .map((r) => r.listing)
      .filter((item) => {
        if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
        if (selectedCondition !== "all" && item.condition !== selectedCondition) return false;
        return true;
      });
  } else {
    filteredListings = allListings.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedCondition !== "all" && item.condition !== selectedCondition) return false;
      return true;
    });

    filteredListings.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  // Keep real Firestore items ahead of local previews regardless of filter or sort.
  filteredListings = prioritizeRealListings(filteredListings);

  const hasActiveFilters = selectedCategory !== "all" || selectedCondition !== "all" || searchTerm;

  const conditionOptions = [
    { value: "all", label: "All Conditions" },
    { value: "new", label: "Brand New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Voice Search Bar */}
      <Card variant="outlined" padding="md" className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="w-4 h-4 text-modern-text-tertiary absolute left-3.5" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search syllabus textbooks, Casio fx-991CW, lab coats, drafters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-12"
            rightElement={
              <VoiceSearch onTranscript={(text) => setSearchTerm(text)} />
            }
          />
        </div>

        {/* Condition Filter & Sort Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <Select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value as ListingCondition | "all")}
            options={conditionOptions}
            placeholder="Condition"
            className="w-40 sm:w-auto min-w-[140px]"
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "price_asc" | "price_desc")}
            options={sortOptions}
            placeholder="Sort"
            className="w-40 sm:w-auto min-w-[160px]"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedCondition("all");
                setSearchTerm("");
              }}
              leftIcon={<X className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              Clear Filters
            </Button>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedCondition("all");
                setSearchTerm("");
              }}
              className="inline-flex sm:hidden"
              aria-label="Clear all filters"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* AI Semantic Search Signal Chips */}
      {searchTerm.trim() && (
        <Card variant="outlined" padding="sm" className="animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans font-semibold text-sm text-modern-text-primary flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-modern-primary" aria-hidden="true" />
              <span>AI Search Assistant:</span>
            </span>
            {searchIntent.detectedCategory && (
              <Badge variant="primary" size="xs">
                Category: {searchIntent.detectedCategory}
              </Badge>
            )}
            {searchIntent.maxPrice && (
              <Badge variant="warm" size="xs">
                Budget: Under ₹{searchIntent.maxPrice.toLocaleString("en-IN")}
              </Badge>
            )}
            {searchIntent.detectedCondition && (
              <Badge variant="success" size="xs" className="capitalize">
                Condition: {searchIntent.detectedCondition.replace("_", " ")}
              </Badge>
            )}
            {searchIntent.isSpecificModel && (
              <Badge variant="secondary" size="xs">
                Specific Model Match
              </Badge>
            )}
            <span className="text-xs font-mono text-modern-text-tertiary ml-auto">
              {filteredListings.length} item(s) matched
            </span>
          </div>
        </Card>
      )}

      {/* AI Personalized Recommendations Section for Logged-In Student */}
      {personalizedRecs.length > 0 && selectedCategory === "all" && !searchTerm && (
        <Card variant="elevated" padding="lg" className="space-y-4">
          <CardHeader
            title="AI Recommended For You"
            subtitle="Personalized campus feed"
            action={
              <Badge variant="warm" size="xs">
                {profile?.course ? profile.course.split("-")[0]?.trim() : "Curated Student Gear"}
              </Badge>
            }
            className="border-b border-modern-border/50 pb-3"
          />
          <CardContent className="pt-0">
            <CardGrid cols={4} gap="md">
              {personalizedRecs.map((rec) => (
                <div key={rec.listing.id} className="flex flex-col">
                  <Badge variant="primary" size="xs" className="mb-2 self-start">
                    {rec.recommendationReason}
                  </Badge>
                  <ListingCard listing={rec.listing} isWishlistedInitial={wishlistIds.has(rec.listing.id)} />
                </div>
              ))}
            </CardGrid>
          </CardContent>
        </Card>
      )}

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <PillBadge
          active={selectedCategory === "all"}
          variant="primary"
          size="sm"
          count={allListings.length}
          onClick={() => setSelectedCategory("all")}
          className="whitespace-nowrap"
        >
          All Items
        </PillBadge>

        {CATEGORIES.map((cat) => {
          const count = allListings.filter((l) => l.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <PillBadge
              key={cat}
              active={isSelected}
              variant="secondary"
              size="sm"
              count={count}
              onClick={() => setSelectedCategory(cat)}
              className="whitespace-nowrap"
            >
              {cat}
            </PillBadge>
          );
        })}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <Card variant="outlined" padding="lg" className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} variant="outlined" padding="none" className="animate-pulse h-72">
                <div className="aspect-[4/3] bg-modern-surface-hover rounded-t-2xl" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-modern-surface-hover rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-modern-surface-hover rounded w-1/2 animate-pulse" />
                  <div className="h-6 bg-modern-surface-hover rounded w-1/4 animate-pulse mt-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm font-mono text-modern-text-tertiary text-center">Gathering campus notice board items...</p>
        </Card>
      ) : error ? (
        <Card variant="outlined" padding="lg" className="text-center space-y-4 border-modern-danger/50">
          <div className="w-14 h-14 bg-modern-danger-light border border-modern-danger/30 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 text-modern-danger animate-spin" aria-hidden="true" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-modern-text-primary">
            Unable to Load Listings
          </h3>
          <p className="text-sm text-modern-text-tertiary max-w-sm mx-auto">
            {error}
          </p>
          <Button variant="primary" leftIcon={<Loader2 className="w-4 h-4" />} onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      ) : filteredListings.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center space-y-4">
          <div className="w-14 h-14 bg-modern-surface-hover border border-modern-border rounded-2xl flex items-center justify-center mx-auto">
            <Filter className="w-7 h-7 text-modern-text-tertiary" aria-hidden="true" />
          </div>
          <h3 className="font-sans text-lg font-semibold text-modern-text-primary">
            No Listings Found
          </h3>
          <p className="text-sm text-modern-text-tertiary max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "all"
              ? "No items match your active filters. Try a different search query or reset filters."
              : "No verified listings on the notice board yet. Check back soon or post the first item!"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" leftIcon={<X className="w-4 h-4" />} onClick={() => {
              setSelectedCategory("all");
              setSelectedCondition("all");
              setSearchTerm("");
            }}>
              Reset Filters
            </Button>
          )}
        </Card>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 text-sm font-mono text-modern-text-tertiary">
            <span>Showing <strong className="text-modern-text-primary">{filteredListings.length}</strong> campus item(s), including local demo previews</span>
          </div>

          <CardGrid cols={4} gap="md">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isWishlistedInitial={wishlistIds.has(listing.id)}
              />
            ))}
          </CardGrid>
        </div>
      )}
    </div>
  );
}
