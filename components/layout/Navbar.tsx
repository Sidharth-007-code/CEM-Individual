"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { PRESET_AVATARS } from "@/lib/constants";
import {
  Heart,
  MessageSquare,
  PlusCircle,
  Package,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Compass,
} from "lucide-react";

export function Navbar() {
  const { user, profile, role, studentMode, setStudentMode, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVerifierRoute = pathname.startsWith("/verifier");
  const isAdminRoute = pathname.startsWith("/admin");
  const activePreset = PRESET_AVATARS.find((a) => a.id === profile?.avatarId);

  // Dynamic theme accent based on active workspace portal
  let headerBgClass = "bg-paper-50 border-ink-100";
  let badgeText = "MSRUAS VERIFIED";
  let badgeClass = "bg-saffron-100 text-saffron-700 border-saffron-300";

  if (isAdminRoute) {
    headerBgClass = "bg-admin-50 border-admin-600/30";
    badgeText = "ADMIN CONSOLE";
    badgeClass = "bg-admin-100 text-admin-900 border-admin-600";
  } else if (isVerifierRoute) {
    headerBgClass = "bg-verifier-50 border-verifier-600/30";
    badgeText = "VERIFIER DESK";
    badgeClass = "bg-verifier-100 text-verifier-900 border-verifier-600";
  }

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${headerBgClass} backdrop-blur-md bg-opacity-95`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Masthead */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-baseline space-x-2 group">
              <span className="font-serif text-2xl font-black tracking-tight text-ink-950 group-hover:text-saffron-600 transition-colors">
                CAMPUS<span className="text-saffron-500 font-sans font-light">MARKET</span>
              </span>
              <span className={`hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest border rounded ${badgeClass}`}>
                {badgeText}
              </span>
            </Link>

            {/* Quick Switch for Verifier/Admin if user has privileges */}
            {(role === "verifier" || role === "admin") && (
              <div className="hidden md:flex items-center pl-4 border-l border-ink-200 space-x-2 text-xs">
                <Link
                  href="/verifier"
                  className={`px-2.5 py-1 rounded-notice font-medium transition ${
                    isVerifierRoute
                      ? "bg-verifier-600 text-white"
                      : "text-verifier-700 hover:bg-verifier-100"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  Verifier Queue
                </Link>
                {role === "admin" && (
                  <Link
                    href="/admin"
                    className={`px-2.5 py-1 rounded-notice font-medium transition ${
                      isAdminRoute
                        ? "bg-admin-600 text-white"
                        : "text-admin-700 hover:bg-admin-100"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                    Admin Panel
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Desktop Central Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/browse"
              className={`px-3 py-1.5 rounded-notice text-sm font-medium transition ${
                pathname === "/browse" ? "text-saffron-600 bg-paper-200" : "text-ink-700 hover:text-ink-950 hover:bg-paper-100"
              }`}
            >
              <Compass className="w-4 h-4 inline mr-1.5 text-ink-500" />
              Notice Board
            </Link>

            {user && (
              <>
                <Link
                  href="/orders"
                  className={`px-3 py-1.5 rounded-notice text-sm font-medium transition ${
                    pathname.startsWith("/orders") ? "text-saffron-600 bg-paper-200" : "text-ink-700 hover:text-ink-950 hover:bg-paper-100"
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1.5 text-ink-500" />
                  Orders
                </Link>

                <Link
                  href="/messages"
                  className={`px-3 py-1.5 rounded-notice text-sm font-medium transition ${
                    pathname.startsWith("/messages") ? "text-saffron-600 bg-paper-200" : "text-ink-700 hover:text-ink-950 hover:bg-paper-100"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-1.5 text-ink-500" />
                  Chat
                </Link>

                <Link
                  href="/wishlist"
                  className={`px-3 py-1.5 rounded-notice text-sm font-medium transition ${
                    pathname === "/wishlist" ? "text-saffron-600 bg-paper-200" : "text-ink-700 hover:text-ink-950 hover:bg-paper-100"
                  }`}
                  title="Wishlist"
                >
                  <Heart className="w-4 h-4 inline mr-1.5 text-ink-500" />
                  Wishlist
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Buy / Sell Mode Toggle for Student */}
                <div className="hidden sm:flex items-center bg-paper-200 p-0.5 rounded-full border border-ink-300">
                  <button
                    type="button"
                    onClick={() => setStudentMode("buy")}
                    className={`px-3 py-1 text-xs font-serif font-bold rounded-full transition-all ${
                      studentMode === "buy"
                        ? "bg-ink-900 text-paper-50 shadow-sm"
                        : "text-ink-600 hover:text-ink-950"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentMode("sell")}
                    className={`px-3 py-1 text-xs font-serif font-bold rounded-full transition-all ${
                      studentMode === "sell"
                        ? "bg-saffron-500 text-white shadow-sm"
                        : "text-ink-600 hover:text-ink-950"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Sell CTA button when in sell mode or always accessible */}
                <Link
                  href="/listings/new"
                  className="hidden md:inline-flex items-center px-3.5 py-1.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-serif font-bold tracking-wide rounded-notice shadow-sm transition transform active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  POST ITEM
                </Link>

                {/* Notifications Bell */}
                <NotificationBell />

                {/* User Profile & Menu */}
                <div className="flex items-center space-x-2 pl-2 border-l border-ink-200">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-1.5 text-xs text-ink-800 hover:text-saffron-600 font-medium group"
                    title={profile?.name || user.email || "Profile"}
                  >
                    <div className="w-7 h-7 rounded-full bg-paper-300 border border-ink-300 flex items-center justify-center font-serif font-bold text-ink-900 overflow-hidden shadow-inner group-hover:border-saffron-400 transition">
                      {profile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : activePreset ? (
                        <span className="text-sm leading-none">{activePreset.emoji}</span>
                      ) : (
                        <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}</span>
                      )}
                    </div>
                    <span className="hidden xl:inline max-w-[100px] truncate">
                      {profile?.name?.split(" ")[0] || "Profile"}
                    </span>
                  </Link>

                  <Link
                    href="/profile"
                    className="hidden sm:inline-block px-2 py-1 text-[11px] font-serif font-bold bg-paper-100 hover:bg-paper-200 text-ink-800 border border-ink-300 rounded transition"
                    title="Manage Profile & Identity"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="p-1.5 text-ink-500 hover:text-admin-600 rounded hover:bg-paper-200 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-ink-800 hover:text-ink-950 hover:bg-paper-200 rounded-notice transition"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-serif font-bold bg-ink-900 text-paper-50 hover:bg-ink-800 rounded-notice transition shadow-sm"
                >
                  Student Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-ink-700 hover:text-ink-950 rounded"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-ink-100 bg-paper-100 px-4 pt-3 pb-5 space-y-3">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-ink-200">
              <span className="text-xs text-ink-600">Active Campus Mode:</span>
              <div className="flex items-center bg-paper-200 p-0.5 rounded-full border border-ink-300">
                <button
                  type="button"
                  onClick={() => setStudentMode("buy")}
                  className={`px-3 py-0.5 text-xs font-serif font-bold rounded-full ${
                    studentMode === "buy" ? "bg-ink-900 text-white" : "text-ink-600"
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode("sell")}
                  className={`px-3 py-0.5 text-xs font-serif font-bold rounded-full ${
                    studentMode === "sell" ? "bg-saffron-500 text-white" : "text-ink-600"
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2 text-sm">
            <Link
              href="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded text-ink-800 hover:bg-paper-200 font-medium"
            >
              Browse Notice Board
            </Link>
            {user && (
              <>
                <Link
                  href="/listings/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded text-saffron-700 bg-saffron-50 font-bold"
                >
                  + Post New Listing
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded text-ink-800 hover:bg-paper-200 font-medium"
                >
                  My Orders & Purchases
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded text-ink-800 hover:bg-paper-200 font-medium"
                >
                  Messages & Chats
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded text-ink-800 hover:bg-paper-200 font-medium"
                >
                  Saved Wishlist
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded text-ink-800 hover:bg-paper-200 font-medium"
                >
                  Student Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded text-ink-800 hover:bg-paper-200 font-medium flex items-center justify-between"
                >
                  <span>My Profile & Avatar</span>
                  <span className="text-[10px] font-mono text-saffron-600 font-bold uppercase">Settings</span>
                </Link>
                {(role === "verifier" || role === "admin") && (
                  <Link
                    href="/verifier"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded text-verifier-700 bg-verifier-50 font-medium"
                  >
                    Verifier Quality Queue
                  </Link>
                )}
                {role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded text-admin-700 bg-admin-50 font-medium"
                  >
                    Admin Moderation & Audit
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

