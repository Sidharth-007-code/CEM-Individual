"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, BookOpen, PenTool, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PillBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ExploreCard() {
  const [activeCategory, setActiveCategory] = useState("Calculators");

  const categories = [
    { label: "All", href: "/browse" },
    { label: "Calculators", href: "/browse?category=Calculators+%26+Electronics" },
    { label: "Textbooks", href: "/browse?category=Textbooks+%26+Notes" },
    { label: "Lab Gear", href: "/browse?category=Lab+Equipment+%26+Uniforms" },
  ];

  return (
    <Card variant="elevated" padding="md" className="h-full min-h-[360px] flex flex-col">
      <CardHeader
        title="Campus Essentials"
        subtitle="Curated gear for your syllabus"
        action={
          <Badge variant="verifier" size="xs" dot>
            Verified
          </Badge>
        }
      />

      <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product categories">
          {categories.map((c) => (
            <PillBadge
              key={c.label}
              active={activeCategory === c.label}
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setActiveCategory(c.label);
              }}
              className="whitespace-nowrap"
            >
              {c.label}
            </PillBadge>
          ))}
        </div>

        {/* Featured Visual Card: Scientific Calculator / Campus Gear */}
        <div className="relative bg-modern-primary-light border border-modern-primary/30 rounded-2xl p-6 flex flex-col items-center justify-center group/product overflow-hidden">
          {/* Visual Badge */}
          <div className="absolute top-3 left-3 bg-modern-primary text-white px-2.5 py-1 rounded-lg text-xs font-mono font-semibold">
            RUAS Syllabus Approved
          </div>

          {/* Scientific Calculator SVG Graphic */}
          <div className="w-32 h-32 flex items-center justify-center transform group-hover/product:scale-105 transition-transform duration-300 my-4">
            <svg viewBox="0 0 100 120" className="w-24 h-28 drop-shadow-[0_4px_8px_rgba(23,37,84,0.2)]">
              {/* Calculator Body */}
              <rect x="15" y="10" width="70" height="100" rx="10" fill="#172554" stroke="#172554" strokeWidth="2" />
              {/* Solar cell strip */}
              <rect x="52" y="18" width="25" height="10" rx="2" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" />
              {/* LCD Screen */}
              <rect x="23" y="32" width="54" height="20" rx="3" fill="#A7F3D0" stroke="#172554" strokeWidth="2" />
              <text x="27" y="46" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#064E3B">fx-991CW OK</text>
              {/* Keypad Grid - Row 1 */}
              <rect x="23" y="58" width="10" height="7" rx="1.5" fill="#2563EB" stroke="#172554" strokeWidth="1" />
              <rect x="37" y="58" width="10" height="7" rx="1.5" fill="#E2E8F0" stroke="#172554" strokeWidth="1" />
              <rect x="51" y="58" width="10" height="7" rx="1.5" fill="#E2E8F0" stroke="#172554" strokeWidth="1" />
              <rect x="65" y="58" width="12" height="7" rx="1.5" fill="#EF4444" stroke="#172554" strokeWidth="1" />
              {/* Row 2 */}
              <rect x="23" y="68" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              <rect x="37" y="68" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              <rect x="51" y="68" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              <rect x="65" y="68" width="12" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              {/* Row 3 */}
              <rect x="23" y="78" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              <rect x="37" y="78" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              <rect x="51" y="78" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#172554" strokeWidth="1" />
              <rect x="65" y="78" width="12" height="7" rx="1.5" fill="#2563EB" stroke="#172554" strokeWidth="1" />
              {/* Row 4 */}
              <rect x="23" y="88" width="10" height="8" rx="1.5" fill="#E2E8F0" stroke="#172554" strokeWidth="1" />
              <rect x="37" y="88" width="10" height="8" rx="1.5" fill="#E2E8F0" stroke="#172554" strokeWidth="1" />
              <rect x="51" y="88" width="10" height="8" rx="1.5" fill="#E2E8F0" stroke="#172554" strokeWidth="1" />
              <rect x="65" y="88" width="12" height="8" rx="1.5" fill="#10B981" stroke="#172554" strokeWidth="1" />
            </svg>
          </div>

          <div className="w-full text-center">
            <h4 className="font-sans font-semibold text-base text-modern-text-primary">Casio fx-991CW ClassWiz</h4>
            <p className="text-sm font-medium text-modern-text-tertiary mt-0.5">₹850 &bull; Excellent Condition</p>
          </div>

          <Link
            href="/browse?category=Calculators+%26+Electronics"
            className="w-full mt-4"
          >
            <Button variant="primary" fullWidth leftIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Calculators
            </Button>
          </Link>
        </div>

        {/* Bottom Mini Nav */}
        <nav className="pt-4 border-t border-modern-border/50 flex justify-around text-center text-xs font-medium text-modern-text-tertiary" aria-label="Quick navigation">
          <Link href="/browse" className="hover:text-modern-primary transition-colors">Notice Board</Link>
          <Link href="/listings/new" className="text-modern-primary font-semibold underline underline-offset-2">+ Post Item</Link>
          <Link href="/orders" className="hover:text-modern-primary transition-colors">My Orders</Link>
          <Link href="/profile" className="hover:text-modern-primary transition-colors">Profile</Link>
        </nav>
      </CardContent>
    </Card>
  );
}