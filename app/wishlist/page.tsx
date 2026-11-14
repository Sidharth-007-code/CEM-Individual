"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Heart, Trash2, ExternalLink, ShoppingBag } from "lucide-react";

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-ink-200 pb-3">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-saffron-500 fill-saffron-500" />
            <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
              Saved Wishlist
            </h1>
          </div>
          <p className="text-xs text-ink-600 mt-1">
            Keep track of textbooks, calculators, and equipment you intend to purchase.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-ink-500 font-serif">
            Loading saved items...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-12 text-center space-y-3">
            <Heart className="w-8 h-8 text-ink-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-ink-950">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-ink-600 max-w-sm mx-auto">
              Save interesting listings from the notice board by clicking the heart bookmark icon.
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-ink-950 text-paper-50 text-xs font-serif font-bold rounded-notice shadow-sm"
            >
              Browse Notice Board
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card p-3 flex flex-col justify-between space-y-3"
              >
                <div className="aspect-[4/3] bg-paper-200 rounded overflow-hidden">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-400">
                      No Photo
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-mono text-ink-500 block uppercase">
                    {item.category}
                  </span>
                  <h3 className="font-serif font-bold text-sm text-ink-950 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="font-serif text-base font-black text-ink-950 mt-1">
                    ₹{item.price?.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-ink-200">
                  <Link
                    href={`/listings/${item.listingId}`}
                    className="flex-1 py-1.5 bg-ink-950 text-paper-50 text-xs font-serif font-bold rounded text-center hover:bg-ink-900 transition flex items-center justify-center space-x-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => removeItem(item.listingId)}
                    className="p-1.5 text-ink-500 hover:text-admin-600 rounded hover:bg-paper-200 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
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

