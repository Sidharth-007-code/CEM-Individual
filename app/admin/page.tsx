"use client";

import React, { useState, useEffect } from "react";
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
import { UserProfile, UserRole, UserStatus } from "@/types/user";
import {
  populatePresentationDemoProducts,
  deleteAllPresentationDemoProducts,
} from "@/lib/presentationDemo";
import {
  ShieldAlert,
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
} from "lucide-react";

export default function AdminConsolePage() {
  const { user, profile } = useAuth();

  // Active Admin Tabs
  const [activeTab, setActiveTab] = useState<"demo" | "reports" | "hidden" | "users" | "audit">("demo");

  // State data
  const [reports, setReports] = useState<Report[]>([]);
  const [hiddenListings, setHiddenListings] = useState<Listing[]>([]);
  const [demoListings, setDemoListings] = useState<Listing[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
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

  // 2. Subscribe to All Listings to track Hidden & Demo products
  useEffect(() => {
    const listingsRef = collection(db, "listings");
    const unsubscribe = onSnapshot(
      listingsRef,
      (snap) => {
        const allListings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));
        setHiddenListings(allListings.filter((l) => l.status === "hidden"));
        setDemoListings(allListings.filter((l) => (l as any).isPresentationDemo === true || l.id.startsWith("demo_")));
      },
      (err) => console.warn("Listings fetch warning:", err.message)
    );
    return () => unsubscribe();
  }, []);

  // 3. Subscribe to Users
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

  // 4. Subscribe to Audit Log
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

  // ────────────────── PRESENTATION DEMO ACTIONS ──────────────────
  const handleBulkDeleteDemoData = async () => {
    if (!window.confirm("Are you sure you want to delete all presentation demo products? This will remove all mock items created for presentation.")) {
      return;
    }

    setActionLoading(true);
    setFeedbackMsg(null);

    const result = await deleteAllPresentationDemoProducts();
    if (result.success) {
      await logAdminAction("bulk_deleted_presentation_demo_products", "all_demo_items", {
        deletedCount: result.deletedCount,
      });
      setFeedbackMsg({
        type: "success",
        text: `Successfully deleted ${result.deletedCount} presentation demo product(s) from database.`,
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: `Failed to delete demo data: ${result.error}`,
      });
    }
    setActionLoading(false);
  };

  const handlePopulateDemoData = async () => {
    setActionLoading(true);
    setFeedbackMsg(null);

    const result = await populatePresentationDemoProducts();
    if (result.success) {
      await logAdminAction("populated_presentation_demo_products", "all_demo_items", {
        count: result.count,
      });
      setFeedbackMsg({
        type: "success",
        text: `Successfully seeded ${result.count} presentation demo product(s) with AI validation & thumbnails.`,
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: `Failed to populate demo data: ${result.error}`,
      });
    }
    setActionLoading(false);
  };

  const handleDeleteSingleDemoItem = async (itemId: string, title: string) => {
    if (!window.confirm(`Delete demo listing "${title}"?`)) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "listings", itemId));
      await logAdminAction("deleted_single_presentation_demo_product", itemId, { title });
      setFeedbackMsg({
        type: "success",
        text: `Deleted "${title}" successfully.`,
      });
    } catch (err: any) {
      setFeedbackMsg({
        type: "error",
        text: `Failed to delete listing: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ────────────────── STANDARD MODERATION ACTIONS ──────────────────
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

      setFeedbackMsg({ type: "success", text: `Report marked as ${resolution}.` });
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
        setFeedbackMsg({ type: "success", text: "Listing restored to public notice board." });
      } else {
        await deleteDoc(doc(db, "listings", listingId));
        await logAdminAction("listing_deleted", listingId);
        setFeedbackMsg({ type: "success", text: "Listing permanently removed from database." });
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
      await logAdminAction("user_status_change", targetUser.uid, { newStatus });
      setFeedbackMsg({ type: "success", text: `User ${targetUser.email} is now ${newStatus}.` });
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
      await logAdminAction("user_role_change", targetUser.uid, { newRole });
      setFeedbackMsg({ type: "success", text: `User ${targetUser.email} role changed to ${newRole}.` });
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Failed to change role: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const openReports = reports.filter((r) => r.status === "open");

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        
        {/* ────────────────── NEO-BRUTALIST ADMIN HEADER BANNER ────────────────── */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-grid-pattern">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="w-10 h-10 rounded-2xl bg-black text-brutal-yellow border-2 border-black flex items-center justify-center font-bold shadow-[2px_2px_0px_#FFD027]">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h1 className="font-sans font-black text-2xl text-black tracking-tight">
                  Administration &amp; Oversight Console
                </h1>
                <p className="text-xs font-semibold text-ink-600">
                  Moderation controls, presentation demo management &amp; immutable audit trail.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-bold">
            <span className="px-3 py-1.5 bg-brutal-yellow text-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              {demoListings.length} Presentation Demo Items
            </span>
            <span className="px-3 py-1.5 bg-admin-100 text-admin-900 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              {openReports.length} Open Reports
            </span>
          </div>
        </div>

        {/* ────────────────── DEDICATED PRESENTATION DEMO MANAGEMENT CARD ────────────────── */}
        <div className="bg-brutal-yellow/20 border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-black/15 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-brutal-yellow border-2 border-black shadow-[1.5px_1.5px_0px_#000] flex items-center justify-center">
                <Database className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-sans font-black text-base text-black">
                  Presentation &amp; Demo Data Management
                </h3>
                <p className="text-xs font-semibold text-ink-700">
                  Manage mock products seeded for demo and presentation evaluation.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handlePopulateDemoData}
                disabled={actionLoading}
                className="px-4 py-2 bg-white hover:bg-paper-100 text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Seed Demo Products (8)</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDeleteDemoData}
                disabled={actionLoading || demoListings.length === 0}
                className="px-4 py-2 bg-admin-600 hover:bg-admin-700 text-white font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Delete All Demo Data ({demoListings.length})</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-ink-700 font-medium">
            <strong>Note for Presentation:</strong> All demo items are marked with <code>isPresentationDemo: true</code>. Deleting them removes only the mock/presentation gear, leaving real university listings untouched.
          </p>
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

        {/* ────────────────── NEO-BRUTALIST NAVIGATION TABS ────────────────── */}
        <div className="flex space-x-2 border-b-2 border-black pb-3 overflow-x-auto text-xs font-sans font-black">
          <button
            onClick={() => setActiveTab("demo")}
            className={`px-4 py-2 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 ${
              activeTab === "demo"
                ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                : "bg-white text-ink-700 hover:bg-paper-100"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Demo Products ({demoListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 ${
              activeTab === "reports"
                ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                : "bg-white text-ink-700 hover:bg-paper-100"
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Reports Queue ({openReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hidden")}
            className={`px-4 py-2 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 ${
              activeTab === "hidden"
                ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                : "bg-white text-ink-700 hover:bg-paper-100"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Auto-Hidden ({hiddenListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 ${
              activeTab === "users"
                ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                : "bg-white text-ink-700 hover:bg-paper-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl border-2 border-black transition-all flex items-center space-x-1.5 ${
              activeTab === "audit"
                ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                : "bg-white text-ink-700 hover:bg-paper-100"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* ────────────────── TAB 1: PRESENTATION DEMO PRODUCTS ────────────────── */}
        {activeTab === "demo" && (
          <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal">
            <div className="p-4 border-b-2 border-black bg-paper-100 flex justify-between items-center text-xs font-mono font-bold text-black">
              <span>PRESENTATION DEMO PRODUCTS LIST</span>
              <span>{demoListings.length} mock listings</span>
            </div>

            {demoListings.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-600 font-mono space-y-3">
                <p>No presentation demo products currently in database.</p>
                <button
                  type="button"
                  onClick={handlePopulateDemoData}
                  className="px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]"
                >
                  ✨ Seed Demo Products Now
                </button>
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10 text-xs">
                {demoListings.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                    <div className="flex items-center space-x-3">
                      {item.thumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl border-2 border-black object-cover shrink-0 shadow-[1px_1px_0px_#000]"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-sans font-black text-sm text-black">
                            {item.title}
                          </span>
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-brutal-yellow text-black border border-black">
                            Demo
                          </span>
                        </div>
                        <p className="text-ink-600 font-mono text-[11px] mt-0.5">
                          ₹{item.price} &bull; Category: {item.category} &bull; Seller: {item.sellerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteSingleDemoItem(item.id, item.title)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-admin-50 hover:bg-admin-100 text-admin-900 border-2 border-black rounded-xl font-sans font-black text-xs shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-admin-700" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────────────── TAB 2: REPORTS QUEUE ────────────────── */}
        {activeTab === "reports" && (
          <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal">
            <div className="p-4 border-b-2 border-black bg-paper-100 flex justify-between items-center text-xs font-mono font-bold text-black">
              <span>FLAGGED MARKETPLACE ITEMS</span>
              <span>{reports.length} total reports filed</span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-600 italic font-mono">
                No reports submitted by students. Notice board is clean.
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10 text-xs">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 space-y-3 hover:bg-paper-50 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-sans font-black text-sm text-black">
                            {report.listingTitle || "Campus Item"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-lg border border-black uppercase ${
                              report.status === "open"
                                ? "bg-admin-100 text-admin-800"
                                : "bg-verifier-100 text-verifier-800"
                            }`}
                          >
                            {report.status}
                          </span>
                        </div>
                        <p className="text-ink-600 mt-0.5">
                          Reported by: <strong>{report.reporterName || "Student"}</strong> &bull; Reason: {report.reason}
                        </p>
                      </div>

                      {report.status === "open" && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReportAction(report, "dismissed", true)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-black border-2 border-black rounded-xl font-sans font-bold text-xs shadow-[1.5px_1.5px_0px_#000]"
                          >
                            Dismiss &amp; Restore
                          </button>
                          <button
                            onClick={() => handleReportAction(report, "resolved", false)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-admin-600 hover:bg-admin-700 text-white border-2 border-black rounded-xl font-sans font-black text-xs shadow-[1.5px_1.5px_0px_#000]"
                          >
                            Uphold Flag
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────────────── TAB 3: AUTO-HIDDEN LISTINGS ────────────────── */}
        {activeTab === "hidden" && (
          <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal">
            <div className="p-4 border-b-2 border-black bg-paper-100 flex justify-between items-center text-xs font-mono font-bold text-black">
              <span>LISTINGS HIDDEN FROM PUBLIC VIEW</span>
              <span>Auto-hidden at 3 reports</span>
            </div>

            {hiddenListings.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-600 italic font-mono">
                No listings are currently hidden from search.
              </div>
            ) : (
              <div className="divide-y-2 divide-black/10 text-xs">
                {hiddenListings.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-sans font-black text-sm text-black">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-admin-100 text-admin-800 rounded border border-black font-bold">
                          {item.reportCount || 0} Reports Received
                        </span>
                      </div>
                      <p className="text-ink-600 font-mono text-[11px] mt-0.5">
                        ₹{item.price} &bull; Category: {item.category} &bull; Seller: {item.sellerName}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleListingModeration(item.id, "restore")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-verifier-600 hover:bg-verifier-700 text-white border-2 border-black rounded-xl font-sans font-black text-xs shadow-[1.5px_1.5px_0px_#000]"
                      >
                        Restore to Board
                      </button>
                      <button
                        onClick={() => handleListingModeration(item.id, "remove")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-admin-600 hover:bg-admin-700 text-white border-2 border-black rounded-xl font-sans font-black text-xs shadow-[1.5px_1.5px_0px_#000]"
                      >
                        Permanently Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────────────── TAB 4: USER DIRECTORY ────────────────── */}
        {activeTab === "users" && (
          <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal">
            <div className="p-4 border-b-2 border-black bg-paper-100 flex justify-between items-center text-xs font-mono font-bold text-black">
              <span>CAMPUS DIRECTORY &amp; ROLES</span>
              <span>{usersList.length} registered accounts</span>
            </div>

            <div className="divide-y-2 divide-black/10 text-xs">
              {usersList.map((usr) => (
                <div key={usr.uid} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-sans font-black text-sm text-black">
                        {usr.name || "Student"}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-paper-200 text-black rounded border border-black font-bold">
                        {usr.role}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded border border-black font-bold ${
                          usr.status === "active"
                            ? "bg-brutal-green text-black"
                            : "bg-brutal-pink text-black"
                        }`}
                      >
                        {usr.status}
                      </span>
                    </div>
                    <p className="text-ink-600 font-mono text-[11px] mt-0.5">
                      {usr.email} &bull; {usr.course || "No course"} &bull; {usr.phone || "No phone"}
                    </p>
                  </div>

                  {usr.role !== "admin" && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRoleToggle(usr)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-paper-100 hover:bg-paper-200 text-black border-2 border-black rounded-xl font-sans font-bold text-xs shadow-[1.5px_1.5px_0px_#000]"
                      >
                        {usr.role === "student" ? "Promote to Verifier" : "Demote to Student"}
                      </button>

                      <button
                        onClick={() => handleUserStatusToggle(usr)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-xl border-2 border-black font-sans font-black text-xs shadow-[1.5px_1.5px_0px_#000] text-white ${
                          usr.status === "active"
                            ? "bg-admin-600 hover:bg-admin-700"
                            : "bg-verifier-600 hover:bg-verifier-700"
                        }`}
                      >
                        {usr.status === "active" ? "Suspend Account" : "Activate Account"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── TAB 5: AUDIT TRAIL ────────────────── */}
        {activeTab === "audit" && (
          <div className="bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal">
            <div className="p-4 border-b-2 border-black bg-paper-100 flex justify-between items-center text-xs font-mono font-bold text-black">
              <span>IMMUTABLE ADMINISTRATIVE AUDIT TRAIL</span>
              <span>Read-only event stream</span>
            </div>

            <div className="divide-y-2 divide-black/10 text-xs font-mono">
              {auditLogs.length === 0 ? (
                <div className="p-12 text-center text-ink-600 italic font-mono">
                  No administrative actions logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-paper-50 transition">
                    <div>
                      <span className="font-black text-black uppercase text-[11px] bg-brutal-yellow border border-black px-2 py-0.5 rounded mr-2">
                        {log.action}
                      </span>
                      <span className="text-ink-800">Target: {log.targetId}</span>
                    </div>
                    <div className="text-[11px] text-ink-600">
                      Actor: {log.actorEmail}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
