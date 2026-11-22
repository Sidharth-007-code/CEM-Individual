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

  // Modern header: surface background with subtle border
  const headerBgClass = "bg-modern-surface/95 border-modern-border backdrop-blur-md";

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${headerBgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Logo & Masthead */}
          <div className="flex items-center space-x-3 shrink-0">
            <Logo size="md" href="/" />

            {/* Quick Switch for Verifier/Admin if user has privileges */}
            {(role === "verifier" || role === "admin") && (
              <div className="hidden 2xl:flex items-center pl-3 border-l border-modern-border-strong space-x-1.5 text-xs">
                <Link
                  href="/verifier"
                  className={`px-3 py-1.5 rounded-lg font-sans font-semibold text-xs transition-colors ${
                    isVerifierRoute
                      ? "bg-modern-verifier text-white"
                      : "bg-modern-verifier-light text-modern-verifier hover:bg-modern-verifier-light/80"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  Verifier Desk
                </Link>
                {role === "admin" && (
                  <Link
                    href="/admin"
                    className={`px-3 py-1.5 rounded-lg font-sans font-semibold text-xs transition-colors ${
                      isAdminRoute
                        ? "bg-modern-admin text-white"
                        : "bg-modern-admin-light text-modern-admin hover:bg-modern-admin-light/80"
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
          <nav className="hidden xl:flex items-center space-x-1 shrink-0">
            <Link
              href="/browse"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === "/browse"
                  ? "bg-modern-primary text-white shadow-modern-sm"
                  : "text-modern-text-secondary hover:text-modern-primary hover:bg-modern-primary-light"
              }`}
            >
              <Compass className="w-3.5 h-3.5 inline mr-1" />
              Notice Board
            </Link>

            {user && role === "admin" && (
              <>
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-modern-admin text-white shadow-modern-sm"
                      : "text-modern-text-secondary hover:text-modern-admin hover:bg-modern-admin-light"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                  Dean Executive Console
                </Link>

                <Link
                  href="/verifier"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith("/verifier")
                      ? "bg-modern-verifier text-white shadow-modern-sm"
                      : "text-modern-text-secondary hover:text-modern-verifier hover:bg-modern-verifier-light"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                  Verifier Desk
                </Link>
              </>
            )}

            {user && role === "verifier" && (
              <Link
                href="/verifier"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname.startsWith("/verifier")
                    ? "bg-modern-verifier text-white shadow-modern-sm"
                    : "text-modern-text-secondary hover:text-modern-verifier hover:bg-modern-verifier-light"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                Verifier Quality Desk
              </Link>
            )}

            {user && role === "student" && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname === "/dashboard"
                      ? "bg-modern-primary text-white shadow-modern-sm"
                      : "text-modern-text-secondary hover:text-modern-primary hover:bg-modern-primary-light"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 inline mr-1" />
                  Dashboard
                </Link>

                <Link
                  href="/orders"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith("/orders")
                      ? "bg-modern-primary text-white shadow-modern-sm"
                      : "text-modern-text-secondary hover:text-modern-primary hover:bg-modern-primary-light"
                  }`}
                >
                  <Package className="w-3.5 h-3.5 inline mr-1" />
                  Orders
                </Link>

                <Link
                  href="/messages"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname.startsWith("/messages")
                      ? "bg-modern-primary text-white shadow-modern-sm"
                      : "text-modern-text-secondary hover:text-modern-primary hover:bg-modern-primary-light"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                  Chat
                </Link>

                <Link
                  href="/wishlist"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pathname === "/wishlist"
                      ? "bg-modern-primary text-white shadow-modern-sm"
                      : "text-modern-text-secondary hover:text-modern-primary hover:bg-modern-primary-light"
                  }`}
                  title="Wishlist"
                >
                  <Heart className="w-3.5 h-3.5 inline mr-1" />
                  Wishlist
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 flex-nowrap">
            {user ? (
              <>
                {/* Role Specific Badges */}
                {role === "admin" && (
                  <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 bg-modern-admin text-white rounded-lg font-mono font-semibold text-xs">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Dean of Student Affairs</span>
                  </span>
                )}

                {role === "verifier" && (
                  <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 bg-modern-verifier text-white rounded-lg font-mono font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Quality Verifier Desk</span>
                  </span>
                )}

                {/* Buy / Sell Mode Toggle strictly for Students */}
                {role === "student" && (
                  <>
                    <div className="hidden sm:flex items-center bg-modern-surface p-0.5 rounded-lg border border-modern-border shadow-modern-sm shrink-0">
                      <button
                        type="button"
                        onClick={() => setStudentMode("buy")}
                        className={`px-2.5 sm:px-3 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
                          studentMode === "buy"
                            ? "bg-modern-primary text-white shadow-modern-sm"
                            : "text-modern-text-secondary hover:text-modern-primary"
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentMode("sell")}
                        className={`px-2.5 sm:px-3 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
                          studentMode === "sell"
                            ? "bg-modern-warm text-modern-warm-text shadow-modern-sm"
                            : "text-modern-text-secondary hover:text-modern-warm"
                        }`}
                      >
                        SELL
                      </button>
                    </div>

                    <Link
                      href="/listings/new"
                      className="hidden md:inline-flex items-center px-3.5 py-1.5 bg-modern-warm hover:bg-modern-warm-hover text-modern-warm-text text-xs font-semibold tracking-wide rounded-lg shadow-modern-sm hover:shadow-modern-md transition-all shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                      POST ITEM
                    </Link>
                  </>
                )}

                {/* Notifications Bell */}
                <div className="shrink-0">
                  <NotificationBell />
                </div>

                {/* Single Clean User Profile & Sign Out */}
                <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-modern-border shrink-0">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 rounded-lg bg-modern-surface hover:bg-modern-surface-hover border border-modern-border text-xs text-modern-text-primary font-semibold transition group shrink-0"
                    title="My Profile & Settings"
                  >
                    <div className="w-6 h-6 rounded-full bg-modern-primary-light border border-modern-border flex items-center justify-center font-bold text-modern-primary overflow-hidden group-hover:scale-105 transition shrink-0">
                      {profile?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                      ) : activePreset ? (
                        <span className="text-xs leading-none">{activePreset.emoji}</span>
                      ) : (
                        <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3 text-modern-primary" />}</span>
                      )}
                    </div>
                    <span className="max-w-[70px] sm:max-w-[110px] truncate">
                      {profile?.name ? profile.name.split(" ")[0] : "Profile"}
                    </span>
                  </Link>

                  <button
                    onClick={() => signOut()}
                    className="p-1.5 text-modern-text-tertiary hover:text-modern-error rounded-lg hover:bg-modern-error-light transition shrink-0"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 shrink-0">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-mono font-semibold text-modern-text-primary border border-modern-border rounded-lg bg-modern-surface hover:bg-modern-surface-hover transition"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-xs font-semibold bg-modern-primary text-white hover:bg-modern-primary-hover border border-modern-primary rounded-lg transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-modern-text-primary border border-modern-border rounded-lg bg-modern-surface transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-modern-border bg-modern-surface px-4 pt-3 pb-5 space-y-3">
          {user && role === "student" && (
            <div className="flex items-center justify-between pb-3 border-b border-modern-border">
              <span className="text-xs font-mono font-semibold text-modern-text-tertiary">Active Campus Mode:</span>
              <div className="flex items-center bg-modern-surface-hover p-0.5 rounded-lg border border-modern-border">
                <button
                  type="button"
                  onClick={() => setStudentMode("buy")}
                  className={`px-3 py-0.5 text-xs font-mono font-semibold rounded-md ${
                    studentMode === "buy" ? "bg-modern-primary text-white" : "text-modern-text-tertiary"
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode("sell")}
                  className={`px-3 py-0.5 text-xs font-mono font-semibold rounded-md ${
                    studentMode === "sell" ? "bg-modern-warm text-modern-warm-text" : "text-modern-text-tertiary"
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-1.5 text-sm font-medium">
            <Link
              href="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-primary-light hover:text-modern-primary"
            >
              Browse Notice Board
            </Link>

            {user && role === "admin" && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-modern-admin font-semibold"
                >
                  Dean Executive Console
                </Link>
                <Link
                  href="/verifier"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-modern-verifier font-semibold"
                >
                  Verifier Quality Queue
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover flex items-center justify-between"
                >
                  <span>Dean Profile & Settings</span>
                  <span className="text-[10px] font-mono text-modern-text-tertiary font-semibold uppercase">Account</span>
                </Link>
              </>
            )}

            {user && role === "verifier" && (
              <>
                <Link
                  href="/verifier"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-white bg-modern-verifier font-semibold"
                >
                  Verifier Quality Desk
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover flex items-center justify-between"
                >
                  <span>Verifier Profile</span>
                  <span className="text-[10px] font-mono text-modern-text-tertiary font-semibold uppercase">Account</span>
                </Link>
              </>
            )}

            {user && role === "student" && (
              <>
                <Link
                  href="/listings/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-warm-text bg-modern-warm font-semibold"
                >
                  + Post New Listing
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover"
                >
                  Student Dashboard
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover"
                >
                  My Orders & Purchases
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover"
                >
                  Messages & Chats
                </Link>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover"
                >
                  Saved Wishlist
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-modern-text-primary hover:bg-modern-surface-hover flex items-center justify-between"
                >
                  <span>My Profile & Avatar</span>
                  <span className="text-[10px] font-mono text-modern-text-tertiary font-semibold uppercase">Settings</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}