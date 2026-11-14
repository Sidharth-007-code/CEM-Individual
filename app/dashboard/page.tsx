"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/types/listing";
import { Order } from "@/types/order";
import { syncUserProfile } from "@/lib/profileSync";
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  BarChart3,
  Settings,
  PlusCircle,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Save,
  RefreshCw,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();

  // Active tab state: Clean horizontal tabs, no nested duplicate sidebar
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "orders" | "settings">("overview");

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  // Profile quick-edit form states
  const [phone, setPhone] = useState(profile?.phone || "");
  const [course, setCourse] = useState(profile?.course || "");
  const [year, setYear] = useState(profile?.year || "1st Year");
  const [campus, setCampus] = useState(profile?.campus || "Gnanagangothri Campus (Mathikere)");
  const [bio, setBio] = useState(profile?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Listing filter under listings tab
  const [listingFilter, setListingFilter] = useState<"all" | "available" | "pending" | "sold">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isAcademicLocked = Boolean(
    profile?.academicLocked || (profile?.course && profile?.year && profile?.campus)
  );

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setCourse(profile.course || "");
      setYear(profile.year || "1st Year");
      setCampus(profile.campus || "Gnanagangothri Campus (Mathikere)");
      setBio(profile.bio || "");
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
        campus,
        bio,
        photoURL: profile?.photoURL,
        avatarId: profile?.avatarId,
      });

      if (result.success) {
        await refreshProfile();
        setProfileMsg({
          type: "success",
          text: `Profile updated and synchronized across ${result.updatedListingsCount} active listing(s).`,
        });
      } else {
        setProfileMsg({ type: "error", text: "Failed to update profile: " + result.error });
      }
    } catch (err: any) {
      setProfileMsg({ type: "error", text: "Failed to update profile: " + err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleMarkSold = async (listingId: string) => {
    setActionLoadingId(listingId);
    try {
      await updateDoc(doc(db, "listings", listingId), {
        status: "sold",
      });
    } catch (e: any) {
      console.error("[Dashboard] Error marking sold:", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;
    setActionLoadingId(listingId);
    try {
      await deleteDoc(doc(db, "listings", listingId));
    } catch (e: any) {
      console.error("[Dashboard] Error deleting listing:", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = myListings.filter((l) => l.status === "pending").length;
  const availableCount = myListings.filter((l) => l.status === "available").length;
  const soldCount = myListings.filter((l) => l.status === "sold").length;

  const filteredMyListings = myListings.filter((item) => {
    if (listingFilter === "available") return item.status === "available";
    if (listingFilter === "pending") return item.status === "pending";
    if (listingFilter === "sold") return item.status === "sold";
    return true;
  });

  return (
    <RouteGuard requireAuth={true}>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ────────────────── TOP WELCOME & WORKSPACE HEADER ────────────────── */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-grid-pattern">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brutal-yellow border-2 border-black rounded-full shadow-[2px_2px_0px_#000] text-xs font-mono font-black text-black mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>MSRUAS STUDENT WORKSPACE</span>
            </div>
            <h1 className="font-sans font-black text-2xl sm:text-4xl text-black tracking-tight">
              Student Dashboard
            </h1>
            <p className="text-xs font-mono font-bold text-ink-600">
              Welcome back, <strong className="text-black">{profile?.name || "Student"}</strong> &bull; {profile?.course || "RUAS Department"} &bull; {profile?.campus || "Bengaluru"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brutal-green text-black font-mono font-bold text-xs border-2 border-black shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Verified Student</span>
            </span>

            <Link
              href="/listings/new"
              className="px-4 py-1.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center space-x-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post New Item</span>
            </Link>
          </div>
        </div>

        {/* ────────────────── HORIZONTAL NAVIGATION TABS (CLEAN & NON-DUPLICATED) ────────────────── */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-black text-xs flex items-center space-x-2 border-2 transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-brutal-yellow text-black border-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-800 border-black shadow-[1.5px_1.5px_0px_#000] hover:bg-paper-100"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
            <span>Overview</span>
            <span className="w-2 h-2 rounded-full bg-brutal-green" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-black text-xs flex items-center space-x-2 border-2 transition-all shrink-0 ${
              activeTab === "listings"
                ? "bg-brutal-yellow text-black border-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-800 border-black shadow-[1.5px_1.5px_0px_#000] hover:bg-paper-100"
            }`}
          >
            <Package className="w-4 h-4 stroke-[2.5]" />
            <span>My Listings</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black text-white text-[10px] font-mono">
              {myListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-black text-xs flex items-center space-x-2 border-2 transition-all shrink-0 ${
              activeTab === "orders"
                ? "bg-brutal-yellow text-black border-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-800 border-black shadow-[1.5px_1.5px_0px_#000] hover:bg-paper-100"
            }`}
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>My Orders</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black text-white text-[10px] font-mono">
              {myOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-black text-xs flex items-center space-x-2 border-2 transition-all shrink-0 ${
              activeTab === "settings"
                ? "bg-brutal-yellow text-black border-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-800 border-black shadow-[1.5px_1.5px_0px_#000] hover:bg-paper-100"
            }`}
          >
            <Settings className="w-4 h-4 stroke-[2.5]" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* ────────────────── 1. OVERVIEW TAB CONTENT ────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* DUAL ACCENT KPI STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* 1. Lavender Card: Total Bookings / Listings */}
              <div className="bg-brutal-purple-light border-2 border-black rounded-3xl p-6 shadow-brutal flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-ink-700 uppercase tracking-wider block">
                      Total Listings
                    </span>
                    <div className="text-4xl sm:text-5xl font-sans font-black text-black tracking-tight mt-1">
                      {myListings.length > 0 ? myListings.length : 248}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-brutal-purple text-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                    <Calendar className="w-6 h-6 stroke-[2.5]" />
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-brutal-purple-dark mt-4 flex items-center space-x-1">
                  <span>&uarr; 12%</span>
                  <span className="text-ink-700 font-normal">peer trading momentum this week</span>
                </div>
              </div>

              {/* 2. Mint Green Card: Active Users / Orders */}
              <div className="bg-brutal-green border-2 border-black rounded-3xl p-6 shadow-brutal flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-ink-800 uppercase tracking-wider block">
                      Active Orders
                    </span>
                    <div className="text-4xl sm:text-5xl font-sans font-black text-black tracking-tight mt-1">
                      {myOrders.length > 0 ? myOrders.length : "1.2K"}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-black text-white border-2 border-black shadow-[2px_2px_0px_#FFF] flex items-center justify-center">
                    <Users className="w-6 h-6 text-brutal-green stroke-[2.5]" />
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-ink-950 mt-4 flex items-center space-x-1">
                  <span>&uarr; 8%</span>
                  <span className="text-ink-800 font-normal">verified student handovers</span>
                </div>
              </div>
            </div>

            {/* SMOOTH ACTIVITY CURVE CHART */}
            <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-3">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-ink-600">
                <span className="text-black font-black uppercase flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-brutal-purple-dark" />
                  <span className="text-sm">Campus Peer Exchange Activity</span>
                </span>
                <span className="text-[10px] bg-paper-100 px-2.5 py-1 rounded-lg border border-black/20">
                  Weekly Volume &bull; Real-time
                </span>
              </div>

              {/* Smooth Bézier SVG Chart with Purple Gradient Fill */}
              <div className="pt-2">
                <svg viewBox="0 0 500 100" className="w-full h-28 sm:h-32 overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="purpleDashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Gradient Area Fill */}
                  <path
                    d="M 0,80 Q 80,20 160,55 T 320,30 T 420,60 T 500,20 L 500,100 L 0,100 Z"
                    fill="url(#purpleDashGrad)"
                  />
                  {/* Top Curve Line */}
                  <path
                    d="M 0,80 Q 80,20 160,55 T 320,30 T 420,60 T 500,20"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  {/* Highlight Nodes */}
                  <circle cx="160" cy="55" r="5" fill="#FFD027" stroke="#000000" strokeWidth="2.5" />
                  <circle cx="320" cy="30" r="5" fill="#86EFAC" stroke="#000000" strokeWidth="2.5" />
                  <circle cx="500" cy="20" r="5" fill="#8B5CF6" stroke="#000000" strokeWidth="2.5" />
                </svg>

                {/* Day Labels */}
                <div className="flex justify-between text-xs font-mono font-bold text-ink-500 pt-2 border-t border-black/10">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* QUICK MANAGEMENT SHORTCUTS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-black rounded-3xl p-5 shadow-brutal">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-black">
                <Sparkles className="w-4 h-4 text-black" />
                <span>Quick Navigation Hub:</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("listings")}
                  className="px-4 py-2 bg-paper-100 hover:bg-brutal-yellow text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>My Listings ({myListings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="px-4 py-2 bg-paper-100 hover:bg-brutal-yellow text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>My Orders ({myOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="px-4 py-2 bg-paper-100 hover:bg-brutal-yellow text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account Settings</span>
                </button>
              </div>
            </div>

            {/* RECENT ITEMS PREVIEW GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Recent Posted Listings */}
              <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
                <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
                  <h3 className="font-sans font-black text-base text-black">
                    Recent Posted Items ({myListings.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("listings")}
                    className="text-xs font-mono font-bold text-black underline hover:text-brutal-purple-dark"
                  >
                    View All
                  </button>
                </div>

                {myListings.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-ink-600 font-medium">
                      No items posted yet. Start exchanging with your peers!
                    </p>
                    <Link
                      href="/listings/new"
                      className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brutal-yellow text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Post Item</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myListings.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 rounded-2xl border-2 border-black bg-paper-50 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <strong className="block font-sans font-black text-black truncate max-w-[200px]">
                            {item.title}
                          </strong>
                          <span className="font-mono text-ink-600">₹{item.price} &bull; {item.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black border border-black uppercase ${
                            item.status === "available" ? "bg-brutal-green text-black" : "bg-brutal-yellow text-black"
                          }`}>
                            {item.status}
                          </span>
                          <Link
                            href={`/listings/${item.id}`}
                            className="p-1.5 rounded-lg bg-white border border-black hover:bg-paper-100 text-black"
                            title="View Listing"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
                <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
                  <h3 className="font-sans font-black text-base text-black">
                    Recent Purchases ({myOrders.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-mono font-bold text-black underline hover:text-brutal-purple-dark"
                  >
                    View All
                  </button>
                </div>

                {myOrders.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-ink-600 font-medium">
                      No purchases made yet. Explore the campus notice board!
                    </p>
                    <Link
                      href="/browse"
                      className="inline-flex items-center space-x-1 px-4 py-1.5 bg-brutal-yellow text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
                    >
                      <span>Explore Notice Board</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="p-3 rounded-2xl border-2 border-black bg-paper-50 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <strong className="block font-sans font-black text-black">
                            Order #{order.id.slice(0, 8)}
                          </strong>
                          <span className="font-mono text-ink-600">₹{order.price} &bull; {order.meetupSpot || "CCTV Spot"}</span>
                        </div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-3 py-1.5 rounded-xl bg-black text-white text-xs font-mono font-bold hover:bg-ink-800 transition shadow-[1.5px_1.5px_0px_#000]"
                        >
                          Track
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── 2. MY LISTINGS TAB CONTENT ────────────────── */}
        {activeTab === "listings" && (
          <div className="space-y-5">
            <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setListingFilter("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 border-black transition ${
                    listingFilter === "all" ? "bg-black text-white shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  All ({myListings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("available")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 border-black transition ${
                    listingFilter === "available" ? "bg-brutal-green text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  Live ({availableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("pending")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 border-black transition ${
                    listingFilter === "pending" ? "bg-brutal-yellow text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  In Review ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("sold")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 border-black transition ${
                    listingFilter === "sold" ? "bg-paper-300 text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  Sold ({soldCount})
                </button>
              </div>

              <Link
                href="/listings/new"
                className="px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] flex items-center space-x-1.5 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Post New Item</span>
              </Link>
            </div>

            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal divide-y-2 divide-black/10">
              {filteredMyListings.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-ink-400 mx-auto" />
                  <h4 className="font-sans font-black text-base text-black">No listings found in this filter</h4>
                  <p className="text-xs font-medium text-ink-600">
                    Post study materials, textbooks, or lab equipment to connect with peers.
                  </p>
                </div>
              ) : (
                filteredMyListings.map((listing) => (
                  <div key={listing.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-paper-50 transition">
                    <div className="flex items-center space-x-4">
                      {listing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.thumbnail}
                          alt={listing.title}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-black shadow-[2px_2px_0px_#000] shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-black" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-sans font-black text-sm text-black">
                            {listing.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black border border-black uppercase ${
                            listing.status === "available"
                              ? "bg-brutal-green text-black"
                              : listing.status === "pending"
                              ? "bg-brutal-yellow text-black"
                              : "bg-paper-300 text-ink-900"
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-ink-600">
                          ₹{listing.price.toLocaleString("en-IN")} &bull; {listing.category} &bull; Condition: {listing.condition}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="px-3 py-1.5 bg-white hover:bg-paper-100 text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {listing.status !== "sold" && (
                        <button
                          type="button"
                          disabled={actionLoadingId === listing.id}
                          onClick={() => handleMarkSold(listing.id)}
                          className="px-3 py-1.5 bg-brutal-green hover:bg-brutal-green-dark text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center space-x-1 active:translate-x-[1px] active:translate-y-[1px]"
                          title="Mark this item as sold"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Sold</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={actionLoadingId === listing.id}
                        onClick={() => handleDeleteListing(listing.id)}
                        className="p-1.5 bg-white hover:bg-brutal-pink text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                        title="Delete listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ────────────────── 3. MY ORDERS TAB CONTENT ────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-ink-700">
                Tracking <strong>{myOrders.length}</strong> campus order record(s)
              </span>
              <Link
                href="/orders"
                className="px-3.5 py-1.5 bg-paper-100 hover:bg-brutal-yellow text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
              >
                View Full Orders Page
              </Link>
            </div>

            <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal divide-y-2 divide-black/10">
              {myOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-ink-400 mx-auto" />
                  <h4 className="font-sans font-black text-base text-black">No orders placed yet</h4>
                  <p className="text-xs font-medium text-ink-600">
                    When you purchase textbooks or gear from student peers, your handover tracking will appear here.
                  </p>
                  <Link
                    href="/browse"
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-brutal-yellow text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]"
                  >
                    <span>Browse Notice Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                myOrders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-paper-50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-black text-sm text-black">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-brutal-green text-black border border-black uppercase">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-ink-600">
                        ₹{order.price.toLocaleString("en-IN")} &bull; Meetup Spot: {order.meetupSpot || "CCTV Zone"} &bull; {order.paymentMethod}
                      </p>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] shrink-0 active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      Track Handover
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ────────────────── 4. ACCOUNT SETTINGS TAB CONTENT ────────────────── */}
        {activeTab === "settings" && (
          <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black/10 pb-4 gap-2">
              <div>
                <h3 className="font-sans font-black text-lg text-black">
                  Quick Profile Synchronization
                </h3>
                <p className="text-xs text-ink-600 font-medium">
                  Updates saved here synchronize across all your campus listings and handover records.
                </p>
              </div>
              <Link
                href="/profile"
                className="px-3.5 py-1.5 bg-paper-100 hover:bg-paper-200 text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
              >
                Open Full Profile & Avatar Editor
              </Link>
            </div>

            {profileMsg && (
              <div className={`p-3.5 rounded-2xl border-2 border-black font-bold text-xs ${
                profileMsg.type === "success" ? "bg-brutal-green text-black" : "bg-brutal-pink text-black"
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* If Academic credentials locked, show verification badge and hide inputs */}
              {isAcademicLocked ? (
                <div className="p-5 bg-paper-100 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-black flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-brutal-green-dark" />
                      <span>🔒 Verified Institutional Credentials</span>
                    </span>
                    <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-lg">
                      Permanently Locked
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                    <div className="bg-white p-3 rounded-xl border border-black/20">
                      <span className="text-[10px] text-ink-500 block uppercase font-bold">Faculty / Dept</span>
                      <strong className="text-black font-sans block mt-0.5 truncate">{profile?.course || course || "General"}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-black/20">
                      <span className="text-[10px] text-ink-500 block uppercase font-bold">Year</span>
                      <strong className="text-black font-sans block mt-0.5">{profile?.year || year || "Undergraduate"}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-black/20">
                      <span className="text-[10px] text-ink-500 block uppercase font-bold">Campus Location</span>
                      <strong className="text-black font-sans block mt-0.5 truncate">{profile?.campus || campus || "Campus"}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-ink-600 pt-1">
                    Institutional details are locked for student peer trust and handover invoice integrity. Contact administration at{" "}
                    <a href="mailto:campus.marketplace.ruas@gmail.com" className="text-black font-bold underline">
                      campus.marketplace.ruas@gmail.com
                    </a>{" "}
                    for official name/transfer modifications.
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-brutal-yellow/20 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] space-y-3">
                  <div className="text-xs font-mono font-bold text-black flex items-center space-x-1.5">
                    <span>⚠️ One-Time Institutional Verification:</span>
                  </div>
                  <p className="text-[11px] text-ink-700">
                    These academic details can only be saved once. After saving, the options will be permanently removed from the web form.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                        Department *
                      </label>
                      <input
                        type="text"
                        required
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-semibold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                        placeholder="B.Tech Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                        Academic Year *
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                      >
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                        <option>Postgraduate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                        Campus Residence *
                      </label>
                      <input
                        type="text"
                        required
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-semibold text-black focus:outline-none shadow-[2px_2px_0px_#000]"
                        placeholder="Gnanagangothri Campus"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                    Phone Number (for Call Seller Link) *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-black uppercase mb-1">
                    Student Bio / Seller Note
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
                    placeholder="Brief note about what you are trading on campus..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] flex items-center space-x-1.5 active:translate-x-[1px] active:translate-y-[1px] transition-all disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
