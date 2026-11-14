"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
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
  const { user } = useAuth();
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
  }, []);

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
    () => allListings.filter((l) => l.status === "available" || l.status === "rejected"),
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
      if (!selectedListing || !activeTabListings.find((l) => l.id === selectedListing.id)) {
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
        <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-grid-pattern">
          <div className="flex items-center space-x-3.5">
            <span className="w-12 h-12 rounded-2xl bg-brutal-green text-black border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center font-bold text-lg flex-shrink-0">
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Quality Verifier Workstation
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 bg-brutal-yellow text-black text-[10px] font-mono font-black rounded-md border border-black shadow-[1px_1px_0px_#000]">
                  OFFICIAL DESK
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-ink-600 mt-0.5">
                MSRUAS Campus Human Quality, Authenticity &amp; Syllabus Review Gate
              </p>
            </div>
          </div>

          {/* Quick Actions & Pending Counter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleBatchApproveCleared}
              disabled={batchProcessing || pendingListings.length === 0}
              className="px-4 py-2 bg-brutal-green hover:bg-brutal-green-dark text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center space-x-1.5 disabled:opacity-50"
              title="Batch approve pending items cleared by AI vision and safety check"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              <span>{batchProcessing ? "Clearing..." : "Batch Approve AI-Cleared"}</span>
            </button>

            <span className="px-3.5 py-2 bg-brutal-yellow text-black text-xs font-mono font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              {pendingListings.length} In Queue
            </span>
          </div>
        </div>

        {/* Verifier KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white border-2 border-black rounded-2xl shadow-brutal flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-ink-600 uppercase">Pending Review</p>
              <p className="text-2xl font-black text-black font-sans mt-0.5">{pendingListings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Clock className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-black rounded-2xl shadow-brutal flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-ink-600 uppercase">Needs Changes</p>
              <p className="text-2xl font-black text-black font-sans mt-0.5">{needsChangesListings.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brutal-purple-light border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <HelpCircle className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-black rounded-2xl shadow-brutal flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-ink-600 uppercase">Live On Board</p>
              <p className="text-2xl font-black text-black font-sans mt-0.5">
                {allListings.filter((l) => l.status === "available").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brutal-green border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <CheckCircle className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-black rounded-2xl shadow-brutal flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold text-ink-600 uppercase">Guarded / Rejected</p>
              <p className="text-2xl font-black text-black font-sans mt-0.5">
                {allListings.filter((l) => l.status === "rejected").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-brutal-pink border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <XCircle className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 border-2 border-black rounded-2xl font-bold text-xs shadow-[2px_2px_0px_#000] flex items-center justify-between ${
              feedbackMsg.type === "success" ? "bg-brutal-green text-black" : "bg-brutal-pink text-black"
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="font-mono text-xs font-black underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Triage Tabs & Queue Filter Header */}
        <div className="bg-white border-2 border-black rounded-3xl p-4 shadow-brutal flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black border-2 border-black transition shadow-[2px_2px_0px_#000] ${
                activeTab === "pending"
                  ? "bg-brutal-yellow text-black scale-[1.02]"
                  : "bg-paper-100 text-black hover:bg-paper-200"
              }`}
            >
              Pending Verification ({pendingListings.length})
            </button>

            <button
              onClick={() => setActiveTab("needs_changes")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black border-2 border-black transition shadow-[2px_2px_0px_#000] ${
                activeTab === "needs_changes"
                  ? "bg-brutal-yellow text-black scale-[1.02]"
                  : "bg-paper-100 text-black hover:bg-paper-200"
              }`}
            >
              Needs Changes ({needsChangesListings.length})
            </button>

            <button
              onClick={() => setActiveTab("cleared")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black border-2 border-black transition shadow-[2px_2px_0px_#000] ${
                activeTab === "cleared"
                  ? "bg-brutal-yellow text-black scale-[1.02]"
                  : "bg-paper-100 text-black hover:bg-paper-200"
              }`}
            >
              Cleared History ({clearedListings.length})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center space-x-2.5 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search title, seller, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[1px_1px_0px_#000]"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none shadow-[1px_1px_0px_#000]"
            >
              <option value="ALL">All Categories</option>
              <option value="Textbooks & Notes">Textbooks</option>
              <option value="Electronics & Calculators">Electronics</option>
              <option value="Hostel & Room Essentials">Hostel Gear</option>
              <option value="Lab Equipment & Uniforms">Lab Equipment</option>
              <option value="Stationery & Drafting">Drafting</option>
              <option value="Bicycles & Mobility">Bicycles</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </div>

        {/* Main Workstation Queue Layout (5 Cols List + 7 Cols Inspection) */}
        {activeTabListings.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-3xl p-12 text-center space-y-3 shadow-brutal">
            <div className="w-14 h-14 bg-brutal-green border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
              <CheckCircle className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-sans text-xl font-black text-black">
              No Listings in {activeTab.toUpperCase().replace("_", " ")}
            </h3>
            <p className="text-xs font-semibold text-ink-600 max-w-sm mx-auto">
              There are currently no submissions matching your active filter. Campus notice board records are in sync.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Queue List (5 Cols) */}
            <div className="lg:col-span-5 bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal flex flex-col">
              <div className="p-4 border-b-2 border-black/10 bg-paper-100 flex justify-between items-center text-xs font-mono font-black text-black">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Queue Items</span>
                </span>
                <span>{activeTabListings.length} listings</span>
              </div>

              <div className="divide-y-2 divide-black/10 overflow-y-auto max-h-[720px]">
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
                          ? "bg-brutal-yellow/30 border-l-4 border-black"
                          : "hover:bg-paper-50"
                      }`}
                    >
                      {listing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.thumbnail}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-paper-200 border-2 border-black flex items-center justify-center text-black flex-shrink-0 text-xs font-mono font-bold">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-sans font-black text-xs text-black truncate">
                            {listing.title}
                          </h4>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border border-black flex-shrink-0 ${
                              listing.status === "available"
                                ? "bg-brutal-green text-black"
                                : listing.status === "pending"
                                ? "bg-brutal-yellow text-black"
                                : listing.status === "needs_changes"
                                ? "bg-brutal-purple-light text-black"
                                : "bg-brutal-pink text-black"
                            }`}
                          >
                            {listing.status.toUpperCase().replace("_", " ")}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-ink-700 mt-1">
                          <span className="text-black font-black">₹{listing.price}</span>
                          <span>&bull;</span>
                          <span className="truncate">{listing.category}</span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/5 text-[10px] font-mono">
                          <span className="text-ink-600 truncate">
                            By: {listing.sellerName || "Student"}
                          </span>
                          <span
                            className={`font-black ${
                              aiEval.overallPassed ? "text-verifier-800" : "text-admin-800"
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
            </div>

            {/* Right Inspection & Decision Canvas (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedListing ? (
                <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-5">
                  {/* Top Bar: Title & Category & Price */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-black/10 pb-4 gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase bg-brutal-purple-light text-brutal-purple-dark rounded-lg border border-black shadow-[1px_1px_0px_#000]">
                          {selectedListing.category}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-paper-100 text-black rounded-lg border border-black">
                          Condition: {selectedListing.condition.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-black rounded-lg border border-black ${
                            selectedListing.status === "available"
                              ? "bg-brutal-green text-black"
                              : selectedListing.status === "pending"
                              ? "bg-brutal-yellow text-black"
                              : selectedListing.status === "needs_changes"
                              ? "bg-brutal-purple-light text-black"
                              : "bg-brutal-pink text-black"
                          }`}
                        >
                          Status: {selectedListing.status.toUpperCase()}
                        </span>
                      </div>

                      <h2 className="font-sans text-xl sm:text-2xl font-black text-black mt-2">
                        {selectedListing.title}
                      </h2>

                      <p className="text-xs font-mono text-ink-600 mt-0.5">
                        Seller: <strong className="text-black">{selectedListing.sellerName || "Student"}</strong> &bull; Contact: {selectedListing.sellerPhone || "None provided"}
                      </p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="font-sans text-3xl font-black text-black">
                        ₹{selectedListing.price}
                      </div>
                      <span className="text-[10px] text-ink-600 font-mono font-bold">Asking Price</span>
                    </div>
                  </div>

                  {/* Multi-Angle Proof Photo Gallery with High-Res Zoom */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-black text-black uppercase tracking-wider flex items-center space-x-1.5">
                        <Camera className="w-4 h-4 text-black" />
                        <span>Multi-Angle Proof Photo Gallery ({proofPhotos.length} Shots)</span>
                      </label>
                      <span className="text-[11px] font-mono text-ink-600">
                        {activeImage?.viewName || "Angle Inspection"}
                      </span>
                    </div>

                    {/* Main Inspection View */}
                    <div className="relative group rounded-2xl overflow-hidden border-2 border-black shadow-brutal bg-paper-100 h-64 sm:h-80 flex items-center justify-center">
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
                            className="absolute bottom-3 right-3 px-3 py-1.5 bg-black text-white text-xs font-mono font-bold rounded-xl border border-white flex items-center space-x-1.5 shadow-md hover:bg-ink-800 transition"
                          >
                            <ZoomIn className="w-4 h-4" />
                            <span>Zoom Full Res</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs font-mono font-bold text-ink-500">
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
                            className={`p-1.5 rounded-xl border-2 text-left transition flex flex-col items-center ${
                              activeAngleIndex === idx
                                ? "border-black bg-brutal-yellow/40 shadow-[2px_2px_0px_#000]"
                                : "border-black/30 hover:border-black bg-white"
                            }`}
                          >
                            <div className="w-full h-16 rounded-lg overflow-hidden bg-paper-100 border border-black/20">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-black mt-1 truncate w-full text-center">
                              {img.viewName || `Angle ${idx + 1}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Student Description */}
                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Student Item Description</span>
                    </label>
                    <p className="text-xs font-semibold text-black bg-paper-50 p-3.5 rounded-xl border-2 border-black leading-relaxed whitespace-pre-wrap">
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
                      <div className="bg-paper-50 border-2 border-black rounded-2xl p-4 text-xs space-y-3.5 shadow-[2px_2px_0px_#000]">
                        <div className="flex flex-wrap items-center justify-between border-b border-black/15 pb-2 gap-2">
                          <span className="font-sans font-black text-black flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-brutal-purple" />
                            <span>AI Vision &amp; Quality Co-Pilot</span>
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-black border border-black ${
                              aiEval.overallPassed
                                ? "bg-brutal-green text-black"
                                : "bg-brutal-pink text-black"
                            }`}
                          >
                            AI Advice: {aiEval.verifierAdvice.recommendedAction} ({aiEval.verifierAdvice.confidenceScore}% conf)
                          </span>
                        </div>

                        {/* 3 Metric Summary Boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                            <span className="text-[10px] text-ink-600 font-mono block">Safety &amp; Compliance</span>
                            <span
                              className={`font-black text-xs ${
                                aiEval.safetyCheck.status === "CLEARED" ? "text-verifier-800" : "text-admin-800"
                              }`}
                            >
                              {aiEval.safetyCheck.status === "CLEARED" ? "Cleared (Safe) ✅" : "Flagged ⚠️"}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                            <span className="text-[10px] text-ink-600 font-mono block">Syllabus Fair Range</span>
                            <span className="font-black text-xs text-black block">
                              ₹{aiEval.priceEval.estimatedMin} - ₹{aiEval.priceEval.estimatedMax}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold ${
                                isPriceFair ? "text-verifier-800" : "text-admin-800"
                              }`}
                            >
                              {isPriceFair ? "Fair Valuation" : selectedListing.price > aiEval.priceEval.estimatedMax ? "Above Range ⚠️" : "Below Range"}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                            <span className="text-[10px] text-ink-600 font-mono block">Quality Grade</span>
                            <span className="font-black text-xs text-black">
                              Grade {aiEval.qualityCheck.grade} ({aiEval.qualityCheck.qualityScore}/100)
                            </span>
                          </div>
                        </div>

                        {/* AI Vision & Photo Authenticity */}
                        {aiEval.imageAnalysis && (
                          <div className="p-3 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-ink-600 uppercase text-[10px]">
                                AI Vision &amp; Photo Authenticity
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border border-black ${
                                  aiEval.imageAnalysis.isGenuine ? "bg-brutal-green text-black" : "bg-brutal-pink text-black"
                                }`}
                              >
                                {aiEval.imageAnalysis.isGenuine ? "Genuine Student Photo" : "Review Photo"}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                              <span className="text-black font-bold">
                                Detected: {aiEval.imageAnalysis.detectedVisualItem}
                              </span>
                              <span>&bull;</span>
                              <span
                                className={
                                  aiEval.imageAnalysis.isMatch ? "text-verifier-800 font-bold" : "text-admin-800 font-bold"
                                }
                              >
                                {aiEval.imageAnalysis.matchStatus.replace("_", " ")} ({aiEval.imageAnalysis.matchConfidence}%)
                              </span>
                            </div>
                            <p className="text-[10px] text-ink-600 font-mono">
                              {aiEval.imageAnalysis.matchExplanation}
                            </p>
                          </div>
                        )}

                        {aiEval.verifierAdvice.summaryBulletPoints.length > 0 && (
                          <ul className="list-disc list-inside text-ink-700 text-[11px] space-y-1 font-medium bg-white p-3 rounded-xl border border-black">
                            {aiEval.verifierAdvice.summaryBulletPoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}

                  {/* Fast Action Preset Remarks */}
                  <div className="space-y-2 border-t-2 border-black/10 pt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-black text-black uppercase tracking-wider">
                        Fast-Action Preset Remarks (Click to Append)
                      </label>
                      <span className="text-[10px] font-mono text-ink-500">One-click feedback</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          applyPresetRemark(
                            "Verified genuine RUAS syllabus edition. Condition and binding verified intact."
                          )
                        }
                        className="px-2.5 py-1 bg-white hover:bg-brutal-green/30 text-black text-[11px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000] transition"
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
                        className="px-2.5 py-1 bg-white hover:bg-brutal-green/30 text-black text-[11px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000] transition"
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
                        className="px-2.5 py-1 bg-white hover:bg-brutal-yellow/50 text-black text-[11px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000] transition"
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
                        className="px-2.5 py-1 bg-white hover:bg-brutal-yellow/50 text-black text-[11px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000] transition"
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
                        className="px-2.5 py-1 bg-white hover:bg-brutal-pink/30 text-black text-[11px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000] transition"
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
                        className="px-2.5 py-1 bg-white hover:bg-paper-200 text-black text-[11px] font-mono font-bold rounded-lg border border-black shadow-[1px_1px_0px_#000] transition"
                      >
                        📝 Incomplete Description
                      </button>
                    </div>
                  </div>

                  {/* Custom Remark & Decision Controls */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider">
                      Official Verifier Remark / Student Feedback Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter verification feedback or select from the preset remark buttons above..."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
                    />

                    {/* Decision Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => handleDecision(selectedListing.id, "available")}
                        disabled={processingId === selectedListing.id}
                        className="py-3 px-4 bg-brutal-green hover:bg-brutal-green-dark text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Approve &amp; Publish</span>
                      </button>

                      <button
                        onClick={() => handleDecision(selectedListing.id, "needs_changes")}
                        disabled={processingId === selectedListing.id}
                        className="py-3 px-4 bg-brutal-yellow hover:bg-brutal-yellow-light text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleDecision(selectedListing.id, "rejected")}
                        disabled={processingId === selectedListing.id}
                        className="py-3 px-4 bg-brutal-pink hover:bg-brutal-pink-dark text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Reject Listing</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* High-Resolution Photo Zoom Modal */}
        {zoomImageUrl && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full bg-white border-4 border-black rounded-3xl p-4 shadow-brutal flex flex-col space-y-3">
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-black" />
                  <span className="font-sans font-black text-sm text-black">
                    High-Resolution Proof Photo Inspector
                  </span>
                </div>
                <button
                  onClick={() => setZoomImageUrl(null)}
                  className="p-1.5 rounded-lg border-2 border-black bg-brutal-pink hover:bg-brutal-pink-dark text-black transition"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-paper-100 rounded-2xl border-2 border-black p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomImageUrl}
                  alt="High Resolution Inspector"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>

              <div className="flex justify-between items-center text-xs font-mono font-bold text-ink-600">
                <span>Inspecting: {selectedListing?.title}</span>
                <button
                  onClick={() => setZoomImageUrl(null)}
                  className="px-4 py-1.5 bg-black text-white rounded-xl font-sans font-black hover:bg-ink-800"
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
