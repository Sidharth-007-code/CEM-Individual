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
import { MockBadge } from "@/components/ui/MockBadge";
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
  UserCheck,
  UserX,
} from "lucide-react";

export default function AdminConsolePage() {
  const { user, profile } = useAuth();

  // Active Admin Tabs
  const [activeTab, setActiveTab] = useState<"reports" | "hidden" | "users" | "audit">("reports");

  // State data
  const [reports, setReports] = useState<Report[]>([]);
  const [hiddenListings, setHiddenListings] = useState<Listing[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
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

  // 2. Subscribe to Hidden Listings
  useEffect(() => {
    const listingsRef = collection(db, "listings");
    const unsubscribe = onSnapshot(
      listingsRef,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Listing))
          .filter((l) => l.status === "hidden");
        setHiddenListings(list);
      },
      (err) => console.warn("Hidden listings fetch warning:", err.message)
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

  // Handler: Resolve or Dismiss Report
  const handleReportAction = async (report: Report, resolution: "resolved" | "dismissed", restoreListing = false) => {
    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      // Update report status
      await updateDoc(doc(db, "reports", report.id), {
        status: resolution,
        resolvedAt: serverTimestamp(),
      });

      // Update listing if restoring
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

      setFeedbackMsg(`Report marked as ${resolution}.`);
    } catch (err: any) {
      setFeedbackMsg("Action failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Re-instate or Remove Hidden Listing
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
        setFeedbackMsg("Listing restored to public notice board.");
      } else {
        await deleteDoc(doc(db, "listings", listingId));
        await logAdminAction("listing_deleted", listingId);
        setFeedbackMsg("Listing permanently removed from database.");
      }
    } catch (err: any) {
      setFeedbackMsg("Moderation action failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Suspend or Change User Role
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
      setFeedbackMsg(`User ${targetUser.email} is now ${newStatus}.`);
    } catch (err: any) {
      setFeedbackMsg("Failed to update user status: " + err.message);
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
      setFeedbackMsg(`User ${targetUser.email} role changed to ${newRole}.`);
    } catch (err: any) {
      setFeedbackMsg("Failed to change role: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openReports = reports.filter((r) => r.status === "open");

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="space-y-6">
        
        {/* Admin Header Banner */}
        <div className="bg-admin-50 border border-admin-600/30 rounded-notice p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-full bg-admin-600 text-white flex items-center justify-center font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="font-serif text-2xl font-black text-admin-900 tracking-tight">
                Administration &amp; Oversight Console
              </h1>
              <MockBadge label="Admin Only" />
            </div>
            <p className="text-xs text-admin-700 mt-1">
              Moderation controls for CSC203B project. Inspect student flags, manage accounts, and monitor immutable audit trail.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-2.5 py-1 bg-admin-100 text-admin-800 rounded border border-admin-600/30 font-bold">
              {openReports.length} Open Reports
            </span>
            <span className="px-2.5 py-1 bg-paper-200 text-ink-800 rounded border border-ink-300">
              {hiddenListings.length} Hidden Items
            </span>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3 bg-paper-100 border border-ink-300 rounded text-xs text-ink-900 font-medium">
            {feedbackMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-ink-200 pb-2 overflow-x-auto text-xs font-serif font-bold">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-notice transition flex items-center space-x-1.5 ${
              activeTab === "reports"
                ? "bg-admin-600 text-white shadow-sm"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>Reports Queue ({openReports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("hidden")}
            className={`px-4 py-2 rounded-notice transition flex items-center space-x-1.5 ${
              activeTab === "hidden"
                ? "bg-admin-600 text-white shadow-sm"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            <span>Auto-Hidden Listings ({hiddenListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-notice transition flex items-center space-x-1.5 ${
              activeTab === "users"
                ? "bg-admin-600 text-white shadow-sm"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-notice transition flex items-center space-x-1.5 ${
              activeTab === "audit"
                ? "bg-admin-600 text-white shadow-sm"
                : "bg-paper-100 text-ink-700 hover:bg-paper-200"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Reports Queue */}
        {activeTab === "reports" && (
          <div className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card">
            <div className="p-4 border-b border-ink-200 bg-paper-200/50 flex justify-between items-center text-xs font-serif font-bold text-ink-950">
              <span>Flagged Marketplace Items</span>
              <span className="font-mono text-ink-500">{reports.length} total reports filed</span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-500 italic">
                No reports submitted by students. Notice board is clean.
              </div>
            ) : (
              <div className="divide-y divide-ink-200 text-xs">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 space-y-3 hover:bg-paper-50 transition">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-serif font-bold text-sm text-ink-950">
                            {report.listingTitle || "Campus Item"}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase ${
                              report.status === "open"
                                ? "bg-admin-100 text-admin-800 border border-admin-600/30"
                                : "bg-verifier-100 text-verifier-800 border border-verifier-600/30"
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
                            className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-ink-800 rounded font-serif font-bold text-xs"
                          >
                            Dismiss &amp; Restore
                          </button>
                          <button
                            onClick={() => handleReportAction(report, "resolved", false)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-admin-600 hover:bg-admin-700 text-white rounded font-serif font-bold text-xs"
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

        {/* Tab 2: Auto-Hidden Listings */}
        {activeTab === "hidden" && (
          <div className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card">
            <div className="p-4 border-b border-ink-200 bg-paper-200/50 flex justify-between items-center text-xs font-serif font-bold text-ink-950">
              <span>Listings Hidden from Public View</span>
              <span className="font-mono text-ink-500">Auto-hidden at 3 reports</span>
            </div>

            {hiddenListings.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-500 italic">
                No listings are currently hidden from search.
              </div>
            ) : (
              <div className="divide-y divide-ink-200 text-xs">
                {hiddenListings.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-sm text-ink-950">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-admin-100 text-admin-800 rounded border border-admin-600/30">
                          {item.reportCount || 0} Reports Received
                        </span>
                      </div>
                      <p className="text-ink-600 mt-0.5">
                        ₹{item.price} &bull; Category: {item.category} &bull; Seller: {item.sellerName}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleListingModeration(item.id, "restore")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-verifier-600 hover:bg-verifier-700 text-white rounded font-serif font-bold text-xs"
                      >
                        Restore to Board
                      </button>
                      <button
                        onClick={() => handleListingModeration(item.id, "remove")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-admin-600 hover:bg-admin-700 text-white rounded font-serif font-bold text-xs"
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

        {/* Tab 3: User Management */}
        {activeTab === "users" && (
          <div className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card">
            <div className="p-4 border-b border-ink-200 bg-paper-200/50 flex justify-between items-center text-xs font-serif font-bold text-ink-950">
              <span>Campus Directory &amp; Role Management</span>
              <span className="font-mono text-ink-500">{usersList.length} registered accounts</span>
            </div>

            <div className="divide-y divide-ink-200 text-xs">
              {usersList.map((usr) => (
                <div key={usr.uid} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-paper-50 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-serif font-bold text-sm text-ink-950">
                        {usr.name || "Student"}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-paper-200 text-ink-800 rounded border border-ink-300">
                        {usr.role}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded ${
                          usr.status === "active"
                            ? "bg-verifier-100 text-verifier-800"
                            : "bg-admin-100 text-admin-800"
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
                        className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-ink-900 rounded font-serif font-bold text-xs"
                      >
                        {usr.role === "student" ? "Promote to Verifier" : "Demote to Student"}
                      </button>

                      <button
                        onClick={() => handleUserStatusToggle(usr)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded font-serif font-bold text-xs text-white ${
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

        {/* Tab 4: Immutable Audit Trail */}
        {activeTab === "audit" && (
          <div className="bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card">
            <div className="p-4 border-b border-ink-200 bg-paper-200/50 flex justify-between items-center text-xs font-serif font-bold text-ink-950">
              <span>Immutable Administrative Audit Trail</span>
              <span className="font-mono text-ink-500">Read-only event stream</span>
            </div>

            <div className="divide-y divide-ink-200 text-xs font-mono">
              {auditLogs.length === 0 ? (
                <div className="p-12 text-center text-ink-500 italic font-sans">
                  No administrative actions logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-paper-50 transition">
                    <div>
                      <span className="font-bold text-ink-950 uppercase text-[11px] bg-paper-200 px-1.5 py-0.5 rounded mr-2">
                        {log.action}
                      </span>
                      <span className="text-ink-700">Target: {log.targetId}</span>
                    </div>
                    <div className="text-[11px] text-ink-500">
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

