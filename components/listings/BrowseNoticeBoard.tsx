"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing, CATEGORIES, ListingCategory } from "@/types/listing";
import { ListingCard } from "./ListingCard";
import { VoiceSearch } from "./VoiceSearch";
import { Search, SlidersHorizontal, Sparkles, Filter, X, ArrowUpDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { parseSearchIntentAI, rankListingsAI, getPersonalizedRecommendationsAI } from "@/lib/ai";

interface BrowseNoticeBoardProps {
  initialCategory?: string;
}

export function BrowseNoticeBoard({ initialCategory }: BrowseNoticeBoardProps) {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
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
    setLoading(true);
    const listingsRef = collection(db, "listings");
    // Firestore rules only allow normal students to read available listings
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
        console.warn("[BrowseNoticeBoard] Query error:", err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // AI Search & Intent Parsing
  const searchIntent = parseSearchIntentAI(searchTerm);

  // AI Personalized Recommendations
  const personalizedRecs = getPersonalizedRecommendationsAI(profile, listings, 4);

  // Compute filtered & ranked listings
  let filteredListings: Listing[] = [];

  if (searchTerm.trim()) {
    // Run AI Semantic Matcher & Ranker
    const ranked = rankListingsAI(searchTerm, listings);
    filteredListings = ranked
      .map((r) => r.listing)
      .filter((item) => {
        if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
        if (selectedCondition !== "all" && item.condition !== selectedCondition) return false;
        return true;
      });
  } else {
    filteredListings = listings.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
      if (selectedCondition !== "all" && item.condition !== selectedCondition) return false;
      return true;
    });

    filteredListings.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });
  }

  return (
    <div className="space-y-6">
      
      {/* Search & Voice Search Bar */}
      <div className="bg-paper-100 border border-ink-200 rounded-notice p-3 shadow-card flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="w-4 h-4 text-ink-400 absolute left-3.5" />
          <input
            type="text"
            placeholder="Search textbooks, scientific calculators, lab uniforms, bicycles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs sm:text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-saffron-500"
          />
          <div className="absolute right-2">
            <VoiceSearch onTranscript={(text) => setSearchTerm(text)} />
          </div>
        </div>

        {/* Condition Filter & Sort Dropdowns */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-2.5 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-800 focus:outline-none focus:border-saffron-500"
          >
            <option value="all">All Conditions</option>
            <option value="new">Brand New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-800 focus:outline-none focus:border-saffron-500"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {(selectedCategory !== "all" || selectedCondition !== "all" || searchTerm) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedCondition("all");
                setSearchTerm("");
              }}
              className="p-2 text-ink-500 hover:text-admin-600 rounded bg-paper-200"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Semantic Search Signal Chips */}
      {searchTerm.trim() && (
        <div className="p-3 bg-paper-100 border border-saffron-300 rounded-notice flex flex-wrap items-center gap-2 text-xs shadow-sm animate-in fade-in">
          <span className="font-serif font-bold text-ink-950 flex items-center space-x-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
            <span>AI Natural Language Parser:</span>
          </span>
          {searchIntent.detectedCategory && (
            <span className="px-2 py-0.5 bg-paper-50 rounded border border-ink-300 font-mono text-[10px] text-ink-800">
              Category: {searchIntent.detectedCategory}
            </span>
          )}
          {searchIntent.maxPrice && (
            <span className="px-2 py-0.5 bg-emerald-50 rounded border border-emerald-400 font-mono text-[10px] text-emerald-800 font-bold">
              Budget: Under ₹{searchIntent.maxPrice.toLocaleString("en-IN")}
            </span>
          )}
          {searchIntent.detectedCondition && (
            <span className="px-2 py-0.5 bg-paper-50 rounded border border-ink-300 font-mono text-[10px] text-ink-800">
              Condition: {searchIntent.detectedCondition}
            </span>
          )}
          {searchIntent.isSpecificModel && (
            <span className="px-2 py-0.5 bg-saffron-100 rounded border border-saffron-400 font-mono text-[10px] text-saffron-800 font-bold">
              Specific Model Match
            </span>
          )}
          <span className="text-[11px] text-ink-500 ml-auto font-mono">
            {filteredListings.length} item(s) matched by relevance
          </span>
        </div>
      )}

      {/* AI Personalized Recommendations Section for Logged-In Student */}
      {personalizedRecs.length > 0 && selectedCategory === "all" && !searchTerm && (
        <div className="bg-gradient-to-r from-paper-100 via-paper-50 to-paper-100 border border-ink-200 rounded-notice p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-saffron-600" />
              <h2 className="font-serif font-bold text-sm text-ink-950">
                AI Recommended For You
              </h2>
              <span className="text-[10px] font-mono bg-saffron-100 text-saffron-800 px-2 py-0.5 rounded-full border border-saffron-300">
                {profile?.course ? profile.course.split("-")[0]?.trim() : "Curated Student Gear"}
              </span>
            </div>
            <span className="text-[11px] text-ink-500 font-mono hidden sm:inline">
              Personalized Campus Feed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {personalizedRecs.map((rec) => (
              <div key={rec.listing.id} className="relative flex flex-col">
                <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-ink-950/85 backdrop-blur-sm text-paper-50 text-[9px] font-mono rounded shadow">
                  {rec.recommendationReason}
                </span>
                <ListingCard listing={rec.listing} isWishlistedInitial={wishlistIds.has(rec.listing.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-serif font-bold whitespace-nowrap transition-all border ${
            selectedCategory === "all"
              ? "bg-ink-950 text-paper-50 border-ink-950 shadow-sm"
              : "bg-paper-100 text-ink-700 border-ink-200 hover:border-ink-400 hover:bg-paper-200"
          }`}
        >
          All Items ({listings.length})
        </button>

        {CATEGORIES.map((cat) => {
          const count = listings.filter((l) => l.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-serif font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? "bg-saffron-500 text-white border-saffron-600 shadow-sm"
                  : "bg-paper-100 text-ink-700 border-ink-200 hover:border-ink-400 hover:bg-paper-200"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-serif text-ink-600">Gathering campus notice board items...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-paper-100 border border-ink-200 rounded-notice p-12 text-center space-y-3">
          <Filter className="w-8 h-8 mx-auto text-ink-400" />
          <h3 className="font-serif text-base font-bold text-ink-950">
            No Listings Found
          </h3>
          <p className="text-xs text-ink-600 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "all"
              ? "No items match your active filters. Try a different search query or reset filters."
              : "No verified listings on the notice board yet. Check back soon or post the first item!"}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3 text-xs text-ink-600">
            <span>Showing <strong>{filteredListings.length}</strong> verified item(s)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isWishlistedInitial={wishlistIds.has(listing.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

