"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
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

  // Academic Information Lock: Can only be updated once, then options are removed
  const isAcademicLocked = Boolean(
    profile?.academicLocked || (profile?.course && profile?.year && profile?.campus)
  );

  // Prevent background listener updates from erasing user's active typing
  const isLoadedRef = useRef(false);

  // Populate from current user profile once loaded
  useEffect(() => {
    if (profile && !isLoadedRef.current) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setCourse(profile.course || POPULAR_DEPARTMENTS[0]);
      setYear(profile.year || STUDY_YEARS[0]);
      setCampus(profile.campus || CAMPUS_LOCATIONS[0]);
      setBio(profile.bio || "");
      setPersonalEmail(profile.personalEmail || "");
      setPhotoURL(profile.photoURL || "");
      setAvatarId(profile.avatarId || "");
      isLoadedRef.current = true;
    }
  }, [profile]);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  // Form submission with auto-sanitizing validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalName = isAcademicLocked
      ? (profile?.name || name || "Student")
      : name.trim();

    if (!finalName) {
      setNotification({ type: "error", message: "Please enter your student display name." });
      return;
    }

    // Cleanse phone number: extract digits
    let sanitizedPhone = phone.trim();
    const rawDigits = sanitizedPhone.replace(/\D/g, "");
    if (rawDigits.length > 0) {
      if (rawDigits.length === 10) {
        sanitizedPhone = `+91 ${rawDigits}`;
      } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
        sanitizedPhone = `+91 ${rawDigits.slice(2)}`;
      } else if (rawDigits.length < 10) {
        setNotification({
          type: "error",
          message: "Please enter a valid 10-digit mobile number for call handovers.",
        });
        return;
      }
    }

    setSaving(true);
    setNotification(null);

    try {
      const result = await syncUserProfile(user.uid, {
        name: finalName,
        phone: sanitizedPhone,
        course: isAcademicLocked ? (profile?.course || course) : course,
        year: isAcademicLocked ? (profile?.year || year) : year,
        campus: isAcademicLocked ? (profile?.campus || campus) : campus,
        bio: bio.trim(),
        personalEmail: personalEmail.trim(),
        photoURL,
        avatarId,
      });

      setSaving(false);

      if (result.success) {
        setPhone(sanitizedPhone);
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
    } catch (err: any) {
      setSaving(false);
      setNotification({
        type: "error",
        message: err.message || "An unexpected error occurred while saving profile.",
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
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-xs font-mono font-black text-black hover:bg-paper-100 transition active:translate-x-[1px] active:translate-y-[1px]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
            <span>Dashboard</span>
          </Link>
          <span className="text-xs font-mono font-bold text-ink-700 bg-paper-100 border border-black/20 px-3 py-1 rounded-xl">
            Student Identity &bull; MSRUAS Verified
          </span>
        </div>

        {/* Feedback Alert Toast */}
        {notification && (
          <div
            className={`p-4 rounded-2xl border-2 border-black shadow-brutal flex items-center justify-between text-xs animate-in fade-in duration-200 ${
              notification.type === "success"
                ? "bg-brutal-green text-black"
                : "bg-brutal-pink text-black"
            }`}
          >
            <div className="flex items-center space-x-2 font-bold font-sans">
              {notification.type === "success" ? (
                <ShieldCheck className="w-5 h-5 text-black shrink-0 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-black shrink-0 stroke-[2.5]" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-black underline ml-2 opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header Hero Banner - Matching Shreyas Adiga Neo-Brutalist Visual */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal relative overflow-hidden bg-grid-pattern">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar Display with Yellow Ring & Online Badge */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-black shadow-[3px_3px_0px_#000] overflow-hidden bg-brutal-yellow flex items-center justify-center">
                {photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoURL}
                    alt={name || "Student Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : activePreset ? (
                  <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">
                    {activePreset.emoji}
                  </div>
                ) : (
                  // Illustrated student avatar
                  <svg viewBox="0 0 80 80" className="w-20 h-20 translate-y-1">
                    <ellipse cx="40" cy="45" rx="22" ry="24" fill="#FFD0A8" stroke="#000000" strokeWidth="2.5" />
                    <path
                      d="M 20 40 Q 22 20 40 18 Q 58 20 60 40 Q 55 25 40 25 Q 25 25 20 40 Z"
                      fill="#18181B"
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    <circle cx="33" cy="42" r="2.5" fill="#000000" />
                    <circle cx="47" cy="42" r="2.5" fill="#000000" />
                    <path d="M 36 52 Q 40 56 44 52" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 22 68 Q 40 60 58 68 L 62 80 L 18 80 Z" fill="#18181B" stroke="#000000" strokeWidth="2.5" />
                  </svg>
                )}
              </div>

              {/* Online Green Badge */}
              <div className="w-4 h-4 rounded-full bg-brutal-green border-2 border-black absolute top-1 right-1 shadow-[1px_1px_0px_#000]" />

              {/* Upload Overlay Button */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black border-2 border-black rounded-full shadow-[2px_2px_0px_#000] cursor-pointer transition transform active:scale-95"
                title="Upload real student photo"
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
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  {name || "Student Profile"}
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider bg-brutal-green text-black rounded-full border border-black shadow-[1px_1px_0px_#000]">
                  {profile?.role || "Student"} &bull; Active
                </span>
              </div>

              <p className="text-xs text-ink-700 font-mono font-bold">
                {profile?.email} &bull; MSRUAS Verified
              </p>

              {bio && (
                <p className="text-xs text-ink-800 font-semibold italic max-w-xl">
                  &ldquo;{bio}&rdquo;
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-semibold text-black">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-paper-100 border border-black/30 rounded-xl">
                  <GraduationCap className="w-3.5 h-3.5 text-black" />
                  <span>{course || "Engineering"}</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-paper-100 border border-black/30 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-black" />
                  <span>{campus || "Gnanagangothri Campus"}</span>
                </span>
                {phone && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brutal-purple-light border border-black rounded-xl font-mono font-bold text-brutal-purple-dark shadow-[1.5px_1.5px_0px_#000]">
                    <Phone className="w-3.5 h-3.5 text-brutal-purple-dark" />
                    <span>{phone}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Grid Bento */}
          <div className="mt-6 pt-6 border-t-2 border-black/10 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000] text-center">
              <span className="block font-sans text-2xl font-black text-black">{listingsCount}</span>
              <span className="text-[11px] font-mono font-bold text-ink-600 uppercase">Items Listed</span>
            </div>
            <div className="bg-brutal-green p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000] text-center">
              <span className="block font-sans text-2xl font-black text-black">{soldCount}</span>
              <span className="text-[11px] font-mono font-bold text-ink-900 uppercase">Items Sold</span>
            </div>
            <div className="bg-brutal-purple-light p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000] text-center">
              <span className="block font-sans text-2xl font-black text-black">{ordersCount}</span>
              <span className="text-[11px] font-mono font-bold text-brutal-purple-dark uppercase">Orders Made</span>
            </div>
            <div className="bg-brutal-yellow p-3.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000] text-center">
              <span className="block font-sans text-2xl font-black text-black">{wishlistCount}</span>
              <span className="text-[11px] font-mono font-bold text-ink-900 uppercase">Saved Items</span>
            </div>
          </div>
        </div>

        {/* Main Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Preset & Customization */}
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
              <div>
                <h2 className="font-sans text-base font-black text-black">
                  Campus Identity &amp; Avatar
                </h2>
                <p className="text-xs text-ink-600 font-medium">
                  Select a campus emoji preset or upload your photo for peer trust.
                </p>
              </div>
              {photoURL && (
                <button
                  type="button"
                  onClick={() => setPhotoURL("")}
                  className="text-xs font-mono font-bold text-admin-700 hover:text-admin-800 underline"
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
                    className={`p-3 rounded-2xl border-2 border-black flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? "bg-brutal-yellow shadow-[3px_3px_0px_#000] -translate-y-1"
                        : "bg-paper-50 hover:bg-paper-100 shadow-[1.5px_1.5px_0px_#000]"
                    }`}
                  >
                    <span className="text-2xl mb-1">{preset.emoji}</span>
                    <span className="text-[9px] font-mono font-bold text-black text-center truncate w-full">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span className="mt-1 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[9px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ────────────────── 1. ACADEMIC & STUDENT INFORMATION ────────────────── */}
          {/* Once updated, these options are permanently removed from the web form */}
          {isAcademicLocked ? (
            <div className="bg-paper-100/90 border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
              <div className="border-b-2 border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-brutal-green-dark stroke-[2.5]" />
                    <h2 className="font-sans text-base font-black text-black">
                      Academic &amp; Student Information
                    </h2>
                  </div>
                  <p className="text-xs text-ink-600 font-medium mt-0.5">
                    Verified university details displayed to peers and on official handover invoices.
                  </p>
                </div>

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-black text-white rounded-xl text-xs font-mono font-bold self-start sm:self-auto shadow-[1.5px_1.5px_0px_#000]">
                  <span>🔒</span>
                  <span>Permanently Locked</span>
                </div>
              </div>

              {/* Read-Only Credential Display Cards (Inputs Removed from Web Form) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="p-3.5 bg-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000]">
                  <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider block">
                    Full Name / Display Name
                  </span>
                  <span className="font-sans font-black text-sm text-black block mt-0.5">
                    {profile?.name || name || "Verified Student"}
                  </span>
                </div>

                {/* Faculty & Department */}
                <div className="p-3.5 bg-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000]">
                  <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider block">
                    Faculty &amp; Department
                  </span>
                  <span className="font-sans font-bold text-sm text-black block mt-0.5">
                    {profile?.course || course || "Engineering"}
                  </span>
                </div>

                {/* Academic Year */}
                <div className="p-3.5 bg-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000]">
                  <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider block">
                    Academic Year
                  </span>
                  <span className="font-mono font-bold text-sm text-black block mt-0.5">
                    {profile?.year || year || "Undergraduate"}
                  </span>
                </div>

                {/* Campus / Hostel Residence */}
                <div className="p-3.5 bg-white border-2 border-black rounded-2xl shadow-[2px_2px_0px_#000]">
                  <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider block">
                    Campus / Hostel Residence
                  </span>
                  <span className="font-sans font-bold text-sm text-black block mt-0.5">
                    {profile?.campus || campus || "Campus Residence"}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] font-mono font-bold text-ink-600 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-brutal-green shrink-0" />
                <span>
                  Institutional credentials are locked to protect campus peer transactions. Contact administration at{" "}
                  <a href="mailto:campus.marketplace.ruas@gmail.com" className="text-black underline">
                    campus.marketplace.ruas@gmail.com
                  </a>{" "}
                  for official name/transfer modifications.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
              <div className="border-b-2 border-black/10 pb-3">
                <h2 className="font-sans text-base font-black text-black">
                  Academic &amp; Student Information
                </h2>
                <p className="text-xs text-ink-600 font-medium">
                  Verified university details displayed to peers and on official handover invoices.
                </p>
              </div>

              {/* Warning about one-time lock */}
              <div className="p-3.5 bg-brutal-yellow/30 border-2 border-black rounded-2xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                <div className="text-xs font-mono font-bold text-black">
                  <span>⚠️ One-Time Verification Notice:</span>
                  <p className="font-normal text-ink-800 mt-0.5">
                    Your Full Name, Faculty &amp; Department, Academic Year, and Campus Residence can only be updated ONCE. After saving, these options are permanently removed from the web form and cannot be edited again.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                    Full Name / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-semibold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>

                {/* Department / Course */}
                <div>
                  <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                    Faculty &amp; Department *
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition cursor-pointer"
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
                  <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition cursor-pointer"
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
                  <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                    Campus / Hostel Residence *
                  </label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition cursor-pointer"
                  >
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────── 2. CONTACT & TRADING INFORMATION (EDITABLE) ────────────────── */}
          <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
            <div className="border-b-2 border-black/10 pb-3">
              <h2 className="font-sans text-base font-black text-black">
                Contact &amp; Peer Trading Details
              </h2>
              <p className="text-xs text-ink-600 font-medium">
                Keep your mobile phone and trading notes updated for instant buyer/seller connections.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Phone (for Call links) */}
              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Contact Mobile Number (for Call Links) *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
                  placeholder="+91 9876543210"
                />
                <span className="text-[10px] text-ink-600 font-mono mt-1 block">
                  Enables instant peer calls from the &quot;Call Seller&quot; button on your listings.
                </span>
              </div>

              {/* Personal Email */}
              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Personal Alternate Email (Optional)
                </label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-semibold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
                  placeholder="personal.email@gmail.com"
                />
              </div>

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Student Bio / Seller Introduction
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000] transition"
                  placeholder="e.g. 4th year CSE student. Selling previous semester engineering textbooks, lab coats, and electronics in mint condition."
                />
                <span className="text-[10px] text-ink-600 font-mono text-right block mt-1">
                  {bio.length}/160 characters
                </span>
              </div>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href="/dashboard"
              className="text-xs font-mono font-bold text-ink-700 hover:text-black underline underline-offset-4"
            >
              Cancel &amp; Return to Dashboard
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-sm rounded-2xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Synchronizing Across Campus...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {isAcademicLocked
                      ? "Save Contact & Bio Details"
                      : "Save & Permanently Lock Academic Profile"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
}
