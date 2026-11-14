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
        <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin" />
        <p className="font-mono font-bold text-ink-600 text-sm">Verifying campus credentials...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Redirecting
  }

  // Account Suspension Enforcement
  if (isSuspended) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-admin-50 border-2 border-black rounded-3xl text-center space-y-4 shadow-brutal">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-admin-100 border-2 border-black flex items-center justify-center text-admin-600 shadow-[2px_2px_0px_#000]">
          <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h2 className="font-sans text-2xl font-black text-black">Access Restricted</h2>
        <p className="text-sm font-mono text-ink-700 leading-relaxed">
          Your account (<strong>{profile?.email}</strong>) has been suspended due to moderation policy violations.
          You cannot access marketplace listings or transactions.
        </p>
        <p className="text-xs font-mono text-ink-600">
          Contact: Student Affairs / Dean&apos;s Office (Campus Administration).
        </p>
      </div>
    );
  }

  // Role Restriction Check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border-2 border-black rounded-3xl text-center space-y-4 shadow-brutal">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brutal-yellow border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000]">
          <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h2 className="font-sans text-2xl font-black text-black">Access Denied</h2>
        <p className="text-sm font-mono text-ink-700 leading-relaxed">
          This portal section requires <strong>{allowedRoles.join(" or ")}</strong> privileges.
          Your current account role is <strong>{role}</strong>.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-brutal-yellow text-black rounded-xl border-2 border-black text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light"
        >
          Return to Marketplace Notice Board
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

