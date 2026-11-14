"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Heart, Trash2, ExternalLink, ShoppingBag, ArrowRight } from "lucide-react";

interface WishlistItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const wishRef = collection(db, `wishlists/${user.uid}/items`);

    const unsubscribe = onSnapshot(
      wishRef,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as WishlistItem[];
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.warn("Wishlist fetch error:", err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const removeItem = async (listingId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `wishlists/${user.uid}/items`, listingId));
    } catch (err: any) {
      console.error("Failed to delete wishlist item:", err);
    }
  };

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Banner - Neo-Brutalist Layout */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-grid-pattern">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-brutal-pink border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                <Heart className="w-5 h-5 text-black fill-black" />
              </div>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Saved Campus Wishlist
                </h1>
                <p className="text-xs font-mono font-bold text-ink-600 mt-0.5">
                  MSRUAS Bookmarked Study Materials &amp; Gear
                </p>
              </div>
            </div>
          </div>

          <span className="px-3.5 py-1.5 bg-brutal-yellow text-black text-xs font-mono font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
            {items.length} Saved Items
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto shadow-[2px_2px_0px_#000]" />
            <p className="text-xs font-mono font-bold text-ink-600">Loading saved items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-3xl p-12 text-center space-y-4 shadow-brutal">
            <div className="w-14 h-14 bg-brutal-pink border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
              <Heart className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-sans text-xl font-black text-black">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs font-semibold text-ink-600 max-w-sm mx-auto">
              Save interesting listings from the notice board by clicking the heart bookmark icon.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] transition-all"
            >
              <span>Browse Notice Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal p-4 flex flex-col justify-between space-y-3 hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all group"
              >
                <div className="aspect-[4/3] bg-paper-100 rounded-xl border-2 border-black overflow-hidden relative">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono font-bold text-black">
                      No Photo
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-brutal-yellow text-black border border-black rounded-md text-[9px] font-mono font-black shadow-[1px_1px_0px_#000]">
                    {item.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-sans font-black text-sm text-black line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="font-sans text-lg font-black text-black mt-1">
                    ₹{item.price?.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-black/10">
                  <Link
                    href={`/listings/${item.listingId}`}
                    className="flex-1 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] text-center transition flex items-center justify-center space-x-1.5 active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => removeItem(item.listingId)}
                    className="p-2 bg-brutal-pink hover:bg-brutal-pink-dark text-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px]"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
