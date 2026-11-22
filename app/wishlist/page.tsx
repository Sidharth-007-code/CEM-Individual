"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Heart, Trash2, ExternalLink, ArrowRight } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

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
  const [loadError, setLoadError] = useState(false);

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
        setLoadError(true);
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
        
        <Card variant="elevated" padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-modern-primary-light border border-modern-border flex items-center justify-center">
                <Heart className="w-5 h-5 text-modern-primary" />
              </div>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-modern-text-primary tracking-tight">
                  Saved Campus Wishlist
                </h1>
                <p className="text-sm text-modern-text-secondary mt-0.5">
                  MSRUAS Bookmarked Study Materials &amp; Gear
                </p>
              </div>
            </div>
          </div>

          <Badge variant="primary" size="md">
            {items.length} Saved Items
          </Badge>
        </Card>

        {loading ? (
          <div className="py-16 text-center space-y-3" role="status">
            <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-modern-text-secondary">Loading saved items...</p>
          </div>
        ) : loadError ? (
          <Card variant="default" padding="lg" className="text-center space-y-3" role="alert">
            <Heart className="w-9 h-9 text-modern-danger mx-auto" />
            <h2 className="font-semibold text-modern-text-primary">Wishlist could not be loaded</h2>
            <p className="text-sm text-modern-text-secondary">Please refresh the page to reconnect to your saved items.</p>
          </Card>
        ) : items.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center space-y-4">
            <div className="w-14 h-14 bg-modern-primary-light border border-modern-border rounded-2xl flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7 text-modern-primary" />
            </div>
            <h3 className="font-sans text-xl font-semibold text-modern-text-primary">
              Your Wishlist is Empty
            </h3>
            <p className="text-sm text-modern-text-secondary max-w-sm mx-auto">
              Save interesting listings from the notice board by clicking the heart bookmark icon.
            </p>
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 bg-modern-primary hover:bg-modern-primary-hover text-white font-semibold rounded-xl border border-modern-primary shadow-modern-sm transition-colors">
              Browse Notice Board
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <Card
                key={item.id}
                variant="elevated"
                padding="sm"
                className="flex flex-col justify-between space-y-3 group"
              >
                <Link href={`/listings/${item.listingId}`} className="block aspect-[4/3] bg-modern-surface-hover rounded-xl overflow-hidden relative">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-modern-text-tertiary">
                      No Photo
                    </div>
                  )}
                  <Badge variant="secondary" size="xs" className="absolute top-2 left-2 max-w-[85%] truncate">
                    {item.category}
                  </Badge>
                </Link>

                <div>
                  <h3 className="font-sans font-semibold text-sm text-modern-text-primary line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="font-sans text-lg font-semibold text-modern-primary mt-1">
                    ₹{item.price?.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t border-modern-border">
                  <Link href={`/listings/${item.listingId}`} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-modern-primary hover:bg-modern-primary-hover text-white text-xs font-semibold rounded-xl border border-modern-primary shadow-modern-sm transition-colors">
                    <span>View Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.listingId)}
                    aria-label="Remove item from wishlist"
                    title="Remove item"
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
