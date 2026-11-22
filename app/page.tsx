import React from "react";
import Link from "next/link";
import { BentoGrid } from "@/components/bento/BentoGrid";
import { BrowseNoticeBoard } from "@/components/listings/BrowseNoticeBoard";
import { ShieldCheck, MapPin, Zap, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <div className="space-y-10 pb-12">
      {/* 1. Hero Bento Grid - Campus Marketplace Identity */}
      <section aria-labelledby="hero-heading">
        <BentoGrid />
      </section>

      {/* 2. Campus Safeguards - Trust Signals */}
      <section aria-labelledby="safeguards-heading" className="space-y-4">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Badge variant="warm" size="sm" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
              Campus Safeguards
            </Badge>
            <h2 id="safeguards-heading" className="font-sans font-bold text-2xl sm:text-3xl text-modern-text-primary tracking-tight">
              Built for Student Safety & Trust
            </h2>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Safeguard 1: Verified Students */}
          <Card variant="outlined" padding="md" className="h-full">
            <CardContent className="flex items-start space-x-3">
              <div className="w-11 h-11 rounded-xl bg-modern-verifier-light border border-modern-verifier/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-modern-verifier" aria-hidden="true" />
              </div>
              <div>
                <strong className="block font-sans font-semibold text-base text-modern-text-primary">
                  100% Student Verified
                </strong>
                <span className="text-sm font-medium text-modern-text-tertiary">
                  Requires institutional @msruas.ac.in credentials
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Safeguard 2: AI Validation */}
          <Card variant="outlined" padding="md" className="h-full">
            <CardContent className="flex items-start space-x-3">
              <div className="w-11 h-11 rounded-xl bg-modern-primary-light border border-modern-primary/30 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-modern-primary" aria-hidden="true" />
              </div>
              <div>
                <strong className="block font-sans font-semibold text-base text-modern-text-primary">
                  AI Product Validation
                </strong>
                <span className="text-sm font-medium text-modern-text-tertiary">
                  Automated fair price benchmarks & syllabus safety checks
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Safeguard 3: CCTV Meetup Zones */}
          <Card variant="outlined" padding="md" className="h-full">
            <CardContent className="flex items-start space-x-3">
              <div className="w-11 h-11 rounded-xl bg-modern-warm-light border border-modern-warm/30 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-modern-warm-text" aria-hidden="true" />
              </div>
              <div>
                <strong className="block font-sans font-semibold text-base text-modern-text-primary">
                  Official CCTV Meetup Zones
                </strong>
                <span className="text-sm font-medium text-modern-text-tertiary">
                  Safe verified handovers at Library, Canteen & Main Gate
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Live Campus Notice Board */}
      <section aria-labelledby="noticeboard-heading" className="space-y-6 pt-2">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-modern-border/50 pb-4">
          <div>
            <Badge variant="primary" size="sm" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
              Verified Campus Listings
            </Badge>
            <h2 id="noticeboard-heading" className="font-sans font-bold text-2xl sm:text-3xl text-modern-text-primary tracking-tight">
              Notice Board
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-modern-text-tertiary bg-modern-surface-hover border border-modern-border px-3 py-1 rounded-xl">
            Updated in real-time &bull; MSRUAS Campus Network
          </span>
        </header>

        <BrowseNoticeBoard />
      </section>
    </div>
  );
}