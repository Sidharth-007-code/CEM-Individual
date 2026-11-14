"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
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
        <div className="bg-black text-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-[6px_6px_0px_#FFD027] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-grid-pattern relative overflow-hidden">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brutal-yellow text-black border-2 border-white rounded-full font-mono font-black text-xs shadow-[2px_2px_0px_#FFF]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>OFFICE OF THE DEAN OF STUDENT AFFAIRS</span>
            </div>
            <h1 className="font-sans font-black text-2xl sm:text-4xl text-white tracking-tight">
              Executive Governance Console
            </h1>
            <p className="text-xs font-mono font-bold text-ink-300">
              M.S. Ramaiah University of Applied Sciences &bull; Student Protection, Verification &amp; Audit Oversight
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
            <Link
              href="/verifier"
              className="px-3.5 py-1.5 bg-brutal-green text-black rounded-xl border-2 border-white shadow-[2px_2px_0px_#FFF] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Verifier Queue ({pendingListings.length})</span>
            </Link>
            <span className="px-3 py-1.5 bg-admin-100 text-admin-900 rounded-xl border-2 border-white shadow-[2px_2px_0px_#FFF]">
              {openReports.length} Open Grievances
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            className={`p-4 border-2 border-black rounded-2xl text-xs font-bold shadow-brutal flex items-center justify-between ${
              feedbackMsg.type === "success" ? "bg-brutal-green text-black" : "bg-brutal-pink text-black"
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button type="button" onClick={() => setFeedbackMsg(null)} className="text-black font-mono font-black ml-4">
              &times;
            </button>
          </div>
        )}

        {/* ────────────────── DEAN GOVERNANCE NAVIGATION TABS ────────────────── */}
        <div className="flex space-x-2 border-b-2 border-black pb-3 overflow-x-auto text-xs font-sans font-black scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "overview"
                ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-700 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Campus Health Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "users"
                ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-700 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Student Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "reports"
                ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-700 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Grievance Queue ({openReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hidden")}
            className={`px-4 py-2.5 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "hidden"
                ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-700 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Auto-Hidden ({hiddenListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "audit"
                ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-700 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Immutable Audit Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("demo")}
            className={`px-4 py-2.5 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === "demo"
                ? "bg-brutal-yellow text-black shadow-[3px_3px_0px_#000] -translate-y-0.5"
                : "bg-white text-ink-700 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
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
              
              <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-ink-600 uppercase">Enrolled Students</span>
                    <div className="text-3xl sm:text-4xl font-sans font-black text-black mt-1">
                      {usersList.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-black" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-ink-600 mt-3">
                  <strong className="text-black">{usersList.length - suspendedList.length}</strong> active &bull; <strong className="text-admin-700">{suspendedList.length}</strong> suspended
                </div>
              </div>

              <div className="bg-brutal-green border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-black uppercase">Live Study Items</span>
                    <div className="text-3xl sm:text-4xl font-sans font-black text-black mt-1">
                      {availableListings.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-black text-white border-2 border-black shadow-[1.5px_1.5px_0px_#FFF] flex items-center justify-center">
                    <Package className="w-5 h-5 text-brutal-green" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-black font-bold mt-3">
                  {pendingListings.length} in verification queue
                </div>
              </div>

              <div className="bg-brutal-purple-light border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-brutal-purple-dark uppercase">Peer Handover Volume</span>
                    <div className="text-3xl sm:text-4xl font-sans font-black text-black mt-1">
                      ₹{totalVolume.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brutal-purple text-white border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-ink-700 mt-3">
                  {orders.length} campus transactions completed
                </div>
              </div>

              <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-ink-600 uppercase">Quality Verifiers</span>
                    <div className="text-3xl sm:text-4xl font-sans font-black text-black mt-1">
                      {verifiersList.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-brutal-green border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-black" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-ink-600 mt-3">
                  Student council verification representatives
                </div>
              </div>
            </div>

            {/* Quick Executive Action Hub */}
            <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
              <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
                <h3 className="font-sans font-black text-base text-black flex items-center space-x-2">
                  <Building className="w-4 h-4 text-black" />
                  <span>Executive Administrative Actions</span>
                </h3>
                <span className="text-xs font-mono font-bold text-ink-500">MSRUAS Dean Portal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="p-4 bg-paper-50 hover:bg-brutal-yellow border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] text-left transition space-y-1"
                >
                  <strong className="block font-sans font-black text-sm text-black">Manage Student Identities</strong>
                  <p className="text-xs text-ink-600 font-medium">Search students, inspect locked academic credentials, or suspend accounts.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("reports")}
                  className="p-4 bg-paper-50 hover:bg-brutal-yellow border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] text-left transition space-y-1"
                >
                  <strong className="block font-sans font-black text-sm text-black">Resolve Student Grievances</strong>
                  <p className="text-xs text-ink-600 font-medium">Moderate reported items, scam allegations, and take down counterfeit items.</p>
                </button>

                <Link
                  href="/verifier"
                  className="p-4 bg-paper-50 hover:bg-brutal-green border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] text-left transition space-y-1 block"
                >
                  <strong className="block font-sans font-black text-sm text-black">Launch Verifier Queue</strong>
                  <p className="text-xs text-ink-600 font-medium">Inspect {pendingListings.length} pending submissions awaiting quality checks.</p>
                </Link>
              </div>
            </div>

            {/* Department Breakdown Grid */}
            <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
              <h3 className="font-sans font-black text-base text-black">
                Institutional Department Representation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                {["Computer Science & Engineering", "Electronics & Communication", "Mechanical & Aerospace", "Biotechnology & Sciences"].map((dept) => {
                  const count = usersList.filter((u) => (u.course || "").toLowerCase().includes(dept.toLowerCase().slice(0, 10))).length;
                  return (
                    <div key={dept} className="p-3 bg-paper-50 border-2 border-black rounded-xl">
                      <span className="text-[10px] text-ink-500 uppercase block font-bold">{dept.split("&")[0]}</span>
                      <strong className="text-black font-sans text-lg block mt-0.5">{count || 1} Student(s)</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── 2. STUDENT DIRECTORY & CREDENTIALS OVERSIGHT ────────────────── */}
        {activeTab === "users" && (
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black/10 pb-4">
              <div>
                <h3 className="font-sans font-black text-lg text-black">
                  Student Identity &amp; Credential Directory
                </h3>
                <p className="text-xs font-medium text-ink-600">
                  Inspect locked academic credentials, suspend accounts, and manage verifier staff permissions.
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter("all")}
                  className={`px-3 py-1 rounded-xl border-2 border-black transition ${
                    userRoleFilter === "all" ? "bg-black text-white shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  All ({usersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter("verifier")}
                  className={`px-3 py-1 rounded-xl border-2 border-black transition ${
                    userRoleFilter === "verifier" ? "bg-brutal-green text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  Verifiers ({verifiersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter("suspended")}
                  className={`px-3 py-1 rounded-xl border-2 border-black transition ${
                    userRoleFilter === "suspended" ? "bg-brutal-pink text-black shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  Suspended ({suspendedList.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-ink-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students by full name, university email (@msruas.ac.in), or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
              />
            </div>

            {/* User List Table */}
            <div className="overflow-x-auto border-2 border-black rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-100 border-b-2 border-black text-ink-800 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Student Details</th>
                    <th className="p-3.5">Academic Credentials</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Dean Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-ink-500 font-bold">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-paper-50 transition">
                        <td className="p-3.5">
                          <strong className="block font-sans font-black text-black">{u.name || "Student"}</strong>
                          <span className="text-ink-600 block">{u.email}</span>
                        </td>
                        <td className="p-3.5 space-y-0.5">
                          <span className="font-sans font-bold text-black block">{u.course || "General Engineering"}</span>
                          <span className="text-ink-600 block">{u.year || "1st Year"} &bull; {u.campus || "Bengaluru"}</span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-black uppercase ${
                            u.role === "admin"
                              ? "bg-black text-white"
                              : u.role === "verifier"
                              ? "bg-brutal-green text-black"
                              : "bg-paper-200 text-black"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-black uppercase ${
                            u.status === "active" ? "bg-brutal-green text-black" : "bg-brutal-pink text-black"
                          }`}>
                            {u.status || "active"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {u.role !== "admin" && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleRoleToggle(u)}
                                className="px-2.5 py-1 bg-white hover:bg-brutal-yellow text-black font-black text-[10px] rounded-lg border border-black shadow-[1px_1px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                                title="Toggle Verifier Staff Role"
                              >
                                {u.role === "student" ? "Promote to Verifier" : "Demote to Student"}
                              </button>

                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handleUserStatusToggle(u)}
                                className={`px-2.5 py-1 font-black text-[10px] rounded-lg border border-black shadow-[1px_1px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] ${
                                  u.status === "active"
                                    ? "bg-admin-100 hover:bg-brutal-pink text-admin-900"
                                    : "bg-brutal-green text-black"
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
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black/10 pb-4">
              <div>
                <h3 className="font-sans font-black text-lg text-black">
                  Student Grievances &amp; Scam Moderation
                </h3>
                <p className="text-xs font-medium text-ink-600">
                  Review student reports on fraudulent pricing, counterfeit products, or peer dispute escalations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReportFilter("open")}
                  className={`px-3 py-1 rounded-xl border-2 border-black transition ${
                    reportFilter === "open" ? "bg-black text-white shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  Open ({openReports.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReportFilter("all")}
                  className={`px-3 py-1 rounded-xl border-2 border-black transition ${
                    reportFilter === "all" ? "bg-black text-white shadow-[1.5px_1.5px_0px_#000]" : "bg-white text-black hover:bg-paper-100"
                  }`}
                >
                  All Reports ({reports.length})
                </button>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-brutal-green mx-auto" />
                <h4 className="font-sans font-black text-base text-black">No Grievances in this Filter</h4>
                <p className="text-xs text-ink-600 font-medium">All student transactions and listings are operating smoothly.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10">
                {filteredReports.map((report) => (
                  <div key={report.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-black text-sm text-black">Report #{report.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md border border-black uppercase ${
                          report.status === "open" ? "bg-brutal-pink text-black" : "bg-brutal-green text-black"
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-ink-800">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      <p className="text-[11px] font-mono text-ink-600">
                        Listing ID: {report.listingId} &bull; Reported by Student: {report.reporterId}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        href={`/listings/${report.listingId}`}
                        className="px-3 py-1.5 bg-white hover:bg-paper-100 text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center space-x-1"
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
                            className="px-3 py-1.5 bg-admin-100 hover:bg-brutal-pink text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
                          >
                            Take Down Listing
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReportAction(report, "dismissed", true)}
                            className="px-3 py-1.5 bg-white hover:bg-paper-100 text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
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
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-5">
            <div className="border-b-2 border-black/10 pb-4">
              <h3 className="font-sans font-black text-lg text-black">
                Auto-Hidden &amp; Flagged Listings Catalog
              </h3>
              <p className="text-xs font-medium text-ink-600">
                Items automatically taken down due to 3+ user reports, counterfeit warnings, or dean intervention.
              </p>
            </div>

            {hiddenListings.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle className="w-10 h-10 text-brutal-green mx-auto" />
                <h4 className="font-sans font-black text-base text-black">No Hidden Listings</h4>
                <p className="text-xs text-ink-600 font-medium">All campus listings are compliant and visible.</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10">
                {hiddenListings.map((listing) => (
                  <div key={listing.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <strong className="font-sans font-black text-sm text-black">{listing.title}</strong>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-brutal-pink text-black border border-black uppercase">
                          Hidden
                        </span>
                      </div>
                      <p className="text-xs font-mono text-ink-600">
                        ₹{listing.price} &bull; {listing.category} &bull; Reports: {listing.reportCount || 0}
                      </p>
                      <p className="text-[11px] font-mono text-ink-500">
                        Seller: {listing.sellerName} ({listing.sellerPhone || "No contact"})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleListingModeration(listing.id, "restore")}
                        className="px-3 py-1.5 bg-brutal-green hover:bg-brutal-green-dark text-black font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
                      >
                        Restore to Board
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleListingModeration(listing.id, "remove")}
                        className="px-3 py-1.5 bg-admin-600 hover:bg-admin-700 text-white font-mono font-bold text-xs rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
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
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-5">
            <div className="border-b-2 border-black/10 pb-4">
              <h3 className="font-sans font-black text-lg text-black">
                Immutable Governance &amp; Moderation Audit Ledger
              </h3>
              <p className="text-xs font-medium text-ink-600">
                Cryptographically tracked administrative actions, user status modifications, and listing purges.
              </p>
            </div>

            <div className="overflow-x-auto border-2 border-black rounded-2xl">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-paper-100 border-b-2 border-black text-ink-800 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor (Admin Email)</th>
                    <th className="p-3.5">Action Executed</th>
                    <th className="p-3.5">Target Entity ID</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-ink-500 font-bold">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-paper-50 transition">
                        <td className="p-3.5 whitespace-nowrap text-ink-600">
                          {log.at?.toDate ? log.at.toDate().toLocaleString() : "Recently"}
                        </td>
                        <td className="p-3.5 font-bold text-black">{log.actorEmail}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black border border-black bg-paper-200 text-black">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 text-ink-700 font-mono">{log.targetId}</td>
                        <td className="p-3.5 text-[11px] text-ink-500 max-w-[200px] truncate">
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
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-6">
            <div className="border-b-2 border-black/10 pb-4">
              <h3 className="font-sans font-black text-lg text-black">
                Presentation &amp; Evaluation Controls
              </h3>
              <p className="text-xs font-medium text-ink-600">
                Seed or purge demonstration listings for examiner walkthroughs and live presentations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-paper-50 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] space-y-3">
                <div className="flex items-center space-x-2 font-sans font-black text-sm text-black">
                  <Sparkles className="w-5 h-5 text-black" />
                  <span>Seed Presentation Demo Gear</span>
                </div>
                <p className="text-xs font-medium text-ink-700 leading-relaxed">
                  Generates verified university listings equipped with commercial-grade photorealistic photography and pre-validated syllabus checks.
                </p>
                <button
                  type="button"
                  onClick={handlePopulateDemoData}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Demo Products (8)</span>
                </button>
              </div>

              <div className="p-5 bg-paper-50 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] space-y-3">
                <div className="flex items-center space-x-2 font-sans font-black text-sm text-black">
                  <Trash2 className="w-5 h-5 text-admin-600" />
                  <span>Purge Presentation Demo Data</span>
                </div>
                <p className="text-xs font-medium text-ink-700 leading-relaxed">
                  Safely clears all mock demo items marked with <code>isPresentationDemo: true</code>, leaving authentic student peer listings intact.
                </p>
                <button
                  type="button"
                  onClick={handleBulkDeleteDemoData}
                  disabled={actionLoading || demoListings.length === 0}
                  className="px-4 py-2 bg-admin-600 hover:bg-admin-700 text-white font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all flex items-center space-x-1.5 disabled:opacity-50"
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
