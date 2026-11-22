"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Badge, Button, Card, Input } from "@/components/ui";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Report } from "@/types/report";
import { Listing } from "@/types/listing";
import { Order } from "@/types/order";
import { UserProfile, UserRole, UserStatus } from "@/types/user";
import {
  populatePresentationDemoProducts,
  deleteAllPresentationDemoProducts,
} from "@/lib/presentationDemo";
import {
  ShieldAlert,
  ShieldCheck,
  Flag,
  Users,
  EyeOff,
  History,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Trash2,
  Database,
  ExternalLink,
  GraduationCap,
  Building,
  TrendingUp,
  Search,
  Package,
  Clock,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";

export default function DeanAdminConsolePage() {
  const { user, profile } = useAuth();

  // Active Navigation Tabs: Overview first, followed by Governance modules
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "reports" | "hidden" | "audit" | "demo">("overview");

  // State data
  const [reports, setReports] = useState<Report[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "student" | "verifier" | "suspended">("all");
  const [reportFilter, setReportFilter] = useState<"all" | "open" | "resolved" | "dismissed">("open");

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper to log administrative actions to immutable auditLog
  const logAdminAction = async (action: string, targetId: string, details?: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "auditLog"), {
        actorId: user.uid,
        actorEmail: profile?.email || user.email || "admin@msruas.ac.in",
        action,
        targetId,
        details: details || {},
        at: serverTimestamp(),
      });
    } catch (err) {
      console.error("[AuditLog Error]:", err);
    }
  };

  // 1. Subscribe to Reports
  useEffect(() => {
    const reportsRef = collection(db, "reports");
    const unsubscribe = onSnapshot(
      reportsRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Report[];
        setReports(list);
      },
      (err) => console.warn("Reports fetch warning:", err.message)
    );
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to All Listings
  useEffect(() => {
    const listingsRef = collection(db, "listings");
    const unsubscribe = onSnapshot(
      listingsRef,
      (snap) => {
        const allListings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
        setListings(allListings);
      },
      (err) => console.warn("Listings fetch warning:", err.message)
    );
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Orders to track campus trade volume
  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const unsubscribe = onSnapshot(
      ordersRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        setOrders(list);
      },
      (err) => console.warn("Orders fetch warning:", err.message)
    );
    return () => unsubscribe();
  }, []);

  // 4. Subscribe to Users
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() })) as UserProfile[];
        setUsersList(list);
      },
      (err) => console.warn("Users fetch warning:", err.message)
    );
    return () => unsubscribe();
  }, []);

  // 5. Subscribe to Audit Log
  useEffect(() => {
    const auditRef = collection(db, "auditLog");
    const unsubscribe = onSnapshot(
      auditRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];
        list.sort((a, b) => {
          const aT = a.at?.toMillis ? a.at.toMillis() : 0;
          const bT = b.at?.toMillis ? b.at.toMillis() : 0;
          return bT - aT;
        });
        setAuditLogs(list);
      },
      (err) => console.warn("Audit fetch warning:", err.message)
    );
    return () => unsubscribe();
  }, []);

  // Moderation Actions
  const handleReportAction = async (report: Report, resolution: "resolved" | "dismissed", restoreListing = false) => {
    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      await updateDoc(doc(db, "reports", report.id), {
        status: resolution,
        resolvedAt: serverTimestamp(),
      });

      if (restoreListing) {
        await updateDoc(doc(db, "listings", report.listingId), {
          status: "available",
          reportCount: 0,
          updatedAt: serverTimestamp(),
        });
      }

      await logAdminAction(`report_${resolution}`, report.id, {
        listingId: report.listingId,
        restored: restoreListing,
      });

      setFeedbackMsg({ type: "success", text: `Grievance report marked as ${resolution}.` });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Action failed: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleListingModeration = async (listingId: string, action: "restore" | "remove") => {
    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      if (action === "restore") {
        await updateDoc(doc(db, "listings", listingId), {
          status: "available",
          reportCount: 0,
          updatedAt: serverTimestamp(),
        });
        await logAdminAction("listing_reinstated", listingId);
        setFeedbackMsg({ type: "success", text: "Listing restored to campus notice board." });
      } else {
        await deleteDoc(doc(db, "listings", listingId));
        await logAdminAction("listing_purged", listingId);
        setFeedbackMsg({ type: "success", text: "Listing permanently purged from university database." });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Moderation action failed: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserStatusToggle = async (targetUser: UserProfile) => {
    setActionLoading(true);
    setFeedbackMsg(null);

    const newStatus: UserStatus = targetUser.status === "active" ? "suspended" : "active";

    try {
      await updateDoc(doc(db, "users", targetUser.uid), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction("user_status_change", targetUser.uid, { newStatus, email: targetUser.email });
      setFeedbackMsg({ type: "success", text: `Student account (${targetUser.email}) is now ${newStatus}.` });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Failed to update user status: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleToggle = async (targetUser: UserProfile) => {
    setActionLoading(true);
    setFeedbackMsg(null);

    const newRole: UserRole = targetUser.role === "student" ? "verifier" : "student";

    try {
      await updateDoc(doc(db, "users", targetUser.uid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      await logAdminAction("user_role_change", targetUser.uid, { newRole, email: targetUser.email });
      setFeedbackMsg({ type: "success", text: `Student ${targetUser.email} promoted/changed to ${newRole}.` });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Failed to change role: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePopulateDemoData = async () => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const count = await populatePresentationDemoProducts();
      await logAdminAction("populate_demo_products", "all", { count });
      setFeedbackMsg({ type: "success", text: `Successfully generated ${count} presentation demo products.` });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Failed to seed demo data: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeleteDemoData = async () => {
    if (!window.confirm("Are you sure you want to delete all presentation demo products?")) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const count = await deleteAllPresentationDemoProducts();
      await logAdminAction("delete_all_demo_products", "all", { count });
      setFeedbackMsg({ type: "success", text: `Removed ${count} presentation demo items.` });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Failed to clear demo data: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const openReports = reports.filter((r) => r.status === "open");
  const hiddenListings = listings.filter((l) => l.status === "hidden");
  const availableListings = listings.filter((l) => l.status === "available");
  const pendingListings = listings.filter((l) => l.status === "pending");
  const demoListings = listings.filter((l) => (l as any).isPresentationDemo === true || l.id.startsWith("demo_"));
  const verifiersList = usersList.filter((u) => u.role === "verifier");
  const suspendedList = usersList.filter((u) => u.status === "suspended");
  const totalVolume = orders.reduce((sum, o) => sum + (o.price || 0), 0);

  // Student directory search & filter
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.course || "").toLowerCase().includes(userSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (userRoleFilter === "verifier") return u.role === "verifier";
    if (userRoleFilter === "student") return u.role === "student";
    if (userRoleFilter === "suspended") return u.status === "suspended";
    return true;
  });

  // Grievance report filter
  const filteredReports = reports.filter((r) => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* ────────────────── DEAN EXECUTIVE MASTHEAD ────────────────── */}
        <Card variant="elevated" padding="md" className="!bg-modern-primary text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-warm text-modern-text-primary border border-white rounded-full font-mono font-semibold text-xs shadow-modern-sm">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>OFFICE OF THE DEAN OF STUDENT AFFAIRS</span>
            </div>
            <h1 className="font-sans font-semibold text-2xl sm:text-4xl text-white tracking-tight">
              Executive Governance Console
            </h1>
            <p className="text-xs font-mono font-bold text-modern-text-secondary">
              M.S. Ramaiah University of Applied Sciences &bull; Student Protection, Verification &amp; Audit Oversight
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
            <Link
              href="/verifier"
              className="px-3.5 py-1.5 bg-modern-success-light text-modern-text-primary rounded-xl border border-white shadow-modern-sm    transition-all flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-modern-text-primary stroke-[2.5]" />
              <span>Verifier Queue ({pendingListings.length})</span>
            </Link>
            <Badge variant="secondary" size="md" className="!bg-modern-error-light !text-modern-error !border-white">
              {openReports.length} Open Grievances
            </Badge>
          </div>
        </Card>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className={`p-4 border rounded-2xl text-sm flex items-center justify-between ${feedbackMsg.type === "success" ? "bg-modern-success-light border-modern-success/30 text-modern-success" : "bg-modern-error-light border-modern-error/30 text-modern-error"}`} role={feedbackMsg.type === "error" ? "alert" : "status"}>
            <span>{feedbackMsg.text}</span>
            <Button type="button" onClick={() => setFeedbackMsg(null)} variant="ghost" size="sm" aria-label="Dismiss feedback" className="ml-4">
              &times;
            </Button>
          </div>
        )}

        {/* ────────────────── DEAN GOVERNANCE NAVIGATION TABS ────────────────── */}
        <div className="flex space-x-2 border-b-2 border-modern-border pb-3 overflow-x-auto text-xs font-sans font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl border border-modern-border transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "overview"
                ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary hover:bg-modern-surface-hover shadow-modern-sm"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Campus Health Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-xl border border-modern-border transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "users"
                ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary hover:bg-modern-surface-hover shadow-modern-sm"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 rounded-xl border border-modern-border transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "reports"
                ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary hover:bg-modern-surface-hover shadow-modern-sm"
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Grievance Queue ({openReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hidden")}
            className={`px-4 py-2.5 rounded-xl border border-modern-border transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "hidden"
                ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary hover:bg-modern-surface-hover shadow-modern-sm"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Auto-Hidden ({hiddenListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 rounded-xl border border-modern-border transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "audit"
                ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary hover:bg-modern-surface-hover shadow-modern-sm"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Immutable Audit Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("demo")}
            className={`px-4 py-2.5 rounded-xl border border-modern-border transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "demo"
                ? "bg-modern-warm text-modern-text-primary shadow-modern-sm -translate-y-0.5"
                : "bg-white text-modern-text-secondary hover:bg-modern-surface-hover shadow-modern-sm"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Demo Data Controls</span>
          </button>
        </div>

        {/* ────────────────── 1. CAMPUS HEALTH & EXECUTIVE OVERVIEW ────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* KPI Cards Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-modern-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-modern-text-tertiary uppercase">Enrolled Students</span>
                    <div className="text-3xl sm:text-4xl font-sans font-semibold text-modern-text-primary mt-1">
                      {usersList.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-modern-warm border border-modern-border shadow-modern-sm flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-modern-text-primary" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-modern-text-tertiary mt-3">
                  <strong className="text-modern-text-primary">{usersList.length - suspendedList.length}</strong> active &bull; <strong className="text-modern-error">{suspendedList.length}</strong> suspended
                </div>
              </div>

              <div className="bg-modern-success-light border border-modern-border rounded-2xl p-5 shadow-modern-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-modern-text-primary uppercase">Live Study Items</span>
                    <div className="text-3xl sm:text-4xl font-sans font-semibold text-modern-text-primary mt-1">
                      {availableListings.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-modern-primary text-white border border-modern-border shadow-modern-sm flex items-center justify-center">
                    <Package className="w-5 h-5 text-modern-success" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-modern-text-primary font-bold mt-3">
                  {pendingListings.length} in verification queue
                </div>
              </div>

              <div className="bg-modern-primary-light border border-modern-border rounded-2xl p-5 shadow-modern-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-modern-primary uppercase">Peer Handover Volume</span>
                    <div className="text-3xl sm:text-4xl font-sans font-semibold text-modern-text-primary mt-1">
                      ₹{totalVolume.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-modern-primary text-white border border-modern-border shadow-modern-sm flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-modern-text-secondary mt-3">
                  {orders.length} campus transactions completed
                </div>
              </div>

              <div className="bg-white border border-modern-border rounded-2xl p-5 shadow-modern-sm flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-modern-text-tertiary uppercase">Quality Verifiers</span>
                    <div className="text-3xl sm:text-4xl font-sans font-semibold text-modern-text-primary mt-1">
                      {verifiersList.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-modern-success-light border border-modern-border shadow-modern-sm flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-modern-text-primary" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-modern-text-tertiary mt-3">
                  Student council verification representatives
                </div>
              </div>
            </div>

            {/* Quick Executive Action Hub */}
            <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-4">
              <div className="flex justify-between items-center border-b-2 border-modern-border/70 pb-3">
                <h3 className="font-sans font-semibold text-base text-modern-text-primary flex items-center space-x-2">
                  <Building className="w-4 h-4 text-modern-text-primary" />
                  <span>Executive Administrative Actions</span>
                </h3>
                <span className="text-xs font-mono font-bold text-modern-text-tertiary">MSRUAS Dean Portal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="p-4 bg-modern-bg hover:bg-modern-warm-light border border-modern-border rounded-2xl shadow-modern-sm text-left transition space-y-1"
                >
                  <strong className="block font-sans font-semibold text-sm text-modern-text-primary">Manage Student Identities</strong>
                  <p className="text-xs text-modern-text-tertiary font-medium">Search students, inspect locked academic credentials, or suspend accounts.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="p-4 bg-modern-bg hover:bg-modern-warm-light border border-modern-border rounded-2xl shadow-modern-sm text-left transition space-y-1"
                >
                  <strong className="block font-sans font-semibold text-sm text-modern-text-primary">Resolve Student Grievances</strong>
                  <p className="text-xs text-modern-text-tertiary font-medium">Moderate reported items, scam allegations, and take down counterfeit items.</p>
                </button>

                <Link
                  href="/verifier"
                  className="p-4 bg-modern-bg hover:bg-modern-success-light border border-modern-border rounded-2xl shadow-modern-sm text-left transition space-y-1 block"
                >
                  <strong className="block font-sans font-semibold text-sm text-modern-text-primary">Launch Verifier Queue</strong>
                  <p className="text-xs text-modern-text-tertiary font-medium">Inspect {pendingListings.length} pending submissions awaiting quality checks.</p>
                </Link>
              </div>
            </div>

            {/* Department Breakdown Grid */}
            <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-4">
              <h3 className="font-sans font-semibold text-base text-modern-text-primary">
                Institutional Department Representation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {["Computer Science & Engineering", "Electronics & Communication", "Mechanical & Aerospace", "Biotechnology & Sciences"].map((dept) => {
                  const count = usersList.filter((u) => (u.course || "").toLowerCase().includes(dept.toLowerCase().slice(0, 10))).length;
                  return (
                    <div key={dept} className="p-3 bg-modern-bg border border-modern-border rounded-xl">
                      <span className="text-[10px] text-modern-text-tertiary uppercase block font-bold">{dept.split("&")[0]}</span>
                      <strong className="text-modern-text-primary font-sans text-lg block mt-0.5">{count || 1} Student(s)</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── 2. STUDENT DIRECTORY & CREDENTIALS OVERSIGHT ────────────────── */}
        {activeTab === "users" && (
          <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-modern-border/70 pb-4">
              <div>
                <h3 className="font-sans font-semibold text-lg text-modern-text-primary">
                  Student Identity &amp; Credential Directory
                </h3>
                <p className="text-xs font-medium text-modern-text-tertiary">
                  Inspect locked academic credentials, suspend accounts, and manage verifier staff permissions.
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter("all")}
                  className={`px-3 py-1 rounded-xl border border-modern-border transition ${
                    userRoleFilter === "all" ? "bg-modern-primary text-white shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  All ({usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter("verifier")}
                  className={`px-3 py-1 rounded-xl border border-modern-border transition ${
                    userRoleFilter === "verifier" ? "bg-modern-success-light text-modern-text-primary shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  Verifiers ({verifiersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter("suspended")}
                  className={`px-3 py-1 rounded-xl border border-modern-border transition ${
                    userRoleFilter === "suspended" ? "bg-modern-error-light text-modern-text-primary shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  Suspended ({suspendedList.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search students by full name, university email (@msruas.ac.in), or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="text-sm"
              />
            </div>

            {/* User List Table */}
            <div className="overflow-x-auto border border-modern-border rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-modern-surface-hover border-b-2 border-modern-border text-modern-text-secondary font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Student Details</th>
                    <th className="p-3.5">Academic Credentials</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Dean Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-modern-border/70">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-modern-text-tertiary font-bold">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-modern-bg transition">
                        <td className="p-3.5">
                          <strong className="block font-sans font-semibold text-modern-text-primary">{u.name || "Student"}</strong>
                          <span className="text-modern-text-tertiary block">{u.email}</span>
                        </td>
                        <td className="p-3.5 space-y-0.5">
                          <span className="font-sans font-bold text-modern-text-primary block">{u.course || "General Engineering"}</span>
                          <span className="text-modern-text-tertiary block">{u.year || "1st Year"} &bull; {u.campus || "Bengaluru"}</span>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={u.role === "admin" ? "admin" : u.role === "verifier" ? "verifier" : "secondary"} size="xs">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={u.status === "active" ? "success" : "secondary"} size="xs" className={u.status === "active" ? "" : "!bg-modern-error-light !text-modern-error !border-modern-error/30"}>
                            {u.status || "active"}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {u.role !== "admin" && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleRoleToggle(u)}
                                className="px-2.5 py-1 bg-white hover:bg-modern-warm-light text-modern-text-primary font-semibold text-[10px] rounded-lg border border-modern-border shadow-modern-sm  "
                                title="Toggle Verifier Staff Role"
                              >
                                {u.role === "student" ? "Promote to Verifier" : "Demote to Student"}
                              </button>

                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleUserStatusToggle(u)}
                                className={`px-2.5 py-1 font-semibold text-[10px] rounded-lg border border-modern-border shadow-modern-sm   ${
                                  u.status === "active"
                                    ? "bg-modern-error-light hover:bg-modern-error-light text-modern-error"
                                    : "bg-modern-success-light text-modern-text-primary"
                                }`}
                              >
                                {u.status === "active" ? "Suspend Account" : "Reinstate Account"}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────────────── 3. STUDENT GRIEVANCE & MODERATION QUEUE ────────────────── */}
        {activeTab === "reports" && (
          <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-modern-border/70 pb-4">
              <div>
                <h3 className="font-sans font-semibold text-lg text-modern-text-primary">
                  Student Grievances &amp; Scam Moderation
                </h3>
                <p className="text-xs font-medium text-modern-text-tertiary">
                  Review student reports on fraudulent pricing, counterfeit products, or peer dispute escalations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReportFilter("open")}
                  className={`px-3 py-1 rounded-xl border border-modern-border transition ${
                    reportFilter === "open" ? "bg-modern-primary text-white shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  Open ({openReports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter("all")}
                  className={`px-3 py-1 rounded-xl border border-modern-border transition ${
                    reportFilter === "all" ? "bg-modern-primary text-white shadow-modern-sm" : "bg-white text-modern-text-primary hover:bg-modern-surface-hover"
                  }`}
                >
                  All Reports ({reports.length})
                </button>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-modern-success mx-auto" />
                <h4 className="font-sans font-semibold text-base text-modern-text-primary">No Grievances in this Filter</h4>
                <p className="text-xs text-modern-text-tertiary font-medium">All student transactions and listings are operating smoothly.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-modern-border/70">
                {filteredReports.map((report) => (
                  <div key={report.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-semibold text-sm text-modern-text-primary">Report #{report.id.slice(0, 8)}</span>
                        <Badge variant={report.status === "open" ? "secondary" : "success"} size="xs" className={report.status === "open" ? "!bg-modern-error-light !text-modern-error !border-modern-error/30" : ""}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-mono text-modern-text-secondary">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      <p className="text-[11px] font-mono text-modern-text-tertiary">
                        Listing ID: {report.listingId} &bull; Reported by Student: {report.reporterId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        href={`/listings/${report.listingId}`}
                        className="px-3 py-1.5 bg-white hover:bg-modern-surface-hover text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm flex items-center space-x-1"
                      >
                        <span>View Item</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {report.status === "open" && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReportAction(report, "resolved", false)}
                            className="px-3 py-1.5 bg-modern-error-light hover:bg-modern-error-light text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
                          >
                            Take Down Listing
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReportAction(report, "dismissed", true)}
                            className="px-3 py-1.5 bg-white hover:bg-modern-surface-hover text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
                          >
                            Dismiss Report
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────────────── 4. AUTO-HIDDEN CATALOG & PURGE ────────────────── */}
        {activeTab === "hidden" && (
          <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-5">
            <div className="border-b-2 border-modern-border/70 pb-4">
              <h3 className="font-sans font-semibold text-lg text-modern-text-primary">
                Auto-Hidden &amp; Flagged Listings Catalog
              </h3>
              <p className="text-xs font-medium text-modern-text-tertiary">
                Items automatically taken down due to 3+ user reports, counterfeit warnings, or dean intervention.
              </p>
            </div>

            {hiddenListings.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-modern-success mx-auto" />
                <h4 className="font-sans font-semibold text-base text-modern-text-primary">No Hidden Listings</h4>
                <p className="text-xs text-modern-text-tertiary font-medium">All campus listings are compliant and visible.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-modern-border/70">
                {hiddenListings.map((listing) => (
                  <div key={listing.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <strong className="font-sans font-semibold text-sm text-modern-text-primary">{listing.title}</strong>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-modern-error-light text-modern-text-primary border border-modern-border uppercase">
                          Hidden
                        </span>
                      </div>
                      <p className="text-xs font-mono text-modern-text-tertiary">
                        ₹{listing.price} &bull; {listing.category} &bull; Reports: {listing.reportCount || 0}
                      </p>
                      <p className="text-[11px] font-mono text-modern-text-tertiary">
                        Seller: {listing.sellerName} ({listing.sellerPhone || "No contact"})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleListingModeration(listing.id, "restore")}
                        className="px-3 py-1.5 bg-modern-success-light hover:bg-modern-success text-modern-text-primary font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
                      >
                        Restore to Board
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleListingModeration(listing.id, "remove")}
                        className="px-3 py-1.5 bg-modern-error hover:bg-modern-error text-white font-mono font-bold text-xs rounded-xl border border-modern-border shadow-modern-sm"
                      >
                        Permanently Purge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────────────── 5. IMMUTABLE DEAN AUDIT LEDGER ────────────────── */}
        {activeTab === "audit" && (
          <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-5">
            <div className="border-b-2 border-modern-border/70 pb-4">
              <h3 className="font-sans font-semibold text-lg text-modern-text-primary">
                Immutable Governance &amp; Moderation Audit Ledger
              </h3>
              <p className="text-xs font-medium text-modern-text-tertiary">
                Cryptographically tracked administrative actions, user status modifications, and listing purges.
              </p>
            </div>

            <div className="overflow-x-auto border border-modern-border rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-modern-surface-hover border-b-2 border-modern-border text-modern-text-secondary font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor (Admin Email)</th>
                    <th className="p-3.5">Action Executed</th>
                    <th className="p-3.5">Target Entity ID</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-modern-border/70">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-modern-text-tertiary font-bold">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-modern-bg transition">
                        <td className="p-3.5 whitespace-nowrap text-modern-text-tertiary">
                          {log.at?.toDate ? log.at.toDate().toLocaleString() : "Recently"}
                        </td>
                        <td className="p-3.5 font-bold text-modern-text-primary">{log.actorEmail}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-modern-border bg-modern-surface-hover text-modern-text-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-modern-text-secondary font-mono">{log.targetId}</td>
                        <td className="p-3.5 text-[11px] text-modern-text-tertiary max-w-[200px] truncate">
                          {JSON.stringify(log.details || {})}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────────────── 6. PRESENTATION & DEMO DATA CONTROLS ────────────────── */}
        {activeTab === "demo" && (
          <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm space-y-6">
            <div className="border-b-2 border-modern-border/70 pb-4">
              <h3 className="font-sans font-semibold text-lg text-modern-text-primary">
                Presentation &amp; Evaluation Controls
              </h3>
              <p className="text-xs font-medium text-modern-text-tertiary">
                Seed or purge demonstration listings for examiner walkthroughs and live presentations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-modern-bg border border-modern-border rounded-2xl shadow-modern-sm space-y-3">
                <div className="flex items-center space-x-2 font-sans font-semibold text-sm text-modern-text-primary">
                  <Sparkles className="w-5 h-5 text-modern-text-primary" />
                  <span>Seed Presentation Demo Gear</span>
                </div>
                <p className="text-xs font-medium text-modern-text-secondary leading-relaxed">
                  Generates verified university listings equipped with commercial-grade photorealistic photography and pre-validated syllabus checks.
                </p>
                <button
                  type="button"
                  onClick={handlePopulateDemoData}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-modern-warm hover:bg-modern-warm-hover text-modern-text-primary font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm   transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Demo Products (8)</span>
                </button>
              </div>

              <div className="p-5 bg-modern-bg border border-modern-border rounded-2xl shadow-modern-sm space-y-3">
                <div className="flex items-center space-x-2 font-sans font-semibold text-sm text-modern-text-primary">
                  <Trash2 className="w-5 h-5 text-modern-error" />
                  <span>Purge Presentation Demo Data</span>
                </div>
                <p className="text-xs font-medium text-modern-text-secondary leading-relaxed">
                  Safely clears all mock demo items marked with <code>isPresentationDemo: true</code>, leaving authentic student peer listings intact.
                </p>
                <button
                  type="button"
                  onClick={handleBulkDeleteDemoData}
                  disabled={actionLoading || demoListings.length === 0}
                  className="px-4 py-2 bg-modern-error hover:bg-modern-error text-white font-sans font-semibold text-xs rounded-xl border border-modern-border shadow-modern-sm   transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>Delete Demo Items ({demoListings.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
