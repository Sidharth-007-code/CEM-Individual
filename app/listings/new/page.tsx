"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { CATEGORIES, ListingCategory, ListingCondition } from "@/types/listing";
import { CATEGORY_PRICE_RANGES, MIN_LISTING_IMAGES } from "@/lib/constants";
import { compressMultipleImages, CompressedImageResult } from "@/lib/images";
import { runAutomatedListingCheck } from "@/lib/listingCheck";
import { enhanceListingAI, validateListingAI } from "@/lib/ai";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui";
import {
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function NewListingPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ListingCategory>(CATEGORIES[0]);
  const [condition, setCondition] = useState<ListingCondition>("good");
  const [price, setPrice] = useState<number | "">("");
  const [images, setImages] = useState<CompressedImageResult[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolishingAI, setIsPolishingAI] = useState(false);

  // Live AI validation & automated check
  const numericPrice = Number(price) || 0;
  const checkResult = runAutomatedListingCheck({
    title,
    description,
    category,
    condition,
    price: numericPrice,
    imageCount: images.length,
    imageSizesKb: images.map((img) => img.sizeKb),
    images,
  });

  const handleAIPolish = () => {
    if (!title.trim() && !description.trim()) {
      setError("Please enter a rough title or brief notes first to use AI Polish.");
      return;
    }
    setIsPolishingAI(true);
    setError(null);
    try {
      const enhanced = enhanceListingAI({
        title,
        notes: description,
        category,
        condition,
        price: numericPrice,
        images,
      });

      setTitle(enhanced.polishedTitle);
      setDescription(enhanced.polishedDescription);
      if (!price || numericPrice <= 0) {
        setPrice(enhanced.suggestedPrice);
      }
      if (enhanced.suggestedCategory && enhanced.suggestedCategory !== category) {
        setCategory(enhanced.suggestedCategory);
      }
    } catch (err: any) {
      setError("AI generation notice: " + (err.message || "Failed to polish draft."));
    } finally {
      setIsPolishingAI(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setError(null);
    setCompressing(true);

    try {
      const selectedFiles = Array.from(e.target.files);
      const compressed = await compressMultipleImages(selectedFiles);
      setImages((prev) => [...prev, ...compressed]);
    } catch (err: any) {
      setError(err.message || "Failed to process image");
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (images.length < MIN_LISTING_IMAGES) {
      setError(`Please upload at least ${MIN_LISTING_IMAGES} images before submitting for verification.`);
      return;
    }

    if (numericPrice <= 0) {
      setError("Price must be a valid positive amount.");
      return;
    }

    setSubmitting(true);

    try {
      const listingRef = doc(collection(db, "listings"));
      const thumbnail = images[0]?.dataUrl || "";

      await setDoc(listingRef, {
        id: listingRef.id,
        sellerId: user.uid,
        sellerName: profile?.name || "Student Seller",
        sellerPhone: profile?.phone || "",
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: numericPrice,
        status: "pending",
        checkResult,
        aiValidation: checkResult.aiResult,
        aiTags: checkResult.aiResult?.suggestedTags || [],
        reportCount: 0,
        thumbnail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (let i = 0; i < images.length; i++) {
        const imgDoc = doc(collection(db, `listings/${listingRef.id}/images`));
        await setDoc(imgDoc, {
          id: imgDoc.id,
          dataUrl: images[i].dataUrl,
          sizeKb: images[i].sizeKb,
          name: images[i].name,
          createdAt: serverTimestamp(),
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("[New Listing Submission Error]:", err);
      setError("Failed to create listing: " + (err.message || "Permission or network error"));
    } finally {
      setSubmitting(false);
    }
  };

  const categoryRange = CATEGORY_PRICE_RANGES[category];

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto my-6 space-y-6">
        
        {/* Masthead - Neo-Brutalist Layout */}
        <Card variant="elevated" padding="md" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-modern-warm border border-modern-border shadow-modern-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-modern-text-primary stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-modern-text-primary tracking-tight">
                  Post an Item for Sale
                </h1>
                <p className="text-xs font-mono font-bold text-modern-text-tertiary mt-0.5">
                  MSRUAS Safe Peer Handovers &bull; AI Product Validation Active
                </p>
              </div>
            </div>
          </div>

          <Badge variant="success" size="md" dot>Human Quality Gate</Badge>
        </Card>

        {error && (
          <div role="alert" className="p-4 bg-modern-error-light border border-modern-error/20 rounded-2xl text-sm font-medium text-modern-text-primary flex items-start space-x-2 shadow-modern-sm">
            <AlertCircle className="w-5 h-5 text-modern-error flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Photos Upload & Compression Card */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex justify-between items-center border-b-2 border-modern-border/70 pb-3">
              <div>
                <h3 className="font-sans font-semibold text-base text-modern-text-primary flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-modern-text-primary" />
                  <span>Item Photographs (Minimum 3 Required)</span>
                </h3>
                <p className="text-xs text-modern-text-tertiary font-medium">
                  Photos are compressed client-side automatically (&lt;150KB) for lightning-fast loading.
                </p>
              </div>
              <Badge variant={images.length >= MIN_LISTING_IMAGES ? "success" : "warning"} size="md">
                {images.length}/{MIN_LISTING_IMAGES} images
              </Badge>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-modern-border bg-modern-surface-hover aspect-square shadow-modern-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-modern-primary/90 text-white text-[10px] font-mono font-medium rounded-md">
                    {img.sizeKb} KB
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeImage(idx)}
                    variant="danger"
                    size="sm"
                    className="absolute top-2 right-2 !p-1.5 !gap-0 shadow-modern-sm"
                    title="Remove image"
                    aria-label={`Remove image ${idx + 1}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* Upload Input Box */}
              <label className="border border-dashed border-modern-border hover:border-modern-primary/50 hover:bg-modern-primary-light/50 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-modern-surface-hover transition-colors p-4 text-center group">
                <div className="w-10 h-10 rounded-xl bg-modern-primary-light border border-modern-primary/20 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5 text-modern-primary" />
                </div>
                <span className="text-xs font-sans font-semibold text-modern-text-primary">
                  {compressing ? "Compressing..." : "+ Add Photos"}
                </span>
                <span className="text-[10px] font-mono text-modern-text-tertiary mt-0.5">JPEG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  disabled={compressing}
                  className="hidden"
                />
              </label>
            </div>

            {/* AI Image Vision Inspection Panel */}
            {images.length > 0 && checkResult.aiResult?.imageAnalysis && (
              <div className="mt-4 p-4 rounded-2xl border border-modern-border bg-modern-surface-hover space-y-3 shadow-modern-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-modern-border/70 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-modern-primary" />
                    <span className="font-sans font-semibold text-xs text-modern-text-primary uppercase tracking-wider">
                      AI Vision Inspection &amp; Authenticity Check
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold border border-modern-border ${
                    checkResult.aiResult.imageAnalysis.isGenuine
                      ? "bg-modern-success-light text-modern-text-primary"
                      : "bg-modern-error-light text-modern-text-primary"
                  }`}>
                    {checkResult.aiResult.imageAnalysis.isGenuine ? "✓ Verified Authentic Photo" : "⚠️ Authenticity Notice"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Authenticity Card */}
                  <div className="p-3 bg-white rounded-xl border border-modern-border shadow-modern-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold text-modern-text-tertiary block uppercase">Photo Authenticity</span>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-modern-success stroke-[2.5]" />
                      <strong className="text-modern-text-primary font-sans font-semibold">
                        {checkResult.aiResult.imageAnalysis.authenticityScore}% Real Student Photo
                      </strong>
                    </div>
                    <p className="text-[11px] font-mono text-modern-text-tertiary">
                      {checkResult.aiResult.imageAnalysis.genuineSignals[0] || "Natural physical item photo with real campus lighting."}
                    </p>
                  </div>

                  {/* Product Match Card */}
                  <div className={`p-3 rounded-xl border border-modern-border shadow-modern-sm space-y-1 ${
                    checkResult.aiResult.imageAnalysis.isMatch ? "bg-white" : "bg-modern-error-light"
                  }`}>
                    <span className="text-[10px] font-mono font-bold text-modern-text-tertiary block uppercase">Product Visual Match</span>
                    <div className="flex items-center space-x-1.5">
                      {checkResult.aiResult.imageAnalysis.isMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-modern-success stroke-[2.5]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-modern-error stroke-[2.5]" />
                      )}
                      <strong className="text-modern-text-primary font-sans font-semibold truncate">
                        {checkResult.aiResult.imageAnalysis.detectedVisualItem}
                      </strong>
                    </div>
                    <p className="text-[11px] font-mono text-modern-text-secondary">
                      {checkResult.aiResult.imageAnalysis.matchExplanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Details Card */}
          <Card variant="default" padding="md" className="space-y-4">
            <h3 className="font-sans font-semibold text-base text-modern-text-primary border-b-2 border-modern-border/70 pb-3">
              Listing Details
            </h3>

            <div>
              <Input
                label="Title / Item Name"
                type="text"
                required
                id="listing-title"
                placeholder="e.g. Casio fx-991CW ClassWiz Scientific Calculator (Mint Condition)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-sm font-semibold text-modern-text-primary focus:outline-none focus:bg-white shadow-modern-sm transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Select
                  label="Category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  options={CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
                />
              </div>

              <div>
                <Select
                  label="Condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ListingCondition)}
                  options={[
                    { value: "new", label: "Brand New" },
                    { value: "like_new", label: "Like New / Barely Used" },
                    { value: "good", label: "Good (Normal Wear)" },
                    { value: "fair", label: "Fair (Usable with Marks)" },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Price (INR)"
                  type="number"
                  required
                  min={1}
                  id="listing-price"
                  hint={`Suggested campus range: ₹${categoryRange.min}–₹${categoryRange.max}`}
                  placeholder={`Range: ₹${categoryRange.min} - ₹${categoryRange.max}`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-mono font-bold text-modern-text-primary focus:outline-none focus:bg-white shadow-modern-sm transition"
                />
              </div>
            </div>

            {/* AI Fair Price Estimator & Instant Auto-Fill */}
            {checkResult.aiResult?.imageAnalysis?.priceEstimate && (
              <div className="p-3.5 bg-modern-warning-light border border-modern-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-modern-sm">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-mono font-semibold text-modern-text-primary">⚡ AI Price Recommendation:</span>
                    <span className="px-2 py-0.5 bg-modern-primary text-white text-xs font-mono font-semibold rounded-md">
                      ₹{checkResult.aiResult.imageAnalysis.priceEstimate.suggestedPrice}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-modern-text-secondary">
                    Fair campus resale range: ₹{checkResult.aiResult.imageAnalysis.priceEstimate.fairMin} – ₹{checkResult.aiResult.imageAnalysis.priceEstimate.fairMax}. {checkResult.aiResult.imageAnalysis.priceEstimate.reasoning}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => setPrice(checkResult.aiResult!.imageAnalysis!.priceEstimate.suggestedPrice)}
                  variant="warm"
                  size="sm"
                  className="shrink-0"
                >
                  <span>Apply Suggested ₹{checkResult.aiResult.imageAnalysis.priceEstimate.suggestedPrice}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="listing-description" className="block text-xs font-mono font-semibold text-modern-text-primary uppercase tracking-wider">
                  Description &amp; Handover Notes
                </label>
                <Button
                  type="button"
                  onClick={handleAIPolish}
                  disabled={isPolishingAI}
                  variant="secondary"
                  size="sm"
                  title="Auto-format and polish description using AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPolishingAI ? "Polishing..." : "✨ AI Polish & Auto-Fill"}</span>
                </Button>
              </div>
              <Textarea
                id="listing-description"
                required
                rows={5}
                placeholder="Mention semester used, edition, included accessories, reasons for selling, and preferred pickup spot... (or type rough notes and click ✨ AI Polish above!)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-medium text-modern-text-primary focus:outline-none focus:bg-white shadow-modern-sm transition"
              />
            </div>
          </Card>

          {/* AI Product Validation & Advisory Meter */}
          <Card variant="default" padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-modern-border/70 pb-3">
              <span className="font-sans font-semibold text-sm text-modern-text-primary flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-modern-primary" />
                <span>AI Product Validation &amp; Quality Assessment</span>
              </span>
              {checkResult.aiResult && (
                <span className={`text-[11px] font-mono font-semibold px-3 py-1 rounded-xl border border-modern-border shadow-modern-sm ${
                  checkResult.aiResult.overallPassed
                    ? "bg-modern-success-light text-modern-text-primary"
                    : "bg-modern-warm text-modern-text-primary"
                }`}>
                  Grade {checkResult.aiResult.qualityCheck.grade} ({checkResult.aiResult.overallScore}/100)
                </span>
              )}
            </div>

            {/* AI Metrics Grid */}
            {checkResult.aiResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Price Benchmark */}
                <div className="p-3.5 bg-modern-surface-hover border border-modern-border rounded-2xl shadow-modern-sm text-xs space-y-1">
                  <span className="font-mono font-bold text-modern-text-tertiary block text-[11px]">Fair Price Benchmark</span>
                  <span className="font-sans font-semibold text-modern-text-primary block">
                    {checkResult.aiResult.priceEval.ratingLabel}
                  </span>
                  <span className="text-[10px] text-modern-text-tertiary font-mono block">
                    Estimated: ₹{checkResult.aiResult.priceEval.estimatedMin} - ₹{checkResult.aiResult.priceEval.estimatedMax}
                  </span>
                </div>

                {/* Safety Status */}
                <div className="p-3.5 bg-modern-surface-hover border border-modern-border rounded-2xl shadow-modern-sm text-xs space-y-1">
                  <span className="font-mono font-bold text-modern-text-tertiary block text-[11px]">Campus Safety Status</span>
                  <span className={`font-semibold block ${
                    checkResult.aiResult.safetyCheck.status === "CLEARED" ? "text-modern-success" : "text-modern-error"
                  }`}>
                    {checkResult.aiResult.safetyCheck.status === "CLEARED" ? "Cleared & Safe ✅" : "Review Flagged ⚠️"}
                  </span>
                  <span className="text-[10px] text-modern-text-tertiary font-mono block">
                    Risk Level: {checkResult.aiResult.safetyCheck.riskLevel}
                  </span>
                </div>

                {/* Verifier Preview */}
                <div className="p-3.5 bg-modern-surface-hover border border-modern-border rounded-2xl shadow-modern-sm text-xs space-y-1">
                  <span className="font-mono font-bold text-modern-text-tertiary block text-[11px]">Verifier Desk Advice</span>
                  <span className="font-sans font-semibold text-modern-text-primary block">
                    Action: {checkResult.aiResult.verifierAdvice.recommendedAction}
                  </span>
                  <span className="text-[10px] text-modern-text-tertiary font-mono block">
                    Confidence: {checkResult.aiResult.verifierAdvice.confidenceScore}%
                  </span>
                </div>
              </div>
            )}

            {/* AI Tags Preview */}
            {checkResult.aiResult?.suggestedTags && checkResult.aiResult.suggestedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono font-bold text-modern-text-tertiary mr-1">Extracted Tags:</span>
                {checkResult.aiResult.suggestedTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-modern-warm text-modern-text-primary text-[10px] font-mono font-semibold rounded-md border border-modern-border shadow-modern-sm">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || images.length < MIN_LISTING_IMAGES}
            variant="primary"
            size="lg"
            fullWidth
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Publishing to Verifier Queue...</span>
              </>
            ) : (
              <>
                <span>Submit Item for Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </RouteGuard>
  );
}
