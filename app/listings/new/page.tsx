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
import { MockBadge } from "@/components/ui/MockBadge";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
      // Create listing document reference
      const listingRef = doc(collection(db, "listings"));

      // Thumbnail is first image for rapid grid browsing
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
        status: "pending", // Enters verifier queue
        checkResult,
        aiValidation: checkResult.aiResult,
        aiTags: checkResult.aiResult?.suggestedTags || [],
        reportCount: 0,
        thumbnail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Store individual images in subcollection listings/{id}/images
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
      <div className="max-w-3xl mx-auto my-6 space-y-6">
        
        {/* Masthead */}
        <div className="border-b border-ink-200 pb-4">
          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
              Post an Item for Sale
            </h1>
            <MockBadge label="Advisory Check Enabled" />
          </div>
          <p className="text-xs text-ink-600 mt-1">
            Every submission requires at least 3 photos and passes through automated checks and campus quality verification before appearing on the public notice board.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-admin-50 border border-admin-600/40 rounded-notice text-xs text-admin-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Photos Upload & Compression Card */}
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-5 space-y-4 shadow-card">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-sm text-ink-950 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-saffron-600" />
                  <span>Item Photographs (Minimum 3 Required)</span>
                </h3>
                <p className="text-[11px] text-ink-600">
                  Compressed client-side to max 800px width (&lt;150KB) for fast, free Spark plan hosting.
                </p>
              </div>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                images.length >= 3 ? "bg-verifier-100 text-verifier-800" : "bg-saffron-100 text-saffron-800"
              }`}>
                {images.length}/3 Min Images
              </span>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-notice overflow-hidden border border-ink-300 bg-paper-50 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-ink-950/80 text-paper-50 text-[10px] font-mono rounded">
                    {img.sizeKb} KB
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-admin-600 text-white rounded-full opacity-80 hover:opacity-100 transition shadow"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload Input Box */}
              <label className="border-2 border-dashed border-ink-300 hover:border-saffron-500 rounded-notice aspect-square flex flex-col items-center justify-center cursor-pointer bg-paper-50/60 hover:bg-paper-100 transition p-4 text-center">
                <Upload className="w-6 h-6 text-ink-500 mb-1" />
                <span className="text-xs font-medium text-ink-800">
                  {compressing ? "Compressing..." : "+ Add Photos"}
                </span>
                <span className="text-[10px] text-ink-500 mt-0.5">JPEG, PNG</span>
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
          </div>

          {/* Details Card */}
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-5 space-y-4 shadow-card">
            <h3 className="font-serif font-bold text-sm text-ink-950">
              Listing Details
            </h3>

            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                Title / Item Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Casio fx-991EX Scientific Calculator (Mint Condition)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-sm text-ink-900 focus:outline-none focus:border-saffron-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ListingCondition)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                >
                  <option value="new">Brand New</option>
                  <option value="like_new">Like New / Barely Used</option>
                  <option value="good">Good (Normal Wear)</option>
                  <option value="fair">Fair (Usable with Marks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder={`Range: ₹${categoryRange.min} - ₹${categoryRange.max}`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider">
                  Description &amp; Handover Notes
                </label>
                <button
                  type="button"
                  onClick={handleAIPolish}
                  disabled={isPolishingAI}
                  className="px-2.5 py-1 text-xs font-serif font-bold bg-saffron-50 hover:bg-saffron-100 text-saffron-800 border border-saffron-300 rounded transition flex items-center space-x-1 shadow-sm"
                  title="Auto-format and polish description using AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
                  <span>{isPolishingAI ? "Polishing..." : "✨ AI Polish & Auto-Fill"}</span>
                </button>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Mention semester used, edition, included accessories, reasons for selling, and preferred pickup spot... (or type rough notes and click ✨ AI Polish above!)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500 font-sans"
              />
            </div>
          </div>

          {/* AI Product Validation & Advisory Meter */}
          <div className="bg-paper-100 border border-ink-300 rounded-notice p-5 space-y-4 shadow-card">
            <div className="flex items-center justify-between border-b border-ink-200 pb-3">
              <span className="text-xs font-serif font-bold text-ink-950 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-saffron-600" />
                <span>AI Product Validation &amp; Quality Assessment</span>
              </span>
              {checkResult.aiResult && (
                <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                  checkResult.aiResult.overallPassed
                    ? "bg-verifier-100 text-verifier-800 border-verifier-400"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  Grade {checkResult.aiResult.qualityCheck.grade} ({checkResult.aiResult.overallScore}/100)
                </span>
              )}
            </div>

            {/* AI Metrics Grid */}
            {checkResult.aiResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Price Benchmark */}
                <div className="p-3 bg-paper-50 border border-ink-200 rounded text-xs space-y-1">
                  <span className="font-serif font-bold text-ink-600 block text-[11px]">Fair Price Benchmark</span>
                  <span className="font-bold text-ink-950 block">
                    {checkResult.aiResult.priceEval.ratingLabel}
                  </span>
                  <span className="text-[10px] text-ink-500 font-mono block">
                    Estimated: ₹{checkResult.aiResult.priceEval.estimatedMin} - ₹{checkResult.aiResult.priceEval.estimatedMax}
                  </span>
                </div>

                {/* Safety Status */}
                <div className="p-3 bg-paper-50 border border-ink-200 rounded text-xs space-y-1">
                  <span className="font-serif font-bold text-ink-600 block text-[11px]">Campus Safety Status</span>
                  <span className={`font-bold block ${
                    checkResult.aiResult.safetyCheck.status === "CLEARED" ? "text-verifier-700" : "text-admin-600"
                  }`}>
                    {checkResult.aiResult.safetyCheck.status === "CLEARED" ? "Cleared & Safe ✅" : "Review Flagged ⚠️"}
                  </span>
                  <span className="text-[10px] text-ink-500 font-mono block">
                    Risk Level: {checkResult.aiResult.safetyCheck.riskLevel}
                  </span>
                </div>

                {/* Verifier Preview */}
                <div className="p-3 bg-paper-50 border border-ink-200 rounded text-xs space-y-1">
                  <span className="font-serif font-bold text-ink-600 block text-[11px]">Verifier Desk Advice</span>
                  <span className="font-bold text-ink-950 block">
                    Action: {checkResult.aiResult.verifierAdvice.recommendedAction}
                  </span>
                  <span className="text-[10px] text-ink-500 font-mono block">
                    Confidence: {checkResult.aiResult.verifierAdvice.confidenceScore}%
                  </span>
                </div>
              </div>
            )}

            {/* AI Tags Preview */}
            {checkResult.aiResult?.suggestedTags && checkResult.aiResult.suggestedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-serif font-bold text-ink-600 mr-1">Auto-Extracted Tags:</span>
                {checkResult.aiResult.suggestedTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-paper-200 text-ink-800 text-[10px] font-mono rounded border border-ink-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Bullet points advice */}
            {checkResult.reasons.length > 0 && (
              <ul className="text-xs text-ink-700 space-y-1 list-disc list-inside pt-1 border-t border-ink-200">
                {checkResult.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || images.length < MIN_LISTING_IMAGES}
            className="w-full py-3 bg-saffron-500 hover:bg-saffron-600 text-white font-serif font-bold text-sm tracking-wide rounded-notice shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
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
          </button>
        </form>
      </div>
    </RouteGuard>
  );
}

