"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/types/listing";
import { Order } from "@/types/order";
import { PRESET_AVATARS } from "@/lib/constants";
import { syncUserProfile } from "@/lib/profileSync";
import {
  User,
  Package,
  PlusCircle,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  BookOpen,
  Edit3,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, studentMode, setStudentMode, refreshProfile } = useAuth();

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);

  // Edit form state
  const [phone, setPhone] = useState(profile?.phone || "");
  const [course, setCourse] = useState(profile?.course || "");
  const [year, setYear] = useState(profile?.year || "1st Year");
  const [personalEmail, setPersonalEmail] = useState(profile?.personalEmail || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setCourse(profile.course || "");
      setYear(profile.year || "1st Year");
      setPersonalEmail(profile.personalEmail || "");
    }
  }, [profile]);

  // Real-time listener for seller's own listings
  useEffect(() => {
    if (!user) return;
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, where("sellerId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Listing[];
        setMyListings(items);
      },
      (err) => {
        console.warn("[Dashboard] Listings subscription:", err.message);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Real-time listener for buyer's orders
  useEffect(() => {
    if (!user) return;
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("buyerId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Order[];
        setMyOrders(items);
      },
      (err) => {
        console.warn("[Dashboard] Orders subscription:", err.message);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const activePreset = PRESET_AVATARS.find((a) => a.id === profile?.avatarId);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const result = await syncUserProfile(user.uid, {
        name: profile?.name || "Student",
        phone,
        course,
        year,
        personalEmail,
        campus: profile?.campus,
        bio: profile?.bio,
        photoURL: profile?.photoURL,
        avatarId: profile?.avatarId,
      });

      if (result.success) {
        await refreshProfile();
        setEditingProfile(false);
        setProfileMsg(`Profile updated and synchronized across ${result.updatedListingsCount} listings.`);
      } else {
        setProfileMsg("Failed to update profile: " + result.error);
      }
    } catch (err: any) {
      setProfileMsg("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const pendingCount = myListings.filter((l) => l.status === "pending").length;
  const availableCount = myListings.filter((l) => l.status === "available").length;
  const soldCount = myListings.filter((l) => l.status === "sold").length;

  return (
    <RouteGuard requireAuth={true}>
      <div className="space-y-8">
        
        {/* Profile Masthead Card */}
        <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-paper-300 border-2 border-ink-300 flex items-center justify-center font-serif text-2xl font-bold text-ink-950 shadow-inner overflow-hidden shrink-0">
                {profile?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                ) : activePreset ? (
                  <span className="text-3xl leading-none">{activePreset.emoji}</span>
                ) : (
                  <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}</span>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-serif text-2xl font-black text-ink-950 tracking-tight">
                    {profile?.name || "Student"}
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-verifier-100 text-verifier-800 rounded border border-verifier-600/30">
                    {profile?.role || "student"} &bull; {profile?.status || "active"}
                  </span>
                </div>
                <p className="text-xs text-ink-600">
                  {profile?.email} &bull; {profile?.course || "Course unassigned"} &bull; {profile?.year || "Year unassigned"}
                </p>
                {profile?.campus && (
                  <p className="text-xs text-ink-500">
                    Campus: <span className="font-medium text-ink-700">{profile.campus}</span>
                  </p>
                )}
                {profile?.phone && (
                  <p className="text-xs text-ink-500 mt-0.5">
                    Phone: <span className="font-mono">{profile.phone}</span> (active for buyer call links)
                  </p>
                )}
              </div>
            </div>

            {/* Mode Switcher & Edit Profile */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center bg-paper-200 p-1 rounded-full border border-ink-300">
                <button
                  type="button"
                  onClick={() => setStudentMode("buy")}
                  className={`px-4 py-1.5 text-xs font-serif font-bold rounded-full transition-all ${
                    studentMode === "buy"
                      ? "bg-ink-950 text-paper-50 shadow-sm"
                      : "text-ink-600 hover:text-ink-950"
                  }`}
                >
                  BUYING MODE
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode("sell")}
                  className={`px-4 py-1.5 text-xs font-serif font-bold rounded-full transition-all ${
                    studentMode === "sell"
                      ? "bg-saffron-500 text-white shadow-sm"
                      : "text-ink-600 hover:text-ink-950"
                  }`}
                >
                  SELLING MODE
                </button>
              </div>

              <Link
                href="/profile"
                className="px-3.5 py-1.5 bg-saffron-500 hover:bg-saffron-600 text-white rounded-notice text-xs font-serif font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Full Profile & Avatar</span>
              </Link>

              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="px-3 py-1.5 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-800 hover:bg-paper-200 transition flex items-center space-x-1.5"
              >
                <span>{editingProfile ? "Cancel" : "Quick Edit"}</span>
              </button>
            </div>
          </div>

          {/* Profile Edit Drawer */}
          {editingProfile && (
            <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-ink-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Phone (for Call Link)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Course
                </label>
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                />
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Backup Personal Email
                </label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="px-3 py-1.5 text-xs text-ink-600 hover:text-ink-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-1.5 bg-ink-950 text-paper-50 text-xs font-serif font-bold rounded-notice hover:bg-ink-900 transition disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          )}

          {profileMsg && (
            <p className="text-xs text-saffron-700 mt-2 font-medium">{profileMsg}</p>
          )}
        </div>

        {/* Dynamic Mode Views */}
        {studentMode === "sell" ? (
          /* SELLER VIEW */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-ink-950">
                  Seller Dashboard &amp; Inventory
                </h2>
                <p className="text-xs text-ink-600">
                  Track listings through automated checks, quality verifier decisions, and sales.
                </p>
              </div>

              <Link
                href="/listings/new"
                className="inline-flex items-center px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white font-serif font-bold text-xs rounded-notice shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Post New Listing
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-paper-100 border border-ink-200 rounded-notice p-4 text-center">
                <span className="text-2xl font-serif font-black text-ink-950">{availableCount}</span>
                <span className="block text-[11px] font-mono text-ink-600 uppercase mt-0.5">Live on Board</span>
              </div>
              <div className="bg-paper-100 border border-ink-200 rounded-notice p-4 text-center">
                <span className="text-2xl font-serif font-black text-saffron-600">{pendingCount}</span>
                <span className="block text-[11px] font-mono text-ink-600 uppercase mt-0.5">In Verification</span>
              </div>
              <div className="bg-paper-100 border border-ink-200 rounded-notice p-4 text-center">
                <span className="text-2xl font-serif font-black text-verifier-700">{soldCount}</span>
                <span className="block text-[11px] font-mono text-ink-600 uppercase mt-0.5">Sold to Students</span>
              </div>
            </div>

            {/* My Listings Table / Cards */}
            <div className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card">
              <div className="p-4 border-b border-ink-200 flex justify-between items-center bg-paper-200/50">
                <h3 className="font-serif font-bold text-sm text-ink-950">
                  My Posted Items ({myListings.length})
                </h3>
              </div>

              {myListings.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <Tag className="w-8 h-8 mx-auto text-ink-400" />
                  <p className="text-xs text-ink-600">You haven&apos;t posted any items for sale yet.</p>
                  <Link
                    href="/listings/new"
                    className="inline-block px-3 py-1.5 bg-saffron-500 text-white text-xs font-serif font-bold rounded-notice shadow-sm"
                  >
                    Post your first item
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-ink-200">
                  {myListings.map((listing) => (
                    <div key={listing.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-bold text-ink-950 text-sm">
                            {listing.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                              listing.status === "available"
                                ? "bg-verifier-100 text-verifier-800 border border-verifier-600/30"
                                : listing.status === "pending"
                                ? "bg-saffron-100 text-saffron-800 border border-saffron-400/30"
                                : listing.status === "sold"
                                ? "bg-ink-200 text-ink-800 border border-ink-400"
                                : "bg-admin-100 text-admin-800 border border-admin-600/30"
                            }`}
                          >
                            {listing.status}
                          </span>
                        </div>
                        <p className="text-xs text-ink-600">
                          ₹{listing.price} &bull; {listing.category} &bull; {listing.condition}
                        </p>
                        {listing.verifierNote && (
                          <p className="text-xs text-admin-800 bg-admin-50 p-2 rounded border border-admin-200 mt-1">
                            <strong>Verifier Remark:</strong> {listing.verifierNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="px-3 py-1.5 text-xs text-ink-700 hover:text-ink-950 bg-paper-200 hover:bg-paper-300 rounded-notice transition flex items-center space-x-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* BUYER VIEW */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-ink-950">
                  Buyer Activity &amp; Purchases
                </h2>
                <p className="text-xs text-ink-600">
                  Track active meetups, past purchases, invoices, and saved items.
                </p>
              </div>

              <Link
                href="/browse"
                className="inline-flex items-center px-4 py-2 bg-ink-950 hover:bg-ink-900 text-paper-50 font-serif font-bold text-xs rounded-notice shadow-sm transition"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Explore Notice Board
              </Link>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-paper-100 border border-ink-200 rounded-notice p-4 text-center">
                <span className="text-2xl font-serif font-black text-ink-950">{myOrders.length}</span>
                <span className="block text-[11px] font-mono text-ink-600 uppercase mt-0.5">Purchases Placed</span>
              </div>
              <div className="bg-paper-100 border border-ink-200 rounded-notice p-4 text-center">
                <span className="text-2xl font-serif font-black text-saffron-600">
                  {myOrders.filter((o) => o.status === "meetup_scheduled" || o.status === "confirmed").length}
                </span>
                <span className="block text-[11px] font-mono text-ink-600 uppercase mt-0.5">Active Meetups</span>
              </div>
            </div>

            {/* Orders summary */}
            <div className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card">
              <div className="p-4 border-b border-ink-200 flex justify-between items-center bg-paper-200/50">
                <h3 className="font-serif font-bold text-sm text-ink-950">
                  Recent Orders ({myOrders.length})
                </h3>
                <Link href="/orders" className="text-xs text-saffron-600 hover:text-saffron-700 underline font-medium">
                  View Full History
                </Link>
              </div>

              {myOrders.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <Package className="w-8 h-8 mx-auto text-ink-400" />
                  <p className="text-xs text-ink-600">You haven&apos;t placed any orders yet.</p>
                  <Link
                    href="/browse"
                    className="inline-block px-3 py-1.5 bg-ink-950 text-paper-50 text-xs font-serif font-bold rounded-notice shadow-sm"
                  >
                    Browse available items
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-ink-200">
                  {myOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="p-4 flex justify-between items-center hover:bg-paper-50 transition">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-bold text-ink-950 text-sm">
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-paper-200 text-ink-800 rounded border border-ink-300">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-ink-600 mt-0.5">
                          ₹{order.price} &bull; {order.paymentMethod === "cash" ? "Cash at Meetup" : "Simulated UPI"} &bull; {order.meetupSpot || "Meetup pending"}
                        </p>
                      </div>

                      <Link
                        href={`/orders/${order.id}`}
                        className="px-3 py-1.5 text-xs bg-paper-200 hover:bg-paper-300 text-ink-800 rounded-notice transition"
                      >
                        Track Order
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

