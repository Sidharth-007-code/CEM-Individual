"use client";

import React from "react";
import { ShieldAlert, ArrowRight, Home, Lock } from "lucide-react";
import { Badge, Card, LinkButton } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <Card variant="elevated" padding="lg" className="max-w-md w-full flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Yellow Warning Pill */}
        <Badge variant="warning" size="md" className="mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>ACCESS RESTRICTED</span>
        </Badge>

        {/* 403 Big Heading */}
        <h1 className="font-sans font-semibold text-6xl sm:text-7xl text-modern-primary tracking-tight">
          403
        </h1>

        <h2 className="font-sans font-semibold text-2xl text-modern-text-primary mt-2">
          Permission Denied
        </h2>

        <p className="text-xs sm:text-sm font-semibold text-modern-text-tertiary mt-2 max-w-xs leading-relaxed">
          You don&apos;t have authorization to access this campus zone. Only verified @msruas.ac.in accounts with appropriate privileges can enter.
        </p>

        {/* Padlock / Shield SVG Illustration */}
        <div className="my-6 w-24 h-24 rounded-3xl bg-modern-primary-light border border-modern-border flex items-center justify-center">
          <Lock className="w-12 h-12 text-modern-primary" aria-hidden="true" />
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
          <LinkButton href="/login" variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4" />} className="flex-1">
            <span>Log In with MSRUAS</span>
          </LinkButton>

          <LinkButton href="/" variant="secondary" size="md" leftIcon={<Home className="w-4 h-4" />}>
              <span>Home</span>
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}

