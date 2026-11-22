"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User, Sparkles, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function UserProfileCard() {
  const { user, profile } = useAuth();

  // STRICT PRIVACY DIRECTIVE: Never display the verified student card to the public.
  // It is visible strictly to the authenticated student who is using the site, displaying their own name only.
  if (!user) {
    return null;
  }

  const displayName = profile?.name || user.displayName || user.email?.split("@")[0] || "Verified Student";
  const displayHandle = profile?.email
    ? `@${profile.email.split("@")[0]}`
    : `@${user.email?.split("@")[0] || "student"}`;

  return (
    <Card variant="elevated" padding="md" className="h-full min-h-[180px] flex flex-col items-center text-center">
      <CardHeader
        className="w-full flex justify-between items-center border-b border-modern-border/50 pb-3"
        title="Verified Student"
        action={
          <>
            <Badge variant="verifier" size="xs" dot className="mr-2">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
            </Badge>
            <span className="w-2.5 h-2.5 rounded-full bg-modern-success border-2 border-modern-surface animate-pulse" title="Active Session" aria-label="Active session" />
          </>
        }
      />

      <CardContent className="flex-1 flex flex-col items-center justify-between w-full pt-2">
        {/* Avatar Container with Online Badge */}
        <div className="relative my-3">
          <Avatar
            src={profile?.photoURL}
            alt={displayName}
            fallback={displayName}
            size="xl"
            shape="circle"
            status="online"
            statusPosition="bottom-right"
          />
        </div>

        {/* Name and Handle */}
        <div className="space-y-1 w-full">
          <h4 className="font-sans font-semibold text-lg text-modern-text-primary tracking-tight">
            {displayName}
          </h4>
          <p className="text-sm font-mono font-medium text-modern-primary">
            {displayHandle}
          </p>
        </div>

        {/* Course/Year info if available */}
        {(profile?.course || profile?.year) && (
          <div className="text-xs font-medium text-modern-text-tertiary flex items-center justify-center space-x-3 w-full">
            {profile?.course && (
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                <span>{profile.course}</span>
              </span>
            )}
            {profile?.year && (
              <span className="flex items-center space-x-1">
                <span>{profile.year}</span>
              </span>
            )}
          </div>
        )}

        {/* Edit Profile Button */}
        <div className="w-full pt-2">
          <Link href="/profile" className="w-full block">
            <Button variant="primary" fullWidth leftIcon={<User className="w-4 h-4" />}>
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}