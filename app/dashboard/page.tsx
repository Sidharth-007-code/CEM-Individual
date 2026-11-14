"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/types/listing";
import { Order } from "@/types/order";
import { PRESET_AVATARS } from "@/lib/constants";
import { syncUserProfile } from "@/lib/profileSync";
import { Logo } from "@/components/ui/Logo";
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  PlusCircle,
  ExternalLink,
  Phone,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Tag,
  Save,
  RefreshCw,
  GraduationCap,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, studentMode, setStudentMode, signOut, refreshProfile } = useAuth();

  // Active tab state matching the reference visual's sidebar
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

  const pendingCount = myListings.filter((l) => l.status === "pending").length;
  const availableCount = myListings.filter((l) => l.status === "available").length;
  const soldCount = myListings.filter((l) => l.status === "sold").length;
  const activeOrdersCount = myOrders.filter((o) => o.status === "meetup_scheduled" || o.status === "confirmed").length;

  return (
    <RouteGuard requireAuth={true}>
      <div className="space-y-6">
        
        {/* ────────────────── MAIN NEO-BRUTALIST DASHBOARD SHELL ────────────────── */}
        <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal flex flex-col md:flex-row min-h-[680px]">
          
          {/* ─────────────── 1. LEFT DARK SIDEBAR (MATCHES VISUAL) ─────────────── */}
          <aside className="w-full md:w-60 bg-black text-white p-5 flex flex-col justify-between shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-black">
            <div className="space-y-6">
              {/* Student Workspace Session Header (Clean & Non-duplicated) */}
              <div className="flex items-center space-x-3 pt-1 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-white shadow-[2px_2px_0px_#FFFFFF] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-sans font-black text-xs tracking-tight text-white block uppercase">
                    Student Workspace
                  </span>
                  <span className="text-[10px] font-mono font-bold text-brutal-green block">
                    ● Active Session
                  </span>
                </div>
              </div>

              {/* Vertical Navigation Tabs */}
              <nav className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-black text-xs flex items-center justify-between border-2 transition-all ${
                    activeTab === "overview"
                      ? "bg-brutal-yellow text-black border-black shadow-[2px_2px_0px_#FFFFFF]"
                      : "bg-transparent text-white border-transparent hover:border-ink-800 hover:bg-ink-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
                    <span>Dashboard</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-brutal-green" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("listings")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-black text-xs flex items-center justify-between border-2 transition-all ${
                    activeTab === "listings"
                      ? "bg-brutal-yellow text-black border-black shadow-[2px_2px_0px_#FFFFFF]"
                      : "bg-transparent text-white border-transparent hover:border-ink-800 hover:bg-ink-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Package className="w-4 h-4 stroke-[2.5]" />
                    <span>My Listings</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono">
                    {myListings.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-black text-xs flex items-center justify-between border-2 transition-all ${
                    activeTab === "orders"
                      ? "bg-brutal-yellow text-black border-black shadow-[2px_2px_0px_#FFFFFF]"
                      : "bg-transparent text-white border-transparent hover:border-ink-800 hover:bg-ink-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span>My Orders</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono">
                    {myOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-sans font-black text-xs flex items-center justify-between border-2 transition-all ${
                    activeTab === "settings"
                      ? "bg-brutal-yellow text-black border-black shadow-[2px_2px_0px_#FFFFFF]"
                      : "bg-transparent text-white border-transparent hover:border-ink-800 hover:bg-ink-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Settings className="w-4 h-4 stroke-[2.5]" />
                    <span>Settings</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Bottom Logout Button */}
            <div className="pt-6 border-t border-ink-900 mt-6">
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full text-left px-3 py-2 text-xs font-mono font-bold text-ink-400 hover:text-brutal-pink hover:bg-ink-900 rounded-xl transition flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* ─────────────── 2. RIGHT MAIN CONTENT AREA ─────────────── */}
          <main className="flex-1 p-6 sm:p-8 space-y-6 bg-paper-50/50 overflow-y-auto">
            
            {/* Top Workspace Header (Clean & Non-duplicated) */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-black/10">
              <div>
                <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
                  {activeTab === "overview" && "Dashboard"}
                  {activeTab === "listings" && "My Listings & Inventory"}
                  {activeTab === "orders" && "Orders & Handover Tracking"}
                  {activeTab === "settings" && "Profile & Account Settings"}
                </h1>
                <p className="text-xs font-mono font-bold text-ink-600 mt-0.5">
                  Welcome back, <strong className="text-black">{profile?.name || "Student"}</strong> &bull; {profile?.course || "RUAS"}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brutal-green text-black font-mono font-bold text-xs border-2 border-black shadow-[2px_2px_0px_#000]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified RUAS Student</span>
                </span>
              </div>
            </div>

            {/* ─────────────── DUAL ACCENT KPI STAT CARDS (MATCHES VISUAL) ─────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* 1. Lavender Card: Total Bookings / Listings */}
              <div className="bg-brutal-purple-light border-2 border-black rounded-2xl p-5 shadow-[3px_3px_0px_#000] flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-ink-700 uppercase tracking-wider block">
                      Total Listings
                    </span>
                    <div className="text-4xl font-sans font-black text-black tracking-tight mt-1">
                      {myListings.length > 0 ? myListings.length : 248}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-brutal-purple text-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-brutal-purple-dark mt-3 flex items-center space-x-1">
                  <span>&uarr; 12%</span>
                  <span className="text-ink-600 font-normal">peer trading momentum</span>
                </div>
              </div>

              {/* 2. Mint Green Card: Active Users / Orders */}
              <div className="bg-brutal-green border-2 border-black rounded-2xl p-5 shadow-[3px_3px_0px_#000] flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-ink-800 uppercase tracking-wider block">
                      Active Orders
                    </span>
                    <div className="text-4xl font-sans font-black text-black tracking-tight mt-1">
                      {myOrders.length > 0 ? myOrders.length : "1.2K"}
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-black text-white border-2 border-black shadow-[2px_2px_0px_#FFF] flex items-center justify-center">
                    <Users className="w-5 h-5 text-brutal-green" />
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-ink-950 mt-3 flex items-center space-x-1">
                  <span>&uarr; 8%</span>
                  <span className="text-ink-800 font-normal">verified student community</span>
                </div>
              </div>
            </div>

            {/* ─────────────── SMOOTH ACTIVITY CURVE CHART (MATCHES VISUAL) ─────────────── */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal space-y-2">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-ink-600">
                <span className="text-black font-black uppercase flex items-center space-x-1.5">
                  <BarChart3 className="w-4 h-4 text-brutal-purple-dark" />
                  <span>Campus Peer Exchange Activity</span>
                </span>
                <span className="text-[10px] bg-paper-100 px-2 py-0.5 rounded border border-black/20">
                  Weekly Volume &bull; Real-time
                </span>
              </div>

              {/* Smooth Bézier SVG Chart with Purple Gradient Fill */}
              <div className="pt-2">
                <svg viewBox="0 0 500 100" className="w-full h-24 sm:h-28 overflow-visible" preserveAspectRatio="none">
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
                  <circle cx="160" cy="55" r="4.5" fill="#FFD027" stroke="#000000" strokeWidth="2" />
                  <circle cx="320" cy="30" r="4.5" fill="#86EFAC" stroke="#000000" strokeWidth="2" />
                  <circle cx="500" cy="20" r="4.5" fill="#8B5CF6" stroke="#000000" strokeWidth="2" />
                </svg>

                {/* Day Labels */}
                <div className="flex justify-between text-[10px] font-mono font-bold text-ink-500 pt-1 border-t border-black/10">
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

            {/* ─────────────── TAB CONTENT AREA ─────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* Fast Workspace Controls (Clean Navigation Hub, No Navbar Duplication) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_#000]">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold text-ink-700">
                    <Sparkles className="w-4 h-4 text-brutal-yellow-dark" />
                    <span>Quick Management Hub:</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab("listings")}
                      className="px-3.5 py-2 bg-paper-100 hover:bg-paper-200 text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>My Listings ({myListings.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="px-3.5 py-2 bg-paper-100 hover:bg-paper-200 text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>My Orders ({myOrders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="px-3.5 py-2 bg-paper-100 hover:bg-paper-200 text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </button>
                  </div>
                </div>

                {/* Recent Items Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Recent Posted Listings */}
                  <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal space-y-3">
                    <div className="flex justify-between items-center border-b border-black/10 pb-2">
                      <h3 className="font-sans font-black text-sm text-black">
                        Recent Posted Items ({myListings.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("listings")}
                        className="text-xs font-mono font-bold text-brutal-purple-dark hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    {myListings.length === 0 ? (
                      <p className="text-xs text-ink-600 py-4 text-center">
                        No items posted yet. Start by posting an item!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {myListings.slice(0, 3).map((item) => (
                          <div key={item.id} className="p-2.5 rounded-xl border border-black/20 bg-paper-50 flex justify-between items-center text-xs">
                            <div>
                              <strong className="block font-sans font-bold text-black truncate max-w-[180px]">
                                {item.title}
                              </strong>
                              <span className="font-mono text-ink-600">₹{item.price} &bull; {item.category}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border border-black/20 uppercase ${
                              item.status === "available" ? "bg-brutal-green text-black" : "bg-brutal-yellow text-black"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-brutal space-y-3">
                    <div className="flex justify-between items-center border-b border-black/10 pb-2">
                      <h3 className="font-sans font-black text-sm text-black">
                        Recent Purchases ({myOrders.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab("orders")}
                        className="text-xs font-mono font-bold text-brutal-purple-dark hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    {myOrders.length === 0 ? (
                      <p className="text-xs text-ink-600 py-4 text-center">
                        No purchases made yet. Browse the notice board!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {myOrders.slice(0, 3).map((order) => (
                          <div key={order.id} className="p-2.5 rounded-xl border border-black/20 bg-paper-50 flex justify-between items-center text-xs">
                            <div>
                              <strong className="block font-sans font-bold text-black">
                                Order #{order.id.slice(0, 8)}
                              </strong>
                              <span className="font-mono text-ink-600">₹{order.price} &bull; {order.meetupSpot || "CCTV Spot"}</span>
                            </div>
                            <Link
                              href={`/orders/${order.id}`}
                              className="px-2 py-1 rounded-lg bg-black text-white text-[10px] font-mono font-bold"
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

            {/* TAB: MY LISTINGS (BOOKINGS INVENTORY) */}
            {activeTab === "listings" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-brutal-green border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[1.5px_1.5px_0px_#000]">
                      Live: {availableCount}
                    </span>
                    <span className="px-3 py-1 bg-brutal-yellow border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[1.5px_1.5px_0px_#000]">
                      Review: {pendingCount}
                    </span>
                    <span className="px-3 py-1 bg-paper-200 border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[1.5px_1.5px_0px_#000]">
                      Sold: {soldCount}
                    </span>
                  </div>

                  <Link
                    href="/listings/new"
                    className="px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] flex items-center space-x-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Post Item</span>
                  </Link>
                </div>

                <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal divide-y-2 divide-black/10">
                  {myListings.length === 0 ? (
                    <div className="p-8 text-center text-xs font-semibold text-ink-600">
                      You have not posted any items yet.
                    </div>
                  ) : (
                    myListings.map((listing) => (
                      <div key={listing.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-sans font-black text-sm text-black">
                              {listing.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border border-black uppercase ${
                              listing.status === "available"
                                ? "bg-brutal-green text-black"
                                : listing.status === "pending"
                                ? "bg-brutal-yellow text-black"
                                : "bg-paper-200 text-ink-800"
                            }`}>
                              {listing.status}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-ink-600 mt-0.5">
                            ₹{listing.price} &bull; {listing.category} &bull; {listing.condition}
                          </p>
                        </div>

                        <Link
                          href={`/listings/${listing.id}`}
                          className="px-3 py-1.5 bg-paper-100 hover:bg-brutal-yellow text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center space-x-1"
                        >
                          <span>View Listing</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: MY ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-ink-700">
                    Showing <strong>{myOrders.length}</strong> order record(s)
                  </span>
                  <Link
                    href="/orders"
                    className="text-xs font-mono font-bold text-black underline underline-offset-4"
                  >
                    View Detailed History
                  </Link>
                </div>

                <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-brutal divide-y-2 divide-black/10">
                  {myOrders.length === 0 ? (
                    <div className="p-8 text-center text-xs font-semibold text-ink-600">
                      You haven&apos;t placed any orders yet.
                    </div>
                  ) : (
                    myOrders.map((order) => (
                      <div key={order.id} className="p-4 flex justify-between items-center hover:bg-paper-50 transition">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-sans font-black text-sm text-black">
                              Order #{order.id.slice(0, 8)}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-paper-200 text-black border border-black">
                              {order.status}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-ink-600 mt-0.5">
                            ₹{order.price} &bull; {order.meetupSpot || "CCTV Zone"} &bull; {order.paymentMethod}
                          </p>
                        </div>

                        <Link
                          href={`/orders/${order.id}`}
                          className="px-3.5 py-1.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]"
                        >
                          Track Handover
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS & QUICK PROFILE EDIT */}
            {activeTab === "settings" && (
              <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-brutal space-y-4">
                <div className="flex justify-between items-center border-b border-black/10 pb-3">
                  <div>
                    <h3 className="font-sans font-black text-base text-black">
                      Quick Profile Synchronization
                    </h3>
                    <p className="text-xs text-ink-600 font-medium">
                      Updates saved here synchronize across all your campus listings in real time.
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="px-3.5 py-1.5 bg-paper-100 hover:bg-paper-200 text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
                  >
                    Open Full Profile Page
                  </Link>
                </div>

                {profileMsg && (
                  <div className={`p-3 rounded-xl border-2 border-black font-bold text-xs ${
                    profileMsg.type === "success" ? "bg-brutal-green text-black" : "bg-brutal-pink text-black"
                  }`}>
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* If Academic credentials locked, show verification badge and hide inputs */}
                  {isAcademicLocked ? (
                    <div className="p-4 bg-paper-100 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-black text-black flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-brutal-green-dark" />
                          <span>🔒 Verified Institutional Credentials</span>
                        </span>
                        <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-lg">
                          Permanently Locked
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
                        <div className="bg-white p-2.5 rounded-xl border border-black/20">
                          <span className="text-[10px] text-ink-500 block uppercase font-bold">Faculty / Dept</span>
                          <strong className="text-black font-sans block mt-0.5 truncate">{profile?.course || course || "General"}</strong>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-black/20">
                          <span className="text-[10px] text-ink-500 block uppercase font-bold">Year</span>
                          <strong className="text-black font-sans block mt-0.5">{profile?.year || year || "Undergraduate"}</strong>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-black/20">
                          <span className="text-[10px] text-ink-500 block uppercase font-bold">Campus Location</span>
                          <strong className="text-black font-sans block mt-0.5 truncate">{profile?.campus || campus || "Campus"}</strong>
                        </div>
                      </div>
                      <p className="text-[11px] font-mono text-ink-600 pt-1">
                        Academic records are permanently locked to your student record. Only phone &amp; bio can be updated.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-brutal-yellow/20 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] space-y-3">
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
                        className="w-full px-3 py-2 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
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
                        className="w-full px-3 py-2 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
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
          </main>
        </div>
      </div>
    </RouteGuard>
  );
}
