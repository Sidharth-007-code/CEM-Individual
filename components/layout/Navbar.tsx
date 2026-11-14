"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "@/components/ui/Logo";
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
  LayoutDashboard,
} from "lucide-react";

export function Navbar() {
  const { user, profile, role, studentMode, setStudentMode, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVerifierRoute = pathname.startsWith("/verifier");
  const isAdminRoute = pathname.startsWith("/admin");
  const activePreset = PRESET_AVATARS.find((a) => a.id === profile?.avatarId);

  // Dynamic theme accent based on active workspace portal
  let headerBgClass = "bg-[#FDFBF7]/95 border-black";

  if (isAdminRoute) {
    headerBgClass = "bg-admin-50/95 border-black";
  } else if (isVerifierRoute) {
    headerBgClass = "bg-verifier-50/95 border-black";
  }

  return (
    <header className={`sticky top-0 z-40 border-b-2 transition-colors duration-200 ${headerBgClass} backdrop-blur-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Masthead */}
          <div className="flex items-center space-x-3">
            <Logo size="md" href="/" />

            {/* Quick Switch for Verifier/Admin if user has privileges */}
            {(role === "verifier" || role === "admin") && (
              <div className="hidden md:flex items-center pl-3 border-l-2 border-black/20 space-x-2 text-xs">
                <Link
                  href="/verifier"
                  className={`px-3 py-1 rounded-xl border-2 border-black font-sans font-black text-xs transition-all ${
                    isVerifierRoute
                      ? "bg-verifier-600 text-white shadow-[2px_2px_0px_#000]"
                      : "bg-white text-verifier-800 hover:bg-verifier-100 shadow-[1.5px_1.5px_0px_#000]"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  Verifier Desk
                </Link>
                {role === "admin" && (
                  <Link
                    href="/admin"
                    className={`px-3 py-1 rounded-xl border-2 border-black font-sans font-black text-xs transition-all ${
                      isAdminRoute
                        ? "bg-black text-white shadow-[2px_2px_0px_#000]"
                        : "bg-white text-admin-900 hover:bg-admin-100 shadow-[1.5px_1.5px_0px_#000]"
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
          <nav className="hidden lg:flex items-center space-x-1.5">
            <Link
              href="/browse"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border-2 border-black transition-all ${
                pathname === "/browse"
                  ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                  : "bg-transparent border-transparent hover:border-black hover:bg-paper-100 text-ink-800"
              }`}
            >
              <Compass className="w-3.5 h-3.5 inline mr-1 text-black" />
              Notice Board
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border-2 border-black transition-all ${
                    pathname === "/dashboard"
                      ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                      : "bg-transparent border-transparent hover:border-black hover:bg-paper-100 text-ink-800"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 inline mr-1 text-black" />
                  Dashboard
                </Link>

                <Link
                  href="/orders"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border-2 border-black transition-all ${
                    pathname.startsWith("/orders")
                      ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                      : "bg-transparent border-transparent hover:border-black hover:bg-paper-100 text-ink-800"
                  }`}
                >
                  <Package className="w-3.5 h-3.5 inline mr-1 text-black" />
                  Orders
                </Link>

                <Link
                  href="/messages"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border-2 border-black transition-all ${
                    pathname.startsWith("/messages")
                      ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                      : "bg-transparent border-transparent hover:border-black hover:bg-paper-100 text-ink-800"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-black" />
                  Chat
                </Link>

                <Link
                  href="/wishlist"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border-2 border-black transition-all ${
                    pathname === "/wishlist"
                      ? "bg-brutal-yellow text-black shadow-[2px_2px_0px_#000]"
                      : "bg-transparent border-transparent hover:border-black hover:bg-paper-100 text-ink-800"
                  }`}
                  title="Wishlist"
                >
                  <Heart className="w-3.5 h-3.5 inline mr-1 text-black" />
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
                <div className="hidden sm:flex items-center bg-white p-0.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
                  <button
                    type="button"
                    onClick={() => setStudentMode("buy")}
                    className={`px-3 py-1 text-xs font-mono font-black rounded-lg transition-all ${
                      studentMode === "buy"
                        ? "bg-black text-white shadow-sm"
                        : "text-ink-600 hover:text-black"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentMode("sell")}
                    className={`px-3 py-1 text-xs font-mono font-black rounded-lg transition-all ${
                      studentMode === "sell"
                        ? "bg-brutal-yellow text-black shadow-sm"
                        : "text-ink-600 hover:text-black"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Sell CTA button with Neo-Brutalist Yellow Button */}
                <Link
                  href="/listings/new"
                  className="hidden md:inline-flex items-center px-4 py-2 bg-brutal-yellow hover:bg-brutal-yellow-light text-black text-xs font-sans font-black tracking-wide rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  POST ITEM
                </Link>

                {/* Notifications Bell */}
                <NotificationBell />

                {/* Single Clean User Profile & Sign Out */}
                <div className="flex items-center space-x-2 pl-2 border-l-2 border-black/20">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-white hover:bg-brutal-yellow/30 border-2 border-black shadow-[2px_2px_0px_#000] text-xs text-black font-sans font-black transition group"
                    title="My Profile & Settings"
                  >
                    <div className="w-6 h-6 rounded-full bg-brutal-yellow border border-black flex items-center justify-center font-bold text-black overflow-hidden shadow-inner group-hover:scale-105 transition shrink-0">
                      {profile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : activePreset ? (
                        <span className="text-xs leading-none">{activePreset.emoji}</span>
                      ) : (
                        <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}</span>
                      )}
                    </div>
                    <span className="max-w-[110px] truncate">
                      {profile?.name ? profile.name.split(" ")[0] : "Profile"}
                    </span>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="p-1.5 text-ink-700 hover:text-admin-600 rounded-xl hover:bg-paper-200 transition"
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
                  className="px-3.5 py-1.5 text-xs font-mono font-bold text-black border-2 border-black rounded-xl bg-white hover:bg-paper-100 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-xs font-sans font-black bg-brutal-yellow text-black hover:bg-brutal-yellow-light border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-black border-2 border-black rounded-xl bg-white shadow-[2px_2px_0px_#000]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-black bg-white px-4 pt-3 pb-5 space-y-3">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b-2 border-black/10">
              <span className="text-xs font-mono font-bold text-ink-600">Active Campus Mode:</span>
              <div className="flex items-center bg-paper-100 p-0.5 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
                <button
                  type="button"
                  onClick={() => setStudentMode("buy")}
                  className={`px-3 py-0.5 text-xs font-mono font-black rounded-lg ${
                    studentMode === "buy" ? "bg-black text-white" : "text-ink-600"
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode("sell")}
                  className={`px-3 py-0.5 text-xs font-mono font-black rounded-lg ${
                    studentMode === "sell" ? "bg-brutal-yellow text-black" : "text-ink-600"
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2 text-sm font-sans font-bold">
            <Link
              href="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-black hover:bg-paper-100 border border-transparent hover:border-black"
            >
              Browse Notice Board
            </Link>
            {user && (
              <>
                <Link
                  href="/listings/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-black bg-brutal-yellow border-2 border-black font-black shadow-[2px_2px_0px_#000]"
                >
                  + Post New Listing
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-black hover:bg-paper-100"
                >
                  Student Dashboard
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-black hover:bg-paper-100"
                >
                  My Orders &amp; Purchases
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-black hover:bg-paper-100"
                >
                  Messages &amp; Chats
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-black hover:bg-paper-100"
                >
                  Saved Wishlist
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-xl text-black hover:bg-paper-100 flex items-center justify-between"
                >
                  <span>My Profile &amp; Avatar</span>
                  <span className="text-[10px] font-mono text-brutal-purple-dark font-black uppercase">Settings</span>
                </Link>
                {(role === "verifier" || role === "admin") && (
                  <Link
                    href="/verifier"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-verifier-900 bg-verifier-100 border-2 border-black font-black"
                  >
                    Verifier Quality Queue
                  </Link>
                )}
                {role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-admin-900 bg-admin-100 border-2 border-black font-black"
                  >
                    Admin Moderation &amp; Presentation Data
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
