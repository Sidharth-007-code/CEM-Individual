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
      
      {/* Search & Voice Search Bar - Neo-Brutalist Design */}
      <div className="bg-white border-2 border-black rounded-2xl p-3.5 shadow-brutal flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="w-4 h-4 text-black absolute left-3.5" />
          <input
            type="text"
            placeholder="Search syllabus textbooks, Casio fx-991CW, lab coats, drafters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs sm:text-sm font-semibold text-black placeholder:text-ink-500 shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-white transition-all"
          />
          <div className="absolute right-2.5">
            <VoiceSearch onTranscript={(text) => setSearchTerm(text)} />
          </div>
        </div>

        {/* Condition Filter & Sort Dropdowns */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-start">
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-3 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] focus:outline-none cursor-pointer"
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
            className="px-3 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] focus:outline-none cursor-pointer"
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
              className="p-2.5 bg-brutal-pink hover:bg-brutal-pink-dark text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Semantic Search Signal Chips */}
      {searchTerm.trim() && (
        <div className="p-3 bg-white border-2 border-black rounded-2xl flex flex-wrap items-center gap-2 text-xs shadow-brutal animate-in fade-in">
          <span className="font-sans font-black text-black flex items-center space-x-1.5 mr-1">
            <Sparkles className="w-4 h-4 text-brutal-purple" />
            <span>AI Search Assistant:</span>
          </span>
          {searchIntent.detectedCategory && (
            <span className="px-2.5 py-1 bg-brutal-yellow text-black rounded-lg border-2 border-black font-mono text-[10px] font-black shadow-[1.5px_1.5px_0px_#000]">
              Category: {searchIntent.detectedCategory}
            </span>
          )}
          {searchIntent.maxPrice && (
            <span className="px-2.5 py-1 bg-brutal-green text-black rounded-lg border-2 border-black font-mono text-[10px] font-black shadow-[1.5px_1.5px_0px_#000]">
              Budget: Under ₹{searchIntent.maxPrice.toLocaleString("en-IN")}
            </span>
          )}
          {searchIntent.detectedCondition && (
            <span className="px-2.5 py-1 bg-brutal-purple-light text-black rounded-lg border-2 border-black font-mono text-[10px] font-bold shadow-[1.5px_1.5px_0px_#000]">
              Condition: {searchIntent.detectedCondition}
            </span>
          )}
          {searchIntent.isSpecificModel && (
            <span className="px-2.5 py-1 bg-brutal-pink text-black rounded-lg border-2 border-black font-mono text-[10px] font-black shadow-[1.5px_1.5px_0px_#000]">
              Specific Model Match
            </span>
          )}
          <span className="text-[11px] text-ink-600 ml-auto font-mono font-bold">
            {filteredListings.length} item(s) matched
          </span>
        </div>
      )}

      {/* AI Personalized Recommendations Section for Logged-In Student */}
      {personalizedRecs.length > 0 && selectedCategory === "all" && !searchTerm && (
        <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-brutal-yellow border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <h2 className="font-sans font-black text-base text-black">
                AI Recommended For You
              </h2>
              <span className="text-[10px] font-mono font-bold bg-brutal-purple-light text-brutal-purple-dark px-2.5 py-0.5 rounded-full border border-black">
                {profile?.course ? profile.course.split("-")[0]?.trim() : "Curated Student Gear"}
              </span>
            </div>
            <span className="text-[11px] text-ink-600 font-mono font-bold hidden sm:inline">
              Personalized Campus Feed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {personalizedRecs.map((rec) => (
              <div key={rec.listing.id} className="flex flex-col">
                <span className="mb-1.5 inline-flex items-center self-start px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold rounded-md border border-black shadow-[1px_1px_0px_#000] truncate max-w-full">
                  ★ {rec.recommendationReason}
                </span>
                <ListingCard listing={rec.listing} isWishlistedInitial={wishlistIds.has(rec.listing.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills Bar - Neo-Brutalist Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-black whitespace-nowrap border-2 border-black transition-all ${
            selectedCategory === "all"
              ? "bg-brutal-yellow text-black shadow-[2.5px_2.5px_0px_#000] -translate-y-0.5"
              : "bg-white hover:bg-paper-100 text-black shadow-[1.5px_1.5px_0px_#000]"
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
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black whitespace-nowrap border-2 border-black transition-all ${
                isSelected
                  ? "bg-brutal-yellow text-black shadow-[2.5px_2.5px_0px_#000] -translate-y-0.5"
                  : "bg-white hover:bg-paper-100 text-black shadow-[1.5px_1.5px_0px_#000]"
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
          <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto shadow-[2px_2px_0px_#000]" />
          <p className="text-xs font-mono font-bold text-ink-700">Gathering campus notice board items...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="bg-white border-2 border-black rounded-3xl p-12 text-center space-y-3 shadow-brutal">
          <div className="w-14 h-14 bg-brutal-yellow border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
            <Filter className="w-7 h-7 text-black" />
          </div>
          <h3 className="font-sans text-xl font-black text-black">
            No Listings Found
          </h3>
          <p className="text-xs font-semibold text-ink-700 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== "all"
              ? "No items match your active filters. Try a different search query or reset filters."
              : "No verified listings on the notice board yet. Check back soon or post the first item!"}
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 text-xs font-mono font-bold text-ink-700">
            <span>Showing <strong className="text-black">{filteredListings.length}</strong> verified campus item(s)</span>
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

