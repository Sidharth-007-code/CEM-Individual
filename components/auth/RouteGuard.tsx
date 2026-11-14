"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function RouteGuard({
  children,
  allowedRoles,
  requireAuth = true,
}: RouteGuardProps) {
  const { user, profile, loading, role, isSuspended } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, loading, requireAuth, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-ink-300 border-t-saffron-500 rounded-full animate-spin" />
        <p className="font-serif italic text-ink-600 text-sm">Verifying campus credentials...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Redirecting
  }

  // Account Suspension Enforcement
  if (isSuspended) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-admin-50 border border-admin-600 rounded-notice text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-admin-100 flex items-center justify-center text-admin-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-admin-900">Access Restricted</h2>
        <p className="text-sm text-ink-700 leading-relaxed">
          Your account (<strong>{profile?.email}</strong>) has been suspended due to moderation policy violations.
          You cannot access marketplace listings or transactions.
        </p>
        <p className="text-xs text-ink-600">
          Contact: Student Affairs / Dean&apos;s Office (CSC203B Administration).
        </p>
      </div>
    );
  }

  // Role Restriction Check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-paper-100 border border-ink-300 rounded-notice text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-paper-200 flex items-center justify-center text-ink-800">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink-950">Access Denied</h2>
        <p className="text-sm text-ink-700 leading-relaxed">
          This portal section requires <strong>{allowedRoles.join(" or ")}</strong> privileges.
          Your current account role is <strong>{role}</strong>.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-ink-900 text-paper-50 rounded-notice text-sm font-medium hover:bg-ink-800 transition"
        >
          Return to Marketplace Notice Board
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

