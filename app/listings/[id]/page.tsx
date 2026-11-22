"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, onSnapshot, setDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing, ListingImage } from "@/types/listing";
import { UserProfile } from "@/types/user";
import { PRESET_AVATARS } from "@/lib/constants";
import { validateListingAI, getSimilarListingsAI } from "@/lib/ai";
import { useAuth } from "@/context/AuthContext";
import { ReportModal } from "@/components/listings/ReportModal";
import { ListingCard } from "@/components/listings/ListingCard";
import { getProductImageSet } from "@/lib/demoImages";
import { DEMO_LISTINGS_BY_ID, isDemoListing } from "@/lib/demoListings";
import {
  Phone,
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  Heart,
  Flag,
  ChevronLeft,
  Calendar,
  User,
  Tag,
  AlertCircle,
  GraduationCap,
  MapPin,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardGrid } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [otherListings, setOtherListings] = useState<Listing[]>([]);
  const listingSellerId = listing?.sellerId;
  const listingIsDemo = listing?.isDemo === true || listing?.isPresentationDemo === true;

  useEffect(() => {
    if (!id) return;
    const demoListing = DEMO_LISTINGS_BY_ID[id];
    if (demoListing) {
      setListing(demoListing);
      setImages((demoListing.images || []).map((dataUrl, index) => ({
        id: `demo-image-${index + 1}`,
        dataUrl,
      })));
      setLoading(false);
      return;
    }

    const listingRef = doc(db, "listings", id);

    const unsubscribe = onSnapshot(
      listingRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        } else {
          setListing(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Fetch error:", err.message);
        setLoading(false);
      }
    );

    // Fetch images subcollection
    const fetchImages = async () => {
      try {
        const snap = await getDocs(collection(db, `listings/${id}/images`));
        const imgs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ListingImage[];
        setImages(imgs);
      } catch (e) {
        console.warn("Subcollection images read error:", e);
      }
    };

    fetchImages();
    return () => unsubscribe();
  }, [id]);

  // Check wishlist
  useEffect(() => {
    if (!user || !id) return;
    if (DEMO_LISTINGS_BY_ID[id]) {
      setIsWishlisted(false);
      return;
    }
    const checkWish = async () => {
      try {
        const snap = await getDoc(doc(db, `wishlists/${user.uid}/items`, id));
        setIsWishlisted(snap.exists());
      } catch (e) {}
    };
    checkWish();
  }, [user, id]);

  // Fetch live seller profile for real-time contact and student verification
  useEffect(() => {
    if (listingIsDemo) {
      setSellerProfile(null);
      return;
    }
    if (!listingSellerId) return;
    const fetchSeller = async () => {
      try {
        const snap = await getDoc(doc(db, "users", listingSellerId));
        if (snap.exists()) {
          setSellerProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
      } catch (e) {
        console.warn("[ListingDetailPage] Seller profile fetch warning:", e);
      }
    };
    fetchSeller();
  }, [listingSellerId, listingIsDemo]);

  // Fetch candidate listings for AI Similar Gear
  useEffect(() => {
    if (DEMO_LISTINGS_BY_ID[id]) {
      setOtherListings([]);
      return;
    }
    const fetchOthers = async () => {
      try {
        const snap = await getDocs(query(collection(db, "listings"), where("status", "==", "available")));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Listing[];
        setOtherListings(items);
      } catch (e) {
        console.warn("[ListingDetailPage] Candidate listings fetch error:", e);
      }
    };
    fetchOthers();
  }, [id]);

  const toggleWishlist = async () => {
    if (listing && isDemoListing(listing)) {
      return;
    }
    if (!user || !listing) {
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }
    const wishRef = doc(db, `wishlists/${user.uid}/items`, listing.id);
    if (isWishlisted) {
      await import("firebase/firestore").then(({ deleteDoc }) => deleteDoc(wishRef));
      setIsWishlisted(false);
    } else {
      await setDoc(wishRef, {
        listingId: listing.id,
        title: listing.title,
        price: listing.price,
        category: listing.category,
        thumbnail: listing.thumbnail || "",
        savedAt: serverTimestamp(),
      });
      setIsWishlisted(true);
    }
  };

  const handleStartChat = async () => {
    if (listing && isDemoListing(listing)) {
      return;
    }
    if (!user || !listing) {
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }

    if (!listing.sellerId) {
      alert("Seller information is missing from this listing.");
      return;
    }

    if (user.uid === listing.sellerId) {
      alert("You cannot start a conversation with yourself as the seller.");
      return;
    }

    setStartingChat(true);

    try {
      // Deterministic conversation ID between buyer and seller for this listing
      // to avoid duplicate conversation threads
      const conversationId = `${listing.id}_${user.uid}`;
      const convRef = doc(db, "conversations", conversationId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        await setDoc(convRef, {
          id: conversationId,
          listingId: listing.id,
          listingTitle: listing.title,
          participantIds: [user.uid, listing.sellerId],
          participantNames: {
            [user.uid]: profile?.name || "Student Buyer",
            [listing.sellerId]: listing.sellerName || "Student Seller",
          },
          lastMessage: "Conversation initiated",
          updatedAt: serverTimestamp(),
        });
      }

      router.push(`/messages/${conversationId}`);
    } catch (err: any) {
      console.error("[handleStartChat error]:", err);
      alert("Failed to start chat: " + err.message);
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <Card variant="outlined" padding="lg" className="w-fit mx-auto space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-8 h-8 text-modern-primary animate-spin" aria-hidden="true" />
            <span className="text-sm font-mono font-medium text-modern-text-tertiary">Loading item specifications...</span>
          </div>
          <div className="h-2 bg-modern-surface-hover rounded-full overflow-hidden w-64 mx-auto">
            <div className="h-full w-1/4 bg-modern-primary animate-pulse rounded-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto my-12">
        <Card variant="outlined" padding="lg" className="text-center space-y-4 border-modern-danger/50">
          <div className="w-14 h-14 bg-modern-danger-light border border-modern-danger/30 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-modern-danger" aria-hidden="true" />
          </div>
          <h2 className="font-sans text-xl font-bold text-modern-text-primary">
            Listing Unavailable
          </h2>
          <p className="text-sm font-mono text-modern-text-tertiary leading-relaxed">
            This listing does not exist, has been removed, or was taken down by campus moderation.
          </p>
          <LinkButton href="/browse" variant="primary" size="lg" leftIcon={<ChevronLeft className="w-4 h-4" />}>
            Return to Notice Board
          </LinkButton>
        </Card>
      </div>
    );
  }

  const isSold = listing.status === "sold";
  const isDemo = isDemoListing(listing);
  const isSeller = user?.uid === listing.sellerId;

  // Resolve multiple gallery images: subcollection -> listing.images array -> fallback demo image set
  const fallbackImages: string[] = getProductImageSet(listing.id + " " + listing.title).images.map((i) => i.dataUrl);
  const displayImages: string[] =
    images.length > 0
      ? images.map((i) => i.dataUrl)
      : (listing as any).images && (listing as any).images.length > 0
      ? ((listing as any).images as string[])
      : fallbackImages;

  // AI Evaluation
  const aiEval =
    listing.aiValidation ||
    validateListingAI({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      condition: listing.condition,
      price: listing.price,
      imageCount: displayImages.length || 3,
      images: displayImages.map((src) => ({ dataUrl: src })),
    });

  // Similar gear
  const similarGear = getSimilarListingsAI(listing, otherListings, 3);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">

      {/* Back breadcrumb & Header Actions */}
      <div className="flex items-center justify-between">
        <LinkButton
          href="/browse"
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="text-modern-text-secondary hover:text-modern-text-primary"
        >
          Back to Notice Board
        </LinkButton>

        {!isDemo && <div className="flex items-center space-x-2">
          {/* Wishlist */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleWishlist}
            leftIcon={isWishlisted ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
            aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className="transition-colors"
          >
            {isWishlisted ? "Saved" : "Save"}
          </Button>

          {/* Report Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            leftIcon={<Flag className="w-4 h-4" />}
            aria-label="Report this listing"
            className="text-modern-text-tertiary hover:text-modern-danger"
          />
        </div>}
      </div>

      {/* Sold Banner Notice */}
      {isSold && (
        <Card variant="outlined" padding="md" className="border-modern-warning/50 bg-modern-warning-light/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Badge variant="warning" size="sm" className="font-sans text-xs">
              ITEM SOLD
            </Badge>
            <span className="text-sm font-mono text-modern-text-secondary">
              This item has found a student buyer and is no longer available.
            </span>
          </div>
          <Badge variant="secondary" size="xs" className="font-mono">
            Single-Sale Verified
          </Badge>
        </Card>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Gallery Column (6 Cols) */}
        <div className="md:col-span-6 space-y-4">
          <Card variant="elevated" padding="none" className="rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] relative bg-modern-surface-hover">
              {displayImages[activeImgIndex] ? (
                <img
                  src={displayImages[activeImgIndex]}
                  alt={listing.title}
                  className={`w-full h-full object-cover ${isSold ? "grayscale" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-mono text-modern-text-tertiary">
                  No Photo Available
                </div>
              )}

              {/* Verified Badge Overlay */}
              {!isDemo && (
                <div className="absolute bottom-3 left-3">
                  <Badge variant="verifier" size="sm" dot className="shadow-modern-lg">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    Campus Verified Listing
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Thumbnails row */}
          {displayImages.length > 1 && (
            <div className="flex space-x-2.5 overflow-x-auto pb-1 -ml-0.5" role="group" aria-label="Product image thumbnails">
              {displayImages.map((src: string, i: number) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  className={`w-16 h-16 p-0 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                    activeImgIndex === i
                      ? "ring-2 ring-modern-primary ring-offset-2 ring-offset-modern-surface shadow-modern-sm"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  onClick={() => setActiveImgIndex(i)}
                  aria-label={`View image ${i + 1} of ${displayImages.length}`}
                  aria-current={activeImgIndex === i ? "true" : "false"}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications & Actions Column (6 Cols) */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-5">

            {/* Category & Condition Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm" className="font-sans">
                {listing.category}
              </Badge>
              <Badge variant="secondary" size="sm" className="capitalize font-sans">
                Condition: {listing.condition.replace("_", " ")}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-modern-text-primary leading-tight tracking-tight">
              {listing.title}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline flex-wrap gap-3">
              <div className="font-sans font-bold text-3xl sm:text-4xl text-modern-text-primary">
                ₹{listing.price.toLocaleString("en-IN")}
              </div>
              {!isDemo && <Badge variant="warm" size="sm" className="font-sans">
                Fair-Trade Fixed Price
              </Badge>}
            </div>

            {/* Description */}
            <Card variant="outlined" padding="md" className="border-modern-border/50">
              <h3 className="text-xs font-sans font-semibold text-modern-text-primary uppercase tracking-wider mb-3">
                Item Description & Usage Notes
              </h3>
              <p className="text-sm text-modern-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                {listing.description}
              </p>
            </Card>

            {/* Seller Profile Card */}
            {!isDemo && <Card variant="elevated" padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={sellerProfile?.photoURL}
                  alt={sellerProfile?.name || listing.sellerName || "Verified Student"}
                  fallback={sellerProfile?.name || listing.sellerName || "Verified Student"}
                  size="lg"
                  shape="circle"
                  status="online"
                  statusPosition="bottom-right"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-sans font-semibold text-sm text-modern-text-primary">
                      {sellerProfile?.name || listing.sellerName || "Verified Student"}
                    </span>
                    {!isDemo && <Badge variant="verifier" size="xs" dot>Verified Peer</Badge>}
                  </div>
                  <span className="text-xs font-mono text-modern-text-tertiary block">
                    {sellerProfile?.course ? `${sellerProfile.course} ${sellerProfile?.year ? `• ${sellerProfile.year}` : ""}` : "MSRUAS Enrolled Student"}
                  </span>
                  {!isDemo && sellerProfile?.campus && (
                    <span className="text-[10px] font-mono text-modern-text-tertiary block">
                      Campus: {sellerProfile.campus}
                    </span>
                  )}
                </div>
              </div>

              {/* Direct Call Link */}
              {!isDemo && sellerProfile?.phone && !isSeller && (
                <a
                  href={`tel:${sellerProfile.phone}`}
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" leftIcon={<Phone className="w-3.5 h-3.5" />}>
                    Call Seller
                  </Button>
                </a>
              )}
            </Card>}

            {/* AI Product Valuation & Quality Card */}
            {!isDemo && <Card variant="elevated" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-sans font-semibold text-sm text-modern-text-primary flex items-center space-x-2">
                  <Badge variant="warm" size="sm" className="p-1.5">
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                  </Badge>
                  <span>AI Fair Price & Quality Assessment</span>
                </span>
                <Badge variant="success" size="sm" dot className="font-mono">
                  Grade {aiEval.qualityCheck.grade} ({aiEval.qualityCheck.qualityScore}/100)
                </Badge>
              </div>

              {/* AI Visual Verification Badge */}
              {aiEval.imageAnalysis && (
                <Card variant="outlined" padding="sm" className="border-modern-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono font-medium text-modern-text-secondary flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-modern-verifier" aria-hidden="true" />
                      <span>AI Visual Authenticity:</span>
                    </span>
                    <span className="font-mono font-semibold text-modern-text-primary">
                      {aiEval.imageAnalysis.isGenuine ? "✓ Verified Genuine Physical Item" : "Under Review"}
                    </span>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between text-sm pt-2 border-t border-modern-border/50">
                <span className="font-mono text-modern-text-tertiary">Fair Peer Benchmark:</span>
                <span className="font-mono font-semibold text-modern-text-primary">
                  ₹{aiEval.priceEval.estimatedMin} - ₹{aiEval.priceEval.estimatedMax}
                </span>
              </div>

              <p className="text-sm font-mono text-modern-text-tertiary leading-normal">
                {aiEval.priceEval.analysisSummary}
              </p>

              {aiEval.suggestedTags && aiEval.suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiEval.suggestedTags.map((tag) => (
                    <Badge key={tag} variant="outline" size="xs" className="font-mono">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>}
          </div>

          {/* CTA Buttons */}
          {!isDemo && <div className="pt-4 border-t border-modern-border/50 space-y-3">
            {isSeller ? (
              <Card variant="outlined" padding="md" className="text-center border-modern-border/50 bg-modern-surface-hover/50">
                <p className="text-sm font-mono text-modern-text-tertiary">
                  This is your listing. Switch to Seller Dashboard to manage your items.
                </p>
              </Card>
            ) : isSold ? (
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                disabled
                className="text-modern-text-tertiary"
              >
                Item Sold &bull; Checkout Closed
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={handleStartChat}
                  disabled={startingChat}
                  isLoading={startingChat}
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  className="shadow-modern-sm hover:shadow-modern"
                >
                  Chat with Seller
                </Button>

                <Link
                  href={`/checkout/${listing.id}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="lg" fullWidth leftIcon={<ShoppingBag className="w-4 h-4" />}>
                    Buy Now (₹{listing.price.toLocaleString("en-IN")})
                  </Button>
                </Link>
              </div>
            )}
          </div>}
        </div>
      </div>

      {/* AI Recommended Similar Products */}
      {similarGear.length > 0 && (
        <Card variant="elevated" padding="lg" className="space-y-4">
          <CardHeader
            title="Similar Campus Gear & Alternatives"
            subtitle="AI Relevance Matched"
            action={
              <Badge variant="warm" size="xs">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span className="ml-1">AI Curated</span>
              </Badge>
            }
            className="border-b border-modern-border/50 pb-3"
          />
          <CardContent className="pt-0">
            <CardGrid cols={3} gap="md">
              {similarGear.map((item) => (
                <div key={item.listing.id} className="flex flex-col">
                  <Badge variant="primary" size="xs" className="mb-2 self-start">
                    {item.recommendationReason}
                  </Badge>
                  <ListingCard listing={item.listing} isWishlistedInitial={isWishlisted} />
                </div>
              ))}
            </CardGrid>
          </CardContent>
        </Card>
      )}

      {/* Report Modal */}
      <ReportModal
        listingId={listing.id}
        listingTitle={listing.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
