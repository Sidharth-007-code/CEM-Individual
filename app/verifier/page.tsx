"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing, ListingCategory } from "@/types/listing";
import { validateListingAI } from "@/lib/ai";
import { getProductImageSet } from "@/lib/demoImages";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ZoomIn,
  X,
  Search,
  Filter,
  Layers,
  CheckCheck,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Camera,
  Coins,
  FileText,
} from "lucide-react";

type VerifierTab = "pending" | "needs_changes" | "cleared";

export default function VerifierQueuePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<VerifierTab>("pending");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Multi-angle photo state
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [subcollectionImages, setSubcollectionImages] = useState<Array<{ id: string; dataUrl: string; viewName?: string }>>([]);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Subscribe to all listings so verifiers can inspect queue, returns, and historical approvals
  useEffect(() => {
    const profileMatchesUser = Boolean(user && profile && profile.uid === user.uid);
    const authorizedVerifier = Boolean(
      profileMatchesUser &&
        profile?.status === "active" &&
        (profile.role === "verifier" || profile.role === "admin")
    );

    if (authLoading || !user || !profileMatchesUser || !authorizedVerifier) {
      setAllListings([]);
      setSelectedListing(null);
      setSubcollectionImages([]);
      return;
    }

    const listingsRef = collection(db, "listings");
    const unsubscribe = onSnapshot(
      listingsRef,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Listing[];
        setAllListings(items);
      },
      (err) => {
        console.warn("[VerifierQueue] Subscription error:", err.message);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user, profile]);

  // Filter listings by tab and search
  const pendingListings = useMemo(
    () => allListings.filter((l) => l.status === "pending"),
    [allListings]
  );

  const needsChangesListings = useMemo(
    () => allListings.filter((l) => l.status === "needs_changes"),
    [allListings]
  );

  const clearedListings = useMemo(
    () => allListings.filter((l) => l.status === "available" || l.status === "rejected" || l.status === "sold"),
    [allListings]
  );

  const activeTabListings = useMemo(() => {
    let list: Listing[] = [];
    if (activeTab === "pending") list = pendingListings;
    else if (activeTab === "needs_changes") list = needsChangesListings;
    else list = clearedListings;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.sellerName && l.sellerName.toLowerCase().includes(q)) ||
          l.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "ALL") {
      list = list.filter((l) => l.category === selectedCategory);
    }

    return list;
  }, [activeTab, pendingListings, needsChangesListings, clearedListings, searchTerm, selectedCategory]);

  // Ensure an item is selected when switching tabs or when active list changes
  useEffect(() => {
    if (activeTabListings.length > 0) {
      const refreshedSelection = selectedListing
        ? activeTabListings.find((l) => l.id === selectedListing.id)
        : undefined;
      if (refreshedSelection && refreshedSelection !== selectedListing) {
        setSelectedListing(refreshedSelection);
      } else if (!refreshedSelection) {
        setSelectedListing(activeTabListings[0]);
        setActiveAngleIndex(0);
        setActionNote("");
      }
    } else {
      setSelectedListing(null);
    }
  }, [activeTabListings, selectedListing]);

  // Load subcollection images when selected listing changes
  useEffect(() => {
    if (!selectedListing?.id) {
      setSubcollectionImages([]);
      return;
    }

    let isMounted = true;
    const fetchSubcollection = async () => {
      try {
        const snap = await getDocs(collection(db, `listings/${selectedListing.id}/images`));
        if (isMounted) {
          const imgs = snap.docs.map((d) => ({
            id: d.id,
            dataUrl: d.data().dataUrl,
            viewName: d.data().viewName || "Detailed Angle",
          }));
          setSubcollectionImages(imgs);
        }
      } catch (e) {
        console.warn("[VerifierQueue] Could not load subcollection images:", e);
      }
    };

    fetchSubcollection();
    return () => {
      isMounted = false;
    };
  }, [selectedListing?.id]);

  // Consolidated multi-angle images for currently selected listing
  const proofPhotos = useMemo(() => {
    if (!selectedListing) return [];

    // 1. If Firestore has subcollection images
    if (subcollectionImages.length > 0) {
      return subcollectionImages;
    }

    // 2. If listing has images array directly
    if (selectedListing.images && selectedListing.images.length > 0) {
      return selectedListing.images.map((img, i) => ({
        id: `img_${i}`,
        dataUrl: img,
        viewName: i === 0 ? "Primary Angle" : `Detail Angle ${i + 1}`,
      }));
    }

    // 3. Realistic fallback from demo photo assets
    const assetSet = getProductImageSet(selectedListing.title);
    if (assetSet.images && assetSet.images.length > 0) {
      return assetSet.images.map((img) => ({
        id: img.id,
        dataUrl: img.dataUrl,
        viewName: img.viewName || "Angle Inspection",
      }));
    }

    // 4. Default thumbnail
    if (selectedListing.thumbnail) {
      return [{ id: "thumb", dataUrl: selectedListing.thumbnail, viewName: "Proof Photo" }];
    }

    return [];
  }, [selectedListing, subcollectionImages]);

  // Active preview image
  const activeImage = proofPhotos[activeAngleIndex] || proofPhotos[0] || null;

  // Single listing decision
  const handleDecision = async (
    listingId: string,
    decision: "available" | "rejected" | "needs_changes"
  ) => {
    if (!user || !selectedListing) return;
    setProcessingId(listingId);
    setFeedbackMsg(null);

    try {
      const listingRef = doc(db, "listings", listingId);
      const note =
        actionNote.trim() ||
        (decision === "available"
          ? "Approved by campus quality verifier. Conforms to RUAS safety & syllabus standards."
          : decision === "needs_changes"
          ? "Modifications requested before this item can appear on the notice board."
          : "Listing rejected by campus verification desk.");

      await updateDoc(listingRef, {
        status: decision,
        verifierId: user.uid,
        verifierNote: note,
        updatedAt: serverTimestamp(),
      });

      // Send notification to seller
      if (selectedListing.sellerId) {
        const notifRef = doc(collection(db, `notifications/${selectedListing.sellerId}/items`));
        let text = "";
        if (decision === "available") {
          text = `Your listing "${selectedListing.title}" has been verified and published to the Notice Board!`;
        } else if (decision === "rejected") {
          text = `Your listing "${selectedListing.title}" was not approved: ${note}`;
        } else {
          text = `Changes requested for "${selectedListing.title}": ${note}`;
        }

        await setDoc(notifRef, {
          id: notifRef.id,
          senderId: user.uid,
          type: "verification",
          text,
          link: `/listings/${listingId}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setFeedbackMsg({
        text: `Listing successfully updated to ${decision.toUpperCase()}. Notification sent to ${selectedListing.sellerName || "student"}.`,
        type: "success",
      });
      setActionNote("");
    } catch (err: any) {
      setFeedbackMsg({
        text: "Failed to update listing: " + err.message,
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Batch approve all pending items that passed AI inspection
  const handleBatchApproveCleared = async () => {
    if (!user) return;
    const aiPassedListings = pendingListings.filter((l) => {
      const aiEval =
        l.aiValidation ||
        validateListingAI({
          title: l.title,
          description: l.description,
          category: l.category,
          condition: l.condition,
          price: l.price,
          imageCount: 3,
        });
      return aiEval.overallPassed && aiEval.safetyCheck.status === "CLEARED";
    });

    if (aiPassedListings.length === 0) {
      setFeedbackMsg({
        text: "No pending listings currently meet 100% automated AI clearance criteria.",
        type: "error",
      });
      return;
    }

    if (!confirm(`Are you sure you want to batch approve ${aiPassedListings.length} AI-cleared listings?`)) {
      return;
    }

    setBatchProcessing(true);
    setFeedbackMsg(null);

    try {
      let approvedCount = 0;
      for (const item of aiPassedListings) {
        const listingRef = doc(db, "listings", item.id);
        await updateDoc(listingRef, {
          status: "available",
          verifierId: user.uid,
          verifierNote: "Batch approved via Verifier Desk: Verified AI Safety & Syllabus compliance.",
          updatedAt: serverTimestamp(),
        });

        if (item.sellerId) {
          const notifRef = doc(collection(db, `notifications/${item.sellerId}/items`));
          await setDoc(notifRef, {
            id: notifRef.id,
            senderId: user.uid,
            type: "verification",
            text: `Your listing "${item.title}" has been verified and published to the Notice Board!`,
            link: `/listings/${item.id}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
        approvedCount++;
      }

      setFeedbackMsg({
        text: `Batch cleared ${approvedCount} listings to the active Notice Board!`,
        type: "success",
      });
    } catch (err: any) {
      setFeedbackMsg({
        text: "Batch approval encountered an error: " + err.message,
        type: "error",
      });
    } finally {
      setBatchProcessing(false);
    }
  };

  // Preset remark appender
  const applyPresetRemark = (remark: string) => {
    if (!actionNote.trim()) {
      setActionNote(remark);
    } else {
      setActionNote((prev) => `${prev.trim()} ${remark}`);
    }
  };

  return (
    <RouteGuard allowedRoles={["verifier", "admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Banner - Neo-Brutalist Layout */}
        <div className="bg-white border border-modern-border rounded-2xl p-6 shadow-modern-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ">
          <div className="flex items-center space-x-3.5">
            <span className="w-12 h-12 rounded-2xl bg-modern-success-light text-modern-text-primary border border-modern-border shadow-modern-sm flex items-center justify-center font-bold text-lg flex-shrink-0">
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-modern-text-primary tracking-tight">
                  Quality Verifier Workstation
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 bg-modern-warm text-modern-text-primary text-[10px] font-mono font-semibold rounded-md border border-modern-border shadow-modern-sm">
                  OFFICIAL DESK
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-modern-text-tertiary mt-0.5">
                MSRUAS Campus Human Quality, Authenticity &amp; Syllabus Review Gate
              </p>
            </div>
          </div>

          {/* Quick Actions & Pending Counter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={handleBatchApproveCleared}
              disabled={batchProcessing || pendingListings.length === 0}
              variant="success"
              size="sm"
              leftIcon={<CheckCheck className="w-4 h-4" />}
              title="Batch approve pending items cleared by AI vision and safety check"
            >
              <span>{batchProcessing ? "Clearing..." : "Batch Approve AI-Cleared"}</span>
            </Button>

            <span className="px-3.5 py-2 bg-modern-warm text-modern-text-primary text-xs font-mono font-semibold rounded-xl border border-modern-border shadow-modern-sm">
              {pendingListings.length} In Queue
            </span>
          </div>
        </div>

        {/* Verifier KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-modern-border rounded-2xl shadow-modern-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-modern-text-tertiary uppercase">Pending Review</p>
              <p className="text-2xl font-semibold text-modern-text-primary font-sans mt-0.5">{pendingListings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-modern-warm border border-modern-border flex items-center justify-center shadow-modern-sm">
              <Clock className="w-5 h-5 text-modern-text-primary stroke-[2.5]" />
            </div>
          </div>

          <div className="p-4 bg-white border border-modern-border rounded-2xl shadow-modern-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-modern-text-tertiary uppercase">Needs Changes</p>
              <p className="text-2xl font-semibold text-modern-text-primary font-sans mt-0.5">{needsChangesListings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-modern-primary-light border border-modern-border flex items-center justify-center shadow-modern-sm">
              <HelpCircle className="w-5 h-5 text-modern-text-primary stroke-[2.5]" />
            </div>
          </div>

          <div className="p-4 bg-white border border-modern-border rounded-2xl shadow-modern-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-modern-text-tertiary uppercase">Live On Board</p>
              <p className="text-2xl font-semibold text-modern-text-primary font-sans mt-0.5">
                {allListings.filter((l) => l.status === "available").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-modern-success-light border border-modern-border flex items-center justify-center shadow-modern-sm">
              <CheckCircle className="w-5 h-5 text-modern-text-primary stroke-[2.5]" />
            </div>
          </div>

          <div className="p-4 bg-white border border-modern-border rounded-2xl shadow-modern-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-modern-text-tertiary uppercase">Guarded / Rejected</p>
              <p className="text-2xl font-semibold text-modern-text-primary font-sans mt-0.5">
                {allListings.filter((l) => l.status === "rejected").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-modern-error-light border border-modern-border flex items-center justify-center shadow-modern-sm">
              <XCircle className="w-5 h-5 text-modern-text-primary stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 border border-modern-border rounded-2xl font-bold text-xs shadow-modern-sm flex items-center justify-between ${
              feedbackMsg.type === "success" ? "bg-modern-success-light text-modern-text-primary" : "bg-modern-error-light text-modern-text-primary"
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="font-mono text-xs font-semibold underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Triage Tabs & Queue Filter Header */}
        <div className="bg-white border border-modern-border rounded-2xl p-4 shadow-modern-sm flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-modern-border transition shadow-modern-sm ${
                activeTab === "pending"
                  ? "bg-modern-warm text-modern-text-primary scale-[1.02]"
                  : "bg-modern-surface-hover text-modern-text-primary hover:bg-modern-surface-hover"
              }`}
            >
              Pending Verification ({pendingListings.length})
            </button>

            <button
              onClick={() => setActiveTab("needs_changes")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-modern-border transition shadow-modern-sm ${
                activeTab === "needs_changes"
                  ? "bg-modern-warm text-modern-text-primary scale-[1.02]"
                  : "bg-modern-surface-hover text-modern-text-primary hover:bg-modern-surface-hover"
              }`}
            >
              Needs Changes ({needsChangesListings.length})
            </button>

            <button
              onClick={() => setActiveTab("cleared")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold border border-modern-border transition shadow-modern-sm ${
                activeTab === "cleared"
                  ? "bg-modern-warm text-modern-text-primary scale-[1.02]"
                  : "bg-modern-surface-hover text-modern-text-primary hover:bg-modern-surface-hover"
              }`}
            >
              Cleared History ({clearedListings.length})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Input
                type="text"
                placeholder="Search title, seller, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="text-sm"
              />
            </div>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: "ALL", label: "All Categories" },
                { value: "Textbooks & Notes", label: "Textbooks" },
                { value: "Electronics & Calculators", label: "Electronics" },
                { value: "Hostel & Room Essentials", label: "Hostel Gear" },
                { value: "Lab Equipment & Uniforms", label: "Lab Equipment" },
                { value: "Stationery & Drafting", label: "Drafting" },
                { value: "Bicycles & Mobility", label: "Bicycles" },
                { value: "Miscellaneous", label: "Miscellaneous" },
              ]}
              className="min-w-36 text-sm"
            />
          </div>
        </div>

        {/* Main Workstation Queue Layout (5 Cols List + 7 Cols Inspection) */}
        {activeTabListings.length === 0 ? (
          <div className="bg-white border border-modern-border rounded-2xl p-12 text-center space-y-3 shadow-modern-sm">
            <div className="w-14 h-14 bg-modern-success-light border border-modern-border rounded-2xl flex items-center justify-center mx-auto shadow-modern-sm">
              <CheckCircle className="w-7 h-7 text-modern-text-primary stroke-[2.5]" />
            </div>
            <h3 className="font-sans text-xl font-semibold text-modern-text-primary">
              No Listings in {activeTab.toUpperCase().replace("_", " ")}
            </h3>
            <p className="text-xs font-semibold text-modern-text-tertiary max-w-sm mx-auto">
              There are currently no submissions matching your active filter. Campus notice board records are in sync.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Queue List (5 Cols) */}
            <Card variant="default" padding="none" className="lg:col-span-5 overflow-hidden flex flex-col">
              <div className="p-4 border-b-2 border-modern-border/70 bg-modern-surface-hover flex justify-between items-center text-xs font-mono font-semibold text-modern-text-primary">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Queue Items</span>
                </span>
                <span>{activeTabListings.length} listings</span>
              </div>

              <div className="divide-y-2 divide-modern-border/70 overflow-y-auto max-h-[720px]">
                {activeTabListings.map((listing) => {
                  const isSelected = selectedListing?.id === listing.id;
                  const aiEval =
                    listing.aiValidation ||
                    validateListingAI({
                      title: listing.title,
                      description: listing.description,
                      category: listing.category,
                      condition: listing.condition,
                      price: listing.price,
                      imageCount: 3,
                    });

                  return (
                    <button
                      key={listing.id}
                      onClick={() => {
                        setSelectedListing(listing);
                        setActiveAngleIndex(0);
                        setActionNote("");
                      }}
                      className={`w-full p-4 text-left flex items-start space-x-3.5 transition ${
                        isSelected
                          ? "bg-modern-warm-light border-l-4 border-modern-border"
                          : "hover:bg-modern-bg"
                      }`}
                    >
                      {listing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.thumbnail}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border border-modern-border shadow-modern-sm flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-modern-surface-hover border border-modern-border flex items-center justify-center text-modern-text-primary flex-shrink-0 text-xs font-mono font-bold">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-sans font-semibold text-xs text-modern-text-primary truncate">
                            {listing.title}
                          </h4>
                          <Badge
                            variant={listing.status === "available" ? "success" : listing.status === "pending" ? "warning" : listing.status === "needs_changes" ? "primary" : "secondary"}
                            size="xs"
                            className="flex-shrink-0"
                          >
                            {listing.status.toUpperCase().replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-modern-text-secondary mt-1">
                          <span className="text-modern-text-primary font-semibold">₹{listing.price}</span>
                          <span>&bull;</span>
                          <span className="truncate">{listing.category}</span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-modern-border/50 text-[10px] font-mono">
                          <span className="text-modern-text-tertiary truncate">
                            By: {listing.sellerName || "Student"}
                          </span>
                          <span
                            className={`font-semibold ${
                              aiEval.overallPassed ? "text-modern-success" : "text-modern-error"
                            }`}
                          >
                            AI: {aiEval.overallPassed ? "Clear ✅" : "Review ⚠️"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Right Inspection & Decision Canvas (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedListing ? (
                <Card variant="default" padding="md" className="space-y-5">
                  {/* Top Bar: Title & Category & Price */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-modern-border/70 pb-4 gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase bg-modern-primary-light text-modern-primary rounded-lg border border-modern-border shadow-modern-sm">
                          {selectedListing.category}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-modern-surface-hover text-modern-text-primary rounded-lg border border-modern-border">
                          Condition: {selectedListing.condition.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded-lg border border-modern-border ${
                            selectedListing.status === "available"
                              ? "bg-modern-success-light text-modern-text-primary"
                              : selectedListing.status === "sold"
                              ? "bg-modern-surface-hover text-modern-text-secondary"
                              : selectedListing.status === "pending"
                              ? "bg-modern-warm text-modern-text-primary"
                              : selectedListing.status === "needs_changes"
                              ? "bg-modern-primary-light text-modern-text-primary"
                              : "bg-modern-error-light text-modern-text-primary"
                          }`}
                        >
                          Status: {selectedListing.status.toUpperCase()}
                        </span>
                      </div>

                      <h2 className="font-sans text-xl sm:text-2xl font-semibold text-modern-text-primary mt-2">
                        {selectedListing.title}
                      </h2>

                      <p className="text-xs font-mono text-modern-text-tertiary mt-0.5">
                        Seller: <strong className="text-modern-text-primary">{selectedListing.sellerName || "Student"}</strong> &bull; Contact: {selectedListing.sellerPhone || "None provided"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="font-sans text-3xl font-semibold text-modern-text-primary">
                        ₹{selectedListing.price}
                      </div>
                      <span className="text-[10px] text-modern-text-tertiary font-mono font-bold">Asking Price</span>
                    </div>
                  </div>

                  {selectedListing.status === "sold" && (
                    <div className="rounded-xl border border-modern-border bg-modern-bg p-4 space-y-2">
                      <p className="text-xs font-sans font-semibold text-modern-text-primary">
                        Approved listing — now sold
                      </p>
                      <p className="text-xs text-modern-text-secondary">
                        Verifier note: {selectedListing.verifierNote || "No verifier note was recorded."}
                      </p>
                      {selectedListing.verifierId && (
                        <p className="text-[11px] font-mono text-modern-text-tertiary">
                          Verifier account ID: {selectedListing.verifierId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Multi-Angle Proof Photo Gallery with High-Res Zoom */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-semibold text-modern-text-primary uppercase tracking-wider flex items-center space-x-1.5">
                        <Camera className="w-4 h-4 text-modern-text-primary" />
                        <span>Multi-Angle Proof Photo Gallery ({proofPhotos.length} Shots)</span>
                      </label>
                      <span className="text-[11px] font-mono text-modern-text-tertiary">
                        {activeImage?.viewName || "Angle Inspection"}
                      </span>
                    </div>

                    {/* Main Inspection View */}
                    <div className="relative group rounded-2xl overflow-hidden border border-modern-border shadow-modern-sm bg-modern-surface-hover h-64 sm:h-80 flex items-center justify-center">
                      {activeImage ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeImage.dataUrl}
                            alt="Primary Proof View"
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => setZoomImageUrl(activeImage.dataUrl)}
                            className="absolute bottom-3 right-3 px-3 py-1.5 bg-modern-primary text-white text-xs font-mono font-bold rounded-xl border border-white flex items-center space-x-1.5 shadow-md hover:bg-modern-primary-hover transition"
                          >
                            <ZoomIn className="w-4 h-4" />
                            <span>Zoom Full Res</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs font-mono font-bold text-modern-text-tertiary">
                          No Proof Photograph Uploaded
                        </div>
                      )}
                    </div>

                    {/* Angle Thumbnails Row */}
                    {proofPhotos.length > 1 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                        {proofPhotos.map((img, idx) => (
                          <button
                            key={img.id || idx}
                            onClick={() => setActiveAngleIndex(idx)}
                            className={`p-1.5 rounded-xl border text-left transition flex flex-col items-center ${
                              activeAngleIndex === idx
                                ? "border-modern-border bg-modern-warm-light shadow-modern-sm"
                                : "border-modern-border/70 hover:border-modern-border bg-white"
                            }`}
                          >
                            <div className="w-full h-16 rounded-lg overflow-hidden bg-modern-surface-hover border border-modern-border/70">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-modern-text-primary mt-1 truncate w-full text-center">
                              {img.viewName || `Angle ${idx + 1}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Student Description */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-modern-text-primary uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Student Item Description</span>
                    </label>
                    <p className="text-xs font-semibold text-modern-text-primary bg-modern-bg p-3.5 rounded-xl border border-modern-border leading-relaxed whitespace-pre-wrap">
                      {selectedListing.description}
                    </p>
                  </div>

                  {/* AI Quality & Verifier Advisory Panel */}
                  {(() => {
                    const aiEval =
                      selectedListing.aiValidation ||
                      validateListingAI({
                        title: selectedListing.title,
                        description: selectedListing.description,
                        category: selectedListing.category,
                        condition: selectedListing.condition,
                        price: selectedListing.price,
                        imageCount: proofPhotos.length,
                        images: activeImage ? [{ dataUrl: activeImage.dataUrl }] : undefined,
                      });

                    const isPriceFair =
                      selectedListing.price >= aiEval.priceEval.estimatedMin &&
                      selectedListing.price <= aiEval.priceEval.estimatedMax;

                    return (
                      <div className="bg-modern-bg border border-modern-border rounded-2xl p-4 text-xs space-y-3.5 shadow-modern-sm">
                        <div className="flex flex-wrap items-center justify-between border-b border-modern-border/70 pb-2 gap-2">
                          <span className="font-sans font-semibold text-modern-text-primary flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-modern-primary" />
                            <span>AI Vision &amp; Quality Co-Pilot</span>
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold border border-modern-border ${
                              aiEval.overallPassed
                                ? "bg-modern-success-light text-modern-text-primary"
                                : "bg-modern-error-light text-modern-text-primary"
                            }`}
                          >
                            AI Advice: {aiEval.verifierAdvice.recommendedAction} ({aiEval.verifierAdvice.confidenceScore}% conf)
                          </span>
                        </div>

                        {/* 3 Metric Summary Boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 bg-white rounded-xl border border-modern-border shadow-modern-sm">
                            <span className="text-[10px] text-modern-text-tertiary font-mono block">Safety &amp; Compliance</span>
                            <span
                              className={`font-semibold text-xs ${
                                aiEval.safetyCheck.status === "CLEARED" ? "text-modern-success" : "text-modern-error"
                              }`}
                            >
                              {aiEval.safetyCheck.status === "CLEARED" ? "Cleared (Safe) ✅" : "Flagged ⚠️"}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-modern-border shadow-modern-sm">
                            <span className="text-[10px] text-modern-text-tertiary font-mono block">Syllabus Fair Range</span>
                            <span className="font-semibold text-xs text-modern-text-primary block">
                              ₹{aiEval.priceEval.estimatedMin} - ₹{aiEval.priceEval.estimatedMax}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold ${
                                isPriceFair ? "text-modern-success" : "text-modern-error"
                              }`}
                            >
                              {isPriceFair ? "Fair Valuation" : selectedListing.price > aiEval.priceEval.estimatedMax ? "Above Range ⚠️" : "Below Range"}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-modern-border shadow-modern-sm">
                            <span className="text-[10px] text-modern-text-tertiary font-mono block">Quality Grade</span>
                            <span className="font-semibold text-xs text-modern-text-primary">
                              Grade {aiEval.qualityCheck.grade} ({aiEval.qualityCheck.qualityScore}/100)
                            </span>
                          </div>
                        </div>

                        {/* AI Vision & Photo Authenticity */}
                        {aiEval.imageAnalysis && (
                          <div className="p-3 bg-white rounded-xl border border-modern-border shadow-modern-sm space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-modern-text-tertiary uppercase text-[10px]">
                                AI Vision &amp; Photo Authenticity
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border border-modern-border ${
                                  aiEval.imageAnalysis.isGenuine ? "bg-modern-success-light text-modern-text-primary" : "bg-modern-error-light text-modern-text-primary"
                                }`}
                              >
                                {aiEval.imageAnalysis.isGenuine ? "Genuine Student Photo" : "Review Photo"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                              <span className="text-modern-text-primary font-bold">
                                Detected: {aiEval.imageAnalysis.detectedVisualItem}
                              </span>
                              <span>&bull;</span>
                              <span
                                className={
                                  aiEval.imageAnalysis.isMatch ? "text-modern-success font-bold" : "text-modern-error font-bold"
                                }
                              >
                                {aiEval.imageAnalysis.matchStatus.replace("_", " ")} ({aiEval.imageAnalysis.matchConfidence}%)
                              </span>
                            </div>
                            <p className="text-[10px] text-modern-text-tertiary font-mono">
                              {aiEval.imageAnalysis.matchExplanation}
                            </p>
                          </div>
                        )}

                        {aiEval.verifierAdvice.summaryBulletPoints.length > 0 && (
                          <ul className="list-disc list-inside text-modern-text-secondary text-[11px] space-y-1 font-medium bg-white p-3 rounded-xl border border-modern-border">
                            {aiEval.verifierAdvice.summaryBulletPoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}

                  {/* Fast Action Preset Remarks */}
                  <div className="space-y-2 border-t-2 border-modern-border/70 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-semibold text-modern-text-primary uppercase tracking-wider">
                        Fast-Action Preset Remarks (Click to Append)
                      </label>
                      <span className="text-[10px] font-mono text-modern-text-tertiary">One-click feedback</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "Verified genuine RUAS syllabus edition. Condition and binding verified intact."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-modern-success-light/30 text-modern-text-primary text-[11px] font-mono font-bold rounded-lg border border-modern-border shadow-modern-sm transition"
                      >
                        ✓ Genuine Syllabus Edition
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "Asking price conforms to university fair market depreciation guidelines."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-modern-success-light/30 text-modern-text-primary text-[11px] font-mono font-bold rounded-lg border border-modern-border shadow-modern-sm transition"
                      >
                        ✓ Fair Resale Price
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "Proof photos are blurry or poorly lit. Please upload clearer photos of title page, spine, and model stamp."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-modern-warm-light text-modern-text-primary text-[11px] font-mono font-bold rounded-lg border border-modern-border shadow-modern-sm transition"
                      >
                        📷 Low Quality Photo
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "Listing price exceeds fair campus resale value. Please lower price to align with syllabus guidelines."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-modern-warm-light text-modern-text-primary text-[11px] font-mono font-bold rounded-lg border border-modern-border shadow-modern-sm transition"
                      >
                        💰 Overpriced
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "This item does not comply with RUAS academic gear and campus living guidelines."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-modern-error-light/30 text-modern-text-primary text-[11px] font-mono font-bold rounded-lg border border-modern-border shadow-modern-sm transition"
                      >
                        🚫 Non-Academic Item
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "Please specify course code, branch, semester, and condition details (e.g. edition year, accessories included)."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-modern-surface-hover text-modern-text-primary text-[11px] font-mono font-bold rounded-lg border border-modern-border shadow-modern-sm transition"
                      >
                        📝 Incomplete Description
                      </button>
                    </div>
                  </div>

                  {/* Keep sold history entries read-only; approval controls remain for other statuses. */}
                  {selectedListing.status !== "sold" && (
                    <div className="space-y-3 pt-2">
                    <label className="block text-xs font-mono font-semibold text-modern-text-primary uppercase tracking-wider">
                      Official Verifier Remark / Student Feedback Note
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Enter verification feedback or select from the preset remark buttons above..."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      className="text-sm"
                    />

                    {/* Decision Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <Button
                        onClick={() => handleDecision(selectedListing.id, "available")}
                        disabled={processingId === selectedListing.id}
                        variant="success"
                        size="md"
                        fullWidth
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                      >
                        <span>Approve &amp; Publish</span>
                      </Button>

                      <Button
                        onClick={() => handleDecision(selectedListing.id, "needs_changes")}
                        disabled={processingId === selectedListing.id}
                        variant="warm"
                        size="md"
                        fullWidth
                        leftIcon={<HelpCircle className="w-4 h-4" />}
                      >
                        <span>Request Changes</span>
                      </Button>

                      <Button
                        onClick={() => handleDecision(selectedListing.id, "rejected")}
                        disabled={processingId === selectedListing.id}
                        variant="secondary"
                        size="md"
                        fullWidth
                        className="!bg-modern-error-light !text-modern-error !border-modern-error/30 hover:!bg-modern-error-light"
                        leftIcon={<XCircle className="w-4 h-4" />}
                      >
                        <span>Reject Listing</span>
                      </Button>
                    </div>
                    </div>
                  )}
                </Card>
              ) : null}
            </div>
          </div>
        )}

        {/* High-Resolution Photo Zoom Modal */}
        {zoomImageUrl && (
          <div className="fixed inset-0 z-50 bg-modern-primary/85 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full bg-white border border-modern-border rounded-2xl p-4 shadow-modern-sm flex flex-col space-y-3">
              <div className="flex justify-between items-center border-b-2 border-modern-border pb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-modern-text-primary" />
                  <span className="font-sans font-semibold text-sm text-modern-text-primary">
                    High-Resolution Proof Photo Inspector
                  </span>
                </div>
                <button
                  onClick={() => setZoomImageUrl(null)}
                  className="p-1.5 rounded-lg border border-modern-border bg-modern-error-light hover:bg-modern-error-light text-modern-text-primary transition"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-modern-surface-hover rounded-2xl border border-modern-border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomImageUrl}
                  alt="High Resolution Inspector"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono font-bold text-modern-text-tertiary">
                <span>Inspecting: {selectedListing?.title}</span>
                <button
                  onClick={() => setZoomImageUrl(null)}
                  className="px-4 py-1.5 bg-modern-primary text-white rounded-xl font-sans font-semibold hover:bg-modern-primary-hover"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
