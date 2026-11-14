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
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-grid-pattern">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Post an Item for Sale
                </h1>
                <p className="text-xs font-mono font-bold text-ink-600 mt-0.5">
                  MSRUAS Safe Peer Handovers &bull; AI Product Validation Active
                </p>
              </div>
            </div>
          </div>

          <span className="px-3.5 py-1.5 bg-brutal-green text-black text-xs font-mono font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
            Human Quality Gate
          </span>
        </div>

        {error && (
          <div className="p-4 bg-brutal-pink border-2 border-black rounded-2xl text-xs font-bold text-black flex items-start space-x-2 shadow-[2px_2px_0px_#000]">
            <AlertCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5 stroke-[2.5]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Photos Upload & Compression Card */}
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black/10 pb-3">
              <div>
                <h3 className="font-sans font-black text-base text-black flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-black" />
                  <span>Item Photographs (Minimum 3 Required)</span>
                </h3>
                <p className="text-xs text-ink-600 font-medium">
                  Photos are compressed client-side automatically (&lt;150KB) for lightning-fast loading.
                </p>
              </div>
              <span className={`text-xs font-mono font-black px-3 py-1 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] ${
                images.length >= 3 ? "bg-brutal-green text-black" : "bg-brutal-yellow text-black"
              }`}>
                {images.length}/3 Min Images
              </span>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border-2 border-black bg-paper-50 aspect-square shadow-[2px_2px_0px_#000]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.dataUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold rounded-md border border-white">
                    {img.sizeKb} KB
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-brutal-pink text-black border-2 border-black rounded-lg shadow-[1px_1px_0px_#000] hover:scale-105 transition"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              ))}

              {/* Upload Input Box */}
              <label className="border-2 border-dashed border-black hover:bg-brutal-yellow/20 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-paper-50 transition p-4 text-center group">
                <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center mb-2 group-hover:-translate-y-0.5 transition">
                  <Upload className="w-5 h-5 text-black stroke-[2.5]" />
                </div>
                <span className="text-xs font-sans font-black text-black">
                  {compressing ? "Compressing..." : "+ Add Photos"}
                </span>
                <span className="text-[10px] font-mono text-ink-600 mt-0.5">JPEG, PNG, WEBP</span>
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
              <div className="mt-4 p-4 rounded-2xl border-2 border-black bg-paper-50 space-y-3 shadow-[2px_2px_0px_#000]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-brutal-purple" />
                    <span className="font-sans font-black text-xs text-black uppercase tracking-wider">
                      AI Vision Inspection &amp; Authenticity Check
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black border border-black ${
                    checkResult.aiResult.imageAnalysis.isGenuine
                      ? "bg-brutal-green text-black"
                      : "bg-brutal-pink text-black"
                  }`}>
                    {checkResult.aiResult.imageAnalysis.isGenuine ? "✓ Verified Authentic Photo" : "⚠️ Authenticity Notice"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Authenticity Card */}
                  <div className="p-3 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000] space-y-1">
                    <span className="text-[10px] font-mono font-bold text-ink-600 block uppercase">Photo Authenticity</span>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-brutal-green-dark stroke-[2.5]" />
                      <strong className="text-black font-sans font-black">
                        {checkResult.aiResult.imageAnalysis.authenticityScore}% Real Student Photo
                      </strong>
                    </div>
                    <p className="text-[11px] font-mono text-ink-600">
                      {checkResult.aiResult.imageAnalysis.genuineSignals[0] || "Natural physical item photo with real campus lighting."}
                    </p>
                  </div>

                  {/* Product Match Card */}
                  <div className={`p-3 rounded-xl border border-black shadow-[1px_1px_0px_#000] space-y-1 ${
                    checkResult.aiResult.imageAnalysis.isMatch ? "bg-white" : "bg-brutal-pink/30"
                  }`}>
                    <span className="text-[10px] font-mono font-bold text-ink-600 block uppercase">Product Visual Match</span>
                    <div className="flex items-center space-x-1.5">
                      {checkResult.aiResult.imageAnalysis.isMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-brutal-green-dark stroke-[2.5]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-admin-600 stroke-[2.5]" />
                      )}
                      <strong className="text-black font-sans font-black truncate">
                        {checkResult.aiResult.imageAnalysis.detectedVisualItem}
                      </strong>
                    </div>
                    <p className="text-[11px] font-mono text-ink-700">
                      {checkResult.aiResult.imageAnalysis.matchExplanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Card */}
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
            <h3 className="font-sans font-black text-base text-black border-b-2 border-black/10 pb-3">
              Listing Details
            </h3>

            <div>
              <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                Title / Item Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Casio fx-991CW ClassWiz Scientific Calculator (Mint Condition)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-sm font-semibold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategory)}
                  className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ListingCondition)}
                  className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition cursor-pointer"
                >
                  <option value="new">Brand New</option>
                  <option value="like_new">Like New / Barely Used</option>
                  <option value="good">Good (Normal Wear)</option>
                  <option value="fair">Fair (Usable with Marks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder={`Range: ₹${categoryRange.min} - ₹${categoryRange.max}`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
                />
              </div>
            </div>

            {/* AI Fair Price Estimator & Instant Auto-Fill */}
            {checkResult.aiResult?.imageAnalysis?.priceEstimate && (
              <div className="p-3.5 bg-brutal-yellow/20 border-2 border-black rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-mono font-black text-black">⚡ AI Price Recommendation:</span>
                    <span className="px-2 py-0.5 bg-black text-white text-xs font-mono font-black rounded-md">
                      ₹{checkResult.aiResult.imageAnalysis.priceEstimate.suggestedPrice}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-ink-700">
                    Fair campus resale range: ₹{checkResult.aiResult.imageAnalysis.priceEstimate.fairMin} – ₹{checkResult.aiResult.imageAnalysis.priceEstimate.fairMax}. {checkResult.aiResult.imageAnalysis.priceEstimate.reasoning}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPrice(checkResult.aiResult!.imageAnalysis!.priceEstimate.suggestedPrice)}
                  className="px-3.5 py-1.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition shrink-0 flex items-center space-x-1"
                >
                  <span>Apply Suggested ₹{checkResult.aiResult.imageAnalysis.priceEstimate.suggestedPrice}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider">
                  Description &amp; Handover Notes
                </label>
                <button
                  type="button"
                  onClick={handleAIPolish}
                  disabled={isPolishingAI}
                  className="px-3 py-1 bg-brutal-purple-light hover:bg-brutal-purple text-brutal-purple-dark hover:text-white border-2 border-black rounded-xl text-xs font-mono font-black transition flex items-center space-x-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                  title="Auto-format and polish description using AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isPolishingAI ? "Polishing..." : "✨ AI Polish & Auto-Fill"}</span>
                </button>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Mention semester used, edition, included accessories, reasons for selling, and preferred pickup spot... (or type rough notes and click ✨ AI Polish above!)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
              />
            </div>
          </div>

          {/* AI Product Validation & Advisory Meter */}
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
              <span className="font-sans font-black text-sm text-black flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-brutal-purple" />
                <span>AI Product Validation &amp; Quality Assessment</span>
              </span>
              {checkResult.aiResult && (
                <span className={`text-[11px] font-mono font-black px-3 py-1 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] ${
                  checkResult.aiResult.overallPassed
                    ? "bg-brutal-green text-black"
                    : "bg-brutal-yellow text-black"
                }`}>
                  Grade {checkResult.aiResult.qualityCheck.grade} ({checkResult.aiResult.overallScore}/100)
                </span>
              )}
            </div>

            {/* AI Metrics Grid */}
            {checkResult.aiResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Price Benchmark */}
                <div className="p-3.5 bg-paper-50 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] text-xs space-y-1">
                  <span className="font-mono font-bold text-ink-600 block text-[11px]">Fair Price Benchmark</span>
                  <span className="font-sans font-black text-black block">
                    {checkResult.aiResult.priceEval.ratingLabel}
                  </span>
                  <span className="text-[10px] text-ink-600 font-mono block">
                    Estimated: ₹{checkResult.aiResult.priceEval.estimatedMin} - ₹{checkResult.aiResult.priceEval.estimatedMax}
                  </span>
                </div>

                {/* Safety Status */}
                <div className="p-3.5 bg-paper-50 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] text-xs space-y-1">
                  <span className="font-mono font-bold text-ink-600 block text-[11px]">Campus Safety Status</span>
                  <span className={`font-black block ${
                    checkResult.aiResult.safetyCheck.status === "CLEARED" ? "text-verifier-800" : "text-admin-800"
                  }`}>
                    {checkResult.aiResult.safetyCheck.status === "CLEARED" ? "Cleared & Safe ✅" : "Review Flagged ⚠️"}
                  </span>
                  <span className="text-[10px] text-ink-600 font-mono block">
                    Risk Level: {checkResult.aiResult.safetyCheck.riskLevel}
                  </span>
                </div>

                {/* Verifier Preview */}
                <div className="p-3.5 bg-paper-50 border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000] text-xs space-y-1">
                  <span className="font-mono font-bold text-ink-600 block text-[11px]">Verifier Desk Advice</span>
                  <span className="font-sans font-black text-black block">
                    Action: {checkResult.aiResult.verifierAdvice.recommendedAction}
                  </span>
                  <span className="text-[10px] text-ink-600 font-mono block">
                    Confidence: {checkResult.aiResult.verifierAdvice.confidenceScore}%
                  </span>
                </div>
              </div>
            )}

            {/* AI Tags Preview */}
            {checkResult.aiResult?.suggestedTags && checkResult.aiResult.suggestedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono font-bold text-ink-600 mr-1">Extracted Tags:</span>
                {checkResult.aiResult.suggestedTags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-brutal-yellow text-black text-[10px] font-mono font-black rounded-md border border-black shadow-[1px_1px_0px_#000]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || images.length < MIN_LISTING_IMAGES}
            className="w-full py-4 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-sm tracking-wide rounded-2xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
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
