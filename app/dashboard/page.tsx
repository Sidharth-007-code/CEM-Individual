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
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  PlusCircle,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Save,
  RefreshCw,
  GraduationCap,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user, profile, role, loading: authLoading, refreshProfile } = useAuth();

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
    // Buyer order data is only rendered by the student dashboard. Wait for the
    // profile role to resolve so verifier/admin sessions never start this query.
    if (authLoading) return;
    if (!user || role !== "student") {
      setMyOrders([]);
      return;
    }
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
  }, [user, role, authLoading]);

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

  // ────────────────── ROLE-SPECIFIC PORTAL ROUTING ──────────────────
  if (role === "admin") {
    return (
      <RouteGuard allowedRoles={["admin"]}>
        <div className="max-w-4xl mx-auto space-y-6 my-6">
          <div className="bg-modern-primary text-white border border-modern-border rounded-2xl p-8 sm:p-10 shadow-modern-sm space-y-5  relative overflow-hidden">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-warm text-modern-text-primary border border-white rounded-full font-mono font-semibold text-xs">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>OFFICE OF THE DEAN OF STUDENT AFFAIRS</span>
            </div>
            <div className="space-y-1.5">
              <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-white tracking-tight">
                Dean Executive Governance Center
              </h1>
              <p className="text-xs font-mono font-bold text-modern-text-tertiary">
                Logged in as <strong className="text-white">{profile?.name || "Dean of Student Affairs"}</strong> ({profile?.email}) &bull; MSRUAS Institutional Administration
              </p>
            </div>
            <p className="text-xs font-mono text-modern-text-secondary leading-relaxed max-w-xl">
              Student marketplace governance, user suspension controls, grievance mediation, and audit trails are managed inside the dedicated Dean Executive Console.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Link
                href="/admin"
                className="px-6 py-3 bg-modern-warm hover:bg-modern-warm-light text-modern-text-primary font-sans font-semibold text-sm rounded-2xl border border-white shadow-modern-sm transition-all flex items-center space-x-2"
              >
                <ShieldAlert className="w-4 h-4 text-modern-text-primary" />
                <span>Launch Dean Executive Console &rarr;</span>
              </Link>
              <Link
                href="/verifier"
                className="px-5 py-3 bg-white hover:bg-modern-surface-hover text-modern-text-primary font-mono font-bold text-xs rounded-2xl border border-white shadow-modern-sm flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-modern-text-primary" />
                <span>Verifier Queue</span>
              </Link>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (role === "verifier") {
    return (
      <RouteGuard allowedRoles={["verifier", "admin"]}>
        <div className="max-w-4xl mx-auto space-y-6 my-6">
          <div className="bg-modern-primary text-white border border-modern-border rounded-2xl p-8 sm:p-10 shadow-modern-sm space-y-5  relative overflow-hidden">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-success-light text-modern-text-primary border border-modern-border rounded-full font-mono font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>STUDENT COUNCIL QUALITY DESK</span>
            </div>
            <div className="space-y-1.5">
              <h1 className="font-sans font-semibold text-3xl sm:text-4xl text-white tracking-tight">
                Quality Verifier Workstation
              </h1>
              <p className="text-xs font-mono font-bold text-modern-text-secondary">
                Logged in as <strong className="text-white">{profile?.name || "Verifier"}</strong> &bull; Student Quality Representative
              </p>
            </div>
            <p className="text-xs font-mono text-modern-text-secondary leading-relaxed max-w-xl">
              Inspect pending student textbook listings, review AI vision genuineness scans, check syllabus pricing guidelines, and approve items to the campus notice board.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <Link
                href="/verifier"
                className="px-6 py-3 bg-modern-success-light hover:bg-modern-success text-modern-text-primary font-sans font-semibold text-sm rounded-2xl border border-modern-border shadow-modern-sm transition-all flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-modern-text-primary" />
                <span>Open Verification Desk &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requireAuth={true}>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ────────────────── TOP WELCOME & WORKSPACE HEADER ────────────────── */}
        <div className="bg-white border border-modern-border rounded-2xl p-6 sm:p-8 shadow-modern-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-warm border border-modern-border rounded-full shadow-modern-sm text-xs font-mono font-semibold text-modern-text-primary mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>MSRUAS STUDENT WORKSPACE</span>
            </div>
            <h1 className="font-sans font-semibold text-2xl sm:text-4xl text-modern-text-primary tracking-tight">
              Student Dashboard
            </h1>
            <p className="text-xs font-mono font-bold text-modern-text-tertiary">
              Welcome back, <strong className="text-modern-text-primary">{profile?.name || "Student"}</strong> &bull; {profile?.course || "RUAS Department"} &bull; {profile?.campus || "Bengaluru"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-modern-success-light text-modern-text-primary font-mono font-bold text-xs border border-modern-border shadow-modern-sm">
              <ShieldCheck className="w-4 h-4 text-modern-text-primary stroke-[2.5]" />
              <span>Verified Student</span>
            </span>

            <Link
              href="/listings/new"
              className="px-4 py-1.5 bg-modern-warm hover:bg-modern-warm-light text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm transition-all flex items-center space-x-1.5"
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
            className={`px-4 py-2.5 rounded-2xl font-sans font-semibold text-xs flex items-center space-x-2 border transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-modern-warm text-modern-text-primary border-modern-border shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary border-modern-border shadow-modern-sm hover:bg-modern-surface-hover"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
            <span>Overview</span>
            <span className="w-2 h-2 rounded-full bg-modern-success-light" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("listings")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-semibold text-xs flex items-center space-x-2 border transition-all shrink-0 ${
              activeTab === "listings"
                ? "bg-modern-warm text-modern-text-primary border-modern-border shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary border-modern-border shadow-modern-sm hover:bg-modern-surface-hover"
            }`}
          >
            <Package className="w-4 h-4 stroke-[2.5]" />
            <span>My Listings</span>
            <span className="px-1.5 py-0.2 rounded-md bg-modern-primary text-white text-[10px] font-mono">
              {myListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-semibold text-xs flex items-center space-x-2 border transition-all shrink-0 ${
              activeTab === "orders"
                ? "bg-modern-warm text-modern-text-primary border-modern-border shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary border-modern-border shadow-modern-sm hover:bg-modern-surface-hover"
            }`}
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>My Orders</span>
            <span className="px-1.5 py-0.2 rounded-md bg-modern-primary text-white text-[10px] font-mono">
              {myOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-2xl font-sans font-semibold text-xs flex items-center space-x-2 border transition-all shrink-0 ${
              activeTab === "settings"
                ? "bg-modern-warm text-modern-text-primary border-modern-border shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary border-modern-border shadow-modern-sm hover:bg-modern-surface-hover"
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
              <div className="bg-modern-primary-light border border-modern-border rounded-2xl p-6 shadow-modern-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-modern-text-secondary uppercase tracking-wider block">
                      Total Listings
                    </span>
                    <div className="text-4xl sm:text-5xl font-sans font-semibold text-modern-text-primary tracking-tight mt-1">
                      {myListings.length}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-modern-primary text-white border border-modern-border shadow-modern-sm flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-xs font-medium text-modern-text-secondary mt-4">
                  {myListings.length === 1 ? "1 listing in your seller account" : `${myListings.length} listings in your seller account`}
                </div>
              </div>

              {/* 2. Mint Green Card: Active Users / Orders */}
              <div className="bg-modern-success-light border border-modern-border rounded-2xl p-6 shadow-modern-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-modern-text-secondary uppercase tracking-wider block">
                      Orders Placed
                    </span>
                    <div className="text-4xl sm:text-5xl font-sans font-semibold text-modern-text-primary tracking-tight mt-1">
                      {myOrders.length}
                    </div>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-modern-primary text-white border border-modern-border shadow-modern-sm flex items-center justify-center">
                    <Users className="w-6 h-6 text-modern-success stroke-[2.5]" />
                  </div>
                </div>

                <div className="text-xs font-medium text-modern-text-secondary mt-4">
                  {myOrders.length === 1 ? "1 order in your buyer account" : `${myOrders.length} orders in your buyer account`}
                </div>
              </div>
            </div>

            <Card variant="default" padding="md" className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-modern-primary" />
                <h3 className="text-sm font-semibold text-modern-text-primary">Your listing pipeline</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between rounded-xl border border-modern-border bg-modern-surface-hover px-4 py-3">
                  <span className="text-sm text-modern-text-secondary">Pending review</span>
                  <Badge variant="warning">{pendingCount}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-modern-border bg-modern-surface-hover px-4 py-3">
                  <span className="text-sm text-modern-text-secondary">Available</span>
                  <Badge variant="success">{availableCount}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-modern-border bg-modern-surface-hover px-4 py-3">
                  <span className="text-sm text-modern-text-secondary">Sold</span>
                  <Badge variant="secondary">{soldCount}</Badge>
                </div>
              </div>
              <p className="text-xs text-modern-text-tertiary">Counts reflect your listings from the live seller feed.</p>
            </Card>
            {/* QUICK MANAGEMENT SHORTCUTS */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-modern-border rounded-2xl p-5 shadow-modern-sm">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-modern-text-primary">
                <Sparkles className="w-4 h-4 text-modern-text-primary" />
                <span>Quick Navigation Hub:</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("listings")}
                  className="px-4 py-2 bg-modern-surface-hover hover:bg-modern-warm text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm transition flex items-center space-x-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>My Listings ({myListings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className="px-4 py-2 bg-modern-surface-hover hover:bg-modern-warm text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm transition flex items-center space-x-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>My Orders ({myOrders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="px-4 py-2 bg-modern-surface-hover hover:bg-modern-warm text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm transition flex items-center space-x-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account Settings</span>
                </button>
              </div>
            </div>

            {/* RECENT ITEMS PREVIEW GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Recent Posted Listings */}
              <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-4">
                <div className="flex justify-between items-center border-b-2 border-modern-border/70 pb-3">
                  <h3 className="font-sans font-semibold text-base text-modern-text-primary">
                    Recent Posted Items ({myListings.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("listings")}
                    className="text-xs font-mono font-bold text-modern-text-primary underline hover:text-modern-primary"
                  >
                    View All
                  </button>
                </div>

                {myListings.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-modern-text-tertiary font-medium">
                      No items posted yet. Start exchanging with your peers!
                    </p>
                    <Link
                      href="/listings/new"
                      className="inline-flex items-center space-x-1 px-4 py-1.5 bg-modern-warm text-modern-text-primary text-xs font-sans font-semibold rounded-xl border border-modern-border shadow-modern-sm"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Post Item</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myListings.slice(0, 3).map((item) => (
                      <div key={item.id} className="p-3 rounded-2xl border border-modern-border bg-modern-surface-hover flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <strong className="block font-sans font-semibold text-modern-text-primary truncate max-w-[200px]">
                            {item.title}
                          </strong>
                          <span className="font-mono text-modern-text-tertiary">₹{item.price} &bull; {item.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold border border-modern-border uppercase ${
                            item.status === "available" ? "bg-modern-success-light text-modern-text-primary" : "bg-modern-warm text-modern-text-primary"
                          }`}>
                            {item.status}
                          </span>
                          <Link
                            href={`/listings/${item.id}`}
                            className="p-1.5 rounded-lg bg-white border border-modern-border hover:bg-modern-surface-hover text-modern-text-primary"
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
              <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-4">
                <div className="flex justify-between items-center border-b-2 border-modern-border/70 pb-3">
                  <h3 className="font-sans font-semibold text-base text-modern-text-primary">
                    Recent Purchases ({myOrders.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-mono font-bold text-modern-text-primary underline hover:text-modern-primary"
                  >
                    View All
                  </button>
                </div>

                {myOrders.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-modern-text-tertiary font-medium">
                      No purchases made yet. Explore the campus notice board!
                    </p>
                    <Link
                      href="/browse"
                      className="inline-flex items-center space-x-1 px-4 py-1.5 bg-modern-warm text-modern-text-primary text-xs font-sans font-semibold rounded-xl border border-modern-border shadow-modern-sm"
                    >
                      <span>Explore Notice Board</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {myOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="p-3 rounded-2xl border border-modern-border bg-modern-surface-hover flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <strong className="block font-sans font-semibold text-modern-text-primary">
                            Order #{order.id.slice(0, 8)}
                          </strong>
                          <span className="font-mono text-modern-text-tertiary">₹{order.price} &bull; {order.meetupSpot || "CCTV Spot"}</span>
                        </div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-3 py-1.5 rounded-xl bg-modern-primary text-white text-xs font-mono font-bold hover:bg-modern-primary-hover transition shadow-modern-sm"
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
            <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-modern-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setListingFilter("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border border-modern-border transition ${
                    listingFilter === "all" ? "bg-modern-primary text-white shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  All ({myListings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("available")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border border-modern-border transition ${
                    listingFilter === "available" ? "bg-modern-success-light text-modern-text-primary shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  Live ({availableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("pending")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border border-modern-border transition ${
                    listingFilter === "pending" ? "bg-modern-warm text-modern-text-primary shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  In Review ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setListingFilter("sold")}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border border-modern-border transition ${
                    listingFilter === "sold" ? "bg-modern-surface-hover text-modern-text-primary shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  Sold ({soldCount})
                </button>
              </div>

              <Link
                href="/listings/new"
                className="px-4 py-2 bg-modern-warm hover:bg-modern-warm-light text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm flex items-center space-x-1.5 shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Post New Item</span>
              </Link>
            </div>

            <div className="bg-white border border-modern-border rounded-2xl overflow-hidden shadow-modern-sm divide-y divide-modern-border/70">
              {filteredMyListings.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Package className="w-10 h-10 text-modern-text-tertiary mx-auto" />
                  <h4 className="font-sans font-semibold text-base text-modern-text-primary">No listings found in this filter</h4>
                  <p className="text-xs font-medium text-modern-text-tertiary">
                    Post study materials, textbooks, or lab equipment to connect with peers.
                  </p>
                </div>
              ) : (
                filteredMyListings.map((listing) => (
                  <div key={listing.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-modern-surface-hover transition">
                    <div className="flex items-center space-x-4">
                      {listing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.thumbnail}
                          alt={listing.title}
                          className="w-16 h-16 rounded-xl object-cover border border-modern-border shadow-modern-sm shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-modern-warm border border-modern-border flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-modern-text-primary" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-sans font-semibold text-sm text-modern-text-primary">
                            {listing.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border border-modern-border uppercase ${
                            listing.status === "available"
                              ? "bg-modern-success-light text-modern-text-primary"
                              : listing.status === "pending"
                              ? "bg-modern-warm text-modern-text-primary"
                              : "bg-modern-surface-hover text-modern-text-secondary"
                          }`}>
                            {listing.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-modern-text-tertiary">
                          ₹{listing.price.toLocaleString("en-IN")} &bull; {listing.category} &bull; Condition: {listing.condition}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="px-3 py-1.5 bg-white hover:bg-modern-surface-hover text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {listing.status !== "sold" && (
                        <button
                          type="button"
                          disabled={actionLoadingId === listing.id}
                          onClick={() => handleMarkSold(listing.id)}
                          className="px-3 py-1.5 bg-modern-success-light hover:bg-modern-success text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm flex items-center space-x-1"
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
                        className="p-1.5 bg-white hover:bg-modern-error-light text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
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
            <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-modern-sm flex justify-between items-center">
              <span className="text-xs font-mono font-bold text-modern-text-secondary">
                Tracking <strong>{myOrders.length}</strong> campus order record(s)
              </span>
              <Link
                href="/orders"
                className="px-3.5 py-1.5 bg-modern-surface-hover hover:bg-modern-warm text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
              >
                View Full Orders Page
              </Link>
            </div>

            <div className="bg-white border border-modern-border rounded-2xl overflow-hidden shadow-modern-sm divide-y divide-modern-border/70">
              {myOrders.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <ShoppingBag className="w-10 h-10 text-modern-text-tertiary mx-auto" />
                  <h4 className="font-sans font-semibold text-base text-modern-text-primary">No orders placed yet</h4>
                  <p className="text-xs font-medium text-modern-text-tertiary">
                    When you purchase textbooks or gear from student peers, your handover tracking will appear here.
                  </p>
                  <Link
                    href="/browse"
                    className="inline-flex items-center space-x-1 px-4 py-2 bg-modern-warm text-modern-text-primary text-xs font-sans font-semibold rounded-xl border border-modern-border shadow-modern-sm"
                  >
                    <span>Browse Notice Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                myOrders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-modern-surface-hover transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-semibold text-sm text-modern-text-primary">
                          Order #{order.id.slice(0, 8)}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-lg bg-modern-success-light text-modern-text-primary border border-modern-border uppercase">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-modern-text-tertiary">
                        ₹{order.price.toLocaleString("en-IN")} &bull; Meetup Spot: {order.meetupSpot || "CCTV Zone"} &bull; {order.paymentMethod}
                      </p>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 bg-modern-warm hover:bg-modern-warm-light text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm shrink-0"
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
          <div className="bg-white border border-modern-border rounded-2xl p-6 sm:p-8 shadow-modern-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-modern-border/70 pb-4 gap-2">
              <div>
                <h3 className="font-sans font-semibold text-lg text-modern-text-primary">
                  Quick Profile Synchronization
                </h3>
                <p className="text-xs text-modern-text-tertiary font-medium">
                  Updates saved here synchronize across all your campus listings and handover records.
                </p>
              </div>
              <Link
                href="/profile"
                className="px-3.5 py-1.5 bg-modern-surface-hover hover:bg-modern-surface-hover text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
              >
                Open Full Profile & Avatar Editor
              </Link>
            </div>

            {profileMsg && (
              <div className={`p-3.5 rounded-2xl border border-modern-border font-bold text-xs ${
                profileMsg.type === "success" ? "bg-modern-success-light text-modern-text-primary" : "bg-modern-error-light text-modern-text-primary"
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* If Academic credentials locked, show verification badge and hide inputs */}
              {isAcademicLocked ? (
                <div className="p-5 bg-modern-surface-hover border border-modern-border rounded-2xl shadow-modern-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-modern-text-primary flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-modern-success" />
                      <span>🔒 Verified Institutional Credentials</span>
                    </span>
                    <span className="text-[10px] font-mono bg-modern-primary text-white px-2 py-0.5 rounded-lg">
                      Permanently Locked
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                    <div className="bg-white p-3 rounded-xl border border-modern-border">
                      <span className="text-[10px] text-modern-text-tertiary block uppercase font-bold">Faculty / Dept</span>
                      <strong className="text-modern-text-primary font-sans block mt-0.5 truncate">{profile?.course || course || "General"}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-modern-border">
                      <span className="text-[10px] text-modern-text-tertiary block uppercase font-bold">Year</span>
                      <strong className="text-modern-text-primary font-sans block mt-0.5">{profile?.year || year || "Undergraduate"}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-modern-border">
                      <span className="text-[10px] text-modern-text-tertiary block uppercase font-bold">Campus Location</span>
                      <strong className="text-modern-text-primary font-sans block mt-0.5 truncate">{profile?.campus || campus || "Campus"}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-modern-text-tertiary pt-1">
                    Institutional details are locked for student peer trust and handover invoice integrity. Contact administration at{" "}
                    <a href="mailto:campus.marketplace.ruas@gmail.com" className="text-modern-text-primary font-bold underline">
                      campus.marketplace.ruas@gmail.com
                    </a>{" "}
                    for official name/transfer modifications.
                  </p>
                </div>
              ) : (
                <div className="p-5 bg-modern-warning-light border border-modern-border rounded-2xl shadow-modern-sm space-y-3">
                  <div className="text-xs font-mono font-bold text-modern-text-primary flex items-center space-x-1.5">
                    <span>⚠️ One-Time Institutional Verification:</span>
                  </div>
                  <p className="text-[11px] text-modern-text-secondary">
                    These academic details can only be saved once. After saving, the options will be permanently removed from the web form.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase mb-1">
                        Department *
                      </label>
                      <Input
                        type="text"
                        required
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-modern-border rounded-xl text-xs font-semibold text-modern-text-primary focus:outline-none shadow-modern-sm"
                        placeholder="B.Tech Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase mb-1">
                        Academic Year *
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-modern-border rounded-xl text-xs font-mono font-bold text-modern-text-primary focus:outline-none shadow-modern-sm"
                      >
                        <option>1st Year</option>
                        <option>2nd Year</option>
                        <option>3rd Year</option>
                        <option>4th Year</option>
                        <option>Postgraduate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase mb-1">
                        Campus Residence *
                      </label>
                      <Input
                        type="text"
                        required
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-modern-border rounded-xl text-xs font-semibold text-modern-text-primary focus:outline-none shadow-modern-sm"
                        placeholder="Gnanagangothri Campus"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase mb-1">
                    Phone Number (for Call Seller Link) *
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-mono font-bold text-modern-text-primary focus:outline-none focus:bg-white shadow-modern-sm"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase mb-1">
                    Student Bio / Seller Note
                  </label>
                  <Textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-medium text-modern-text-primary focus:outline-none focus:bg-white shadow-modern-sm"
                    placeholder="Brief note about what you are trading on campus..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="md" disabled={savingProfile} className="flex items-center space-x-1.5">
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
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
