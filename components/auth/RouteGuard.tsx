"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/user";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";

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
        <div className="w-10 h-10 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin" aria-hidden="true" />
        <p className="font-mono font-semibold text-modern-text-secondary text-sm" role="status">Verifying campus credentials...</p>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Redirecting
  }

  // Account Suspension Enforcement
  if (isSuspended) {
    return (
      <Card variant="elevated" className="max-w-md mx-auto my-12 p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-modern-error-light border border-modern-error/20 flex items-center justify-center text-modern-error">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <Badge variant="danger" size="sm">Account restricted</Badge>
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Access Restricted</h2>
        <p className="text-sm text-modern-text-secondary leading-relaxed">
          Your account (<strong>{profile?.email}</strong>) has been suspended due to moderation policy violations.
          You cannot access marketplace listings or transactions.
        </p>
        <p className="text-xs text-modern-text-tertiary">
          Contact: Student Affairs / Dean&apos;s Office at{" "}
          <a href="mailto:campus.marketplace.ruas@gmail.com" className="font-semibold text-modern-primary underline underline-offset-2 hover:text-modern-primary-hover">
            campus.marketplace.ruas@gmail.com
          </a>
        </p>
      </Card>
    );
  }

  // Role Restriction Check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <Card variant="elevated" className="max-w-md mx-auto my-12 p-8 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-modern-warning-light border border-modern-warning/20 flex items-center justify-center text-modern-warning">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <Badge variant="warning" size="sm">Role required</Badge>
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Access Denied</h2>
        <p className="text-sm text-modern-text-secondary leading-relaxed">
          This portal section requires <strong>{allowedRoles.join(" or ")}</strong> privileges.
          Your current account role is <strong>{role}</strong>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-modern-primary hover:bg-modern-primary-hover text-white rounded-xl border border-modern-primary text-sm font-semibold shadow-modern-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modern-accent focus-visible:ring-offset-2"
        >
          Return to Marketplace Notice Board
        </Link>
      </Card>
    );
  }

  return <>{children}</>;
}

