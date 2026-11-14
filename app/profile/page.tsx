"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { syncUserProfile } from "@/lib/profileSync";
import {
  STUDY_YEARS,
  CAMPUS_LOCATIONS,
  POPULAR_DEPARTMENTS,
  PRESET_AVATARS,
} from "@/lib/constants";
import { compressImageClientSide } from "@/lib/images";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  GraduationCap,
  MapPin,
  Camera,
  Check,
  AlertCircle,
  Save,
  ChevronLeft,
  Sparkles,
  ShoppingBag,
  Package,
  Heart,
  Tag,
  ArrowRight,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [campus, setCampus] = useState("");
  const [bio, setBio] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [avatarId, setAvatarId] = useState("");

  // Activity stats
  const [listingsCount, setListingsCount] = useState(0);
  const [soldCount, setSoldCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Populate from current user profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCourse(profile.course || POPULAR_DEPARTMENTS[0]);
      setYear(profile.year || STUDY_YEARS[0]);
      setCampus(profile.campus || CAMPUS_LOCATIONS[0]);
      setBio(profile.bio || "");
      setPersonalEmail(profile.personalEmail || "");
      setPhotoURL(profile.photoURL || "");
      setAvatarId(profile.avatarId || "");
    }
  }, [profile]);

  // Load activity metrics
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Listings count
        const listingsQ = query(collection(db, "listings"), where("sellerId", "==", user.uid));
        const listingsSnap = await getDocs(listingsQ);
        const docs = listingsSnap.docs;
        setListingsCount(docs.length);
        setSoldCount(docs.filter((d) => d.data().status === "sold").length);

        // Orders count
        const ordersQ = query(collection(db, "orders"), where("buyerId", "==", user.uid));
        const ordersSnap = await getDocs(ordersQ);
        setOrdersCount(ordersSnap.size);

        // Wishlist count
        const wishSnap = await getDocs(collection(db, `wishlists/${user.uid}/items`));
        setWishlistCount(wishSnap.size);
      } catch (err) {
        console.warn("[Profile] Stats load warning:", err);
      }
    };

    fetchStats();
  }, [user]);

  // Handle custom photo upload with client-side canvas compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setNotification(null);

    try {
      // Compress square avatar to max 400px, 0.75 JPEG
      const compressed = await compressImageClientSide(file, 400, 0.75);
      setPhotoURL(compressed.dataUrl);
      setAvatarId(""); // Clear preset when custom image uploaded
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to process photo upload",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Select preset avatar
  const handleSelectPreset = (id: string) => {
    setAvatarId(id);
    setPhotoURL(""); // Clear custom photo when preset selected
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      setNotification({ type: "error", message: "Please provide your student display name." });
      return;
    }

    if (!phone.trim()) {
      setNotification({ type: "error", message: "Phone number is required so students can call for handovers." });
      return;
    }

    setSaving(true);
    setNotification(null);

    const result = await syncUserProfile(user.uid, {
      name,
      phone,
      course,
      year,
      campus,
      bio,
      personalEmail,
      photoURL,
      avatarId,
    });

    setSaving(false);

    if (result.success) {
      await refreshProfile();
      setNotification({
        type: "success",
        message: `Profile updated successfully! Synchronized across ${result.updatedListingsCount} active campus listing(s).`,
      });
    } else {
      setNotification({
        type: "error",
        message: result.error || "Failed to save profile changes.",
      });
    }
  };

  // Active avatar preset details
  const activePreset = PRESET_AVATARS.find((a) => a.id === avatarId);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-ink-700 hover:text-saffron-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-mono text-ink-500">
            Student Identity &bull; MSRUAS
          </span>
        </div>

        {/* Feedback Alert */}
        {notification && (
          <div
            className={`p-4 rounded-notice border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
              notification.type === "success"
                ? "bg-verifier-50 border-verifier-500 text-verifier-900"
                : "bg-admin-50 border-admin-500 text-admin-900"
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === "success" ? (
                <ShieldCheck className="w-4 h-4 text-verifier-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-admin-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold underline ml-2 opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header Hero Banner */}
        <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar Display */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-paper-50 shadow-md overflow-hidden bg-paper-300 flex items-center justify-center">
                {photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoURL}
                    alt={name || "Student Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : activePreset ? (
                  <div className={`w-full h-full flex items-center justify-center text-4xl sm:text-5xl border ${activePreset.bg}`}>
                    {activePreset.emoji}
                  </div>
                ) : (
                  <span className="font-serif text-4xl sm:text-5xl font-black text-ink-900">
                    {name ? name.charAt(0).toUpperCase() : <User className="w-12 h-12 text-ink-400" />}
                  </span>
                )}
              </div>

              {/* Upload Overlay Button */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-full shadow-md cursor-pointer transition transform active:scale-95"
                title="Upload custom student photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Overview */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-black text-ink-950 tracking-tight">
                  {name || "Student Profile"}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-verifier-100 text-verifier-800 rounded-full border border-verifier-600/30">
                  {profile?.role || "Student"} &bull; Active
                </span>
              </div>

              <p className="text-xs text-ink-600 font-mono">
                {profile?.email} &bull; MSRUAS Enrolled
              </p>

              {bio && (
                <p className="text-xs text-ink-700 italic max-w-xl">
                  &ldquo;{bio}&rdquo;
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-ink-600">
                <span className="flex items-center space-x-1">
                  <GraduationCap className="w-3.5 h-3.5 text-saffron-600" />
                  <span>{course || "Course Unassigned"}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-ink-500" />
                  <span>{campus || "Main Campus"}</span>
                </span>
                {phone && (
                  <span className="flex items-center space-x-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-verifier-600" />
                    <span>{phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-6 pt-6 border-t border-ink-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-paper-50 p-3 rounded-notice border border-ink-200 text-center">
              <span className="block font-serif text-xl font-black text-ink-950">{listingsCount}</span>
              <span className="text-[11px] text-ink-500 font-medium">Items Listed</span>
            </div>
            <div className="bg-paper-50 p-3 rounded-notice border border-ink-200 text-center">
              <span className="block font-serif text-xl font-black text-verifier-700">{soldCount}</span>
              <span className="text-[11px] text-ink-500 font-medium">Items Sold</span>
            </div>
            <div className="bg-paper-50 p-3 rounded-notice border border-ink-200 text-center">
              <span className="block font-serif text-xl font-black text-ink-950">{ordersCount}</span>
              <span className="text-[11px] text-ink-500 font-medium">Orders Made</span>
            </div>
            <div className="bg-paper-50 p-3 rounded-notice border border-ink-200 text-center">
              <span className="block font-serif text-xl font-black text-saffron-600">{wishlistCount}</span>
              <span className="text-[11px] text-ink-500 font-medium">Saved Items</span>
            </div>
          </div>
        </div>

        {/* Main Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Preset & Customization */}
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-ink-200 pb-3">
              <div>
                <h2 className="font-serif text-base font-bold text-ink-950">
                  Campus Identity & Avatar
                </h2>
                <p className="text-xs text-ink-600">
                  Select a campus avatar emoji or upload your real student photo.
                </p>
              </div>
              {photoURL && (
                <button
                  type="button"
                  onClick={() => setPhotoURL("")}
                  className="text-xs font-serif font-bold text-admin-600 hover:text-admin-700 underline"
                >
                  Remove Custom Photo
                </button>
              )}
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarId === preset.id && !photoURL;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-notice border flex flex-col items-center justify-center transition ${
                      isSelected
                        ? "border-saffron-500 bg-saffron-50 shadow-sm ring-2 ring-saffron-400"
                        : "border-ink-200 bg-paper-50 hover:bg-paper-200"
                    }`}
                  >
                    <span className="text-2xl mb-1">{preset.emoji}</span>
                    <span className="text-[9px] font-mono text-ink-700 text-center truncate w-full">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span className="mt-1 w-3.5 h-3.5 bg-saffron-500 text-white rounded-full flex items-center justify-center text-[9px]">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Academic & Personal Information */}
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card space-y-4">
            <div className="border-b border-ink-200 pb-3">
              <h2 className="font-serif text-base font-bold text-ink-950">
                Academic & Student Information
              </h2>
              <p className="text-xs text-ink-600">
                Verified university details displayed to buyers and on official handover invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-950 focus:outline-none focus:border-saffron-500"
                  placeholder="e.g. Aarav Sharma"
                />
              </div>

              {/* Department / Course */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Faculty & Department *
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-950 focus:outline-none focus:border-saffron-500"
                >
                  {POPULAR_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year of Study */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Academic Year *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-950 focus:outline-none focus:border-saffron-500"
                >
                  {STUDY_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campus / Hostel Location */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Campus / Hostel Residence *
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-950 focus:outline-none focus:border-saffron-500"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Phone (for Call links) */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Contact Mobile Number (for Call Links) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono text-ink-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone.startsWith("+91") ? phone.slice(3).trim() : phone}
                    onChange={(e) => setPhone("+91 " + e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full pl-12 pr-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-mono text-ink-950 focus:outline-none focus:border-saffron-500"
                    placeholder="9876543210"
                  />
                </div>
                <span className="text-[10px] text-ink-500 mt-0.5 block">
                  Enables instant peer calls from the &quot;Call Seller&quot; button on your listings.
                </span>
              </div>

              {/* Personal Email */}
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Personal Alternate Email (Optional)
                </label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-950 focus:outline-none focus:border-saffron-500"
                  placeholder="personal.email@gmail.com"
                />
              </div>

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Student Bio / Seller Introduction
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs font-medium text-ink-950 focus:outline-none focus:border-saffron-500"
                  placeholder="e.g. 4th year CSE student. Selling previous semester engineering textbooks, lab coats, and electronics in mint condition."
                />
                <span className="text-[10px] text-ink-400 text-right block">
                  {bio.length}/160 characters
                </span>
              </div>
            </div>
          </div>

          {/* Live Peer Preview Box */}
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card space-y-3">
            <h3 className="font-serif text-xs font-bold text-ink-600 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-saffron-500" />
              <span>Live Peer Preview (How students see you on listings & chats)</span>
            </h3>

            <div className="p-4 bg-paper-50 border border-ink-200 rounded-notice flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full bg-paper-300 border border-ink-300 flex items-center justify-center overflow-hidden shrink-0">
                  {photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoURL} alt="Preview" className="w-full h-full object-cover" />
                  ) : activePreset ? (
                    <span className="text-xl">{activePreset.emoji}</span>
                  ) : (
                    <span className="font-serif font-bold text-base text-ink-900">
                      {name ? name.charAt(0).toUpperCase() : "S"}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-bold text-xs text-ink-950">
                      {name || "Verified Student"}
                    </span>
                    <span className="px-1.5 py-0.2 bg-verifier-100 text-verifier-800 text-[9px] font-mono rounded border border-verifier-600/30">
                      Verified
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-600 block">
                    {course || "B.Tech CSE"} &bull; {year || "4th Year"}
                  </span>
                  <span className="text-[10px] text-ink-400 font-mono block">
                    {campus || "Gnanagangothri Campus"}
                  </span>
                </div>
              </div>

              {phone && (
                <div className="px-3 py-1.5 bg-paper-200 border border-ink-300 rounded text-xs font-serif font-bold text-ink-800 flex items-center space-x-1 shrink-0">
                  <Phone className="w-3.5 h-3.5 text-verifier-600" />
                  <span>Call Link Ready</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-ink-200">
            <Link
              href="/dashboard"
              className="text-xs font-serif font-bold text-ink-600 hover:text-ink-900"
            >
              Cancel & Return to Dashboard
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-serif font-bold text-xs rounded-notice shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synchronizing Across Campus...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Synchronize Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
}
