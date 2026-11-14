"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { CATEGORIES, ListingCategory, ListingCondition } from "@/types/listing";
import { CATEGORY_PRICE_RANGES, MIN_LISTING_IMAGES } from "@/lib/constants";
import { compressMultipleImages, CompressedImageResult } from "@/lib/images";
import { runAutomatedListingCheck } from "@/lib/listingCheck";
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

  // Live automated check advice
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
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                Description &amp; Handover Notes
              </label>
              <textarea
                required
                rows={4}
                placeholder="Mention semester used, edition, included accessories, reasons for selling, and preferred pickup spot..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
              />
            </div>
          </div>

          {/* Automated Advisory Linter Feedback (Mocked) */}
          <div className="bg-paper-200/70 border border-ink-300 rounded-notice p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-ink-950 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-saffron-600" />
                <span>Automated Quality Advisory (Pre-Verification Check)</span>
              </span>
              {checkResult.passed ? (
                <span className="text-[11px] font-mono font-bold text-verifier-700 bg-verifier-100 px-2 py-0.5 rounded border border-verifier-600/30">
                  Ready for Verifier
                </span>
              ) : (
                <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Advisory Notices Found
                </span>
              )}
            </div>

            {checkResult.reasons.length === 0 ? (
              <p className="text-xs text-verifier-800 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-verifier-600" />
                <span>All fair-trade standards, image criteria, and category bounds satisfied.</span>
              </p>
            ) : (
              <ul className="text-xs text-ink-700 space-y-1 list-disc list-inside">
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

