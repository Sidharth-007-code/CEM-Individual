"use client";

import React from "react";
import Link from "next/link";
import { Home, Search, BarChart3, Settings, Heart, Bell } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function AppSwitcherWidget() {
  const tiles = [
    { label: "Home", href: "/", icon: Home, variant: "primary" as const },
    { label: "Search", href: "/browse", icon: Search, variant: "ghost" as const },
    { label: "Orders", href: "/orders", icon: BarChart3, variant: "ghost" as const },
    { label: "Settings", href: "/profile", icon: Settings, variant: "ghost" as const },
    { label: "Wishlist", href: "/wishlist", icon: Heart, variant: "warm" as const },
    { label: "Alerts", href: "/dashboard", icon: Bell, variant: "success" as const },
  ];

  return (
    <Card variant="elevated" padding="md" className="h-full min-h-[160px] flex flex-col">
      <CardHeader
        title="Quick Launch"
        subtitle="Campus marketplace portals"
        className="border-b border-modern-border/50 pb-3"
        action={
          <span className="w-2 h-2 rounded-full bg-modern-primary animate-pulse" aria-hidden="true" />
        }
      />

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.label}
                href={t.href}
                className="group/tile"
              >
                <Button
                  variant={t.variant}
                  size="sm"
                  fullWidth
                  className="h-14 flex flex-col items-center justify-center gap-1.5 p-2 group-hover/tile:-translate-y-0.5 transition-transform"
                >
                  <Icon className="w-5 h-5 group-hover/tile:scale-110 transition-transform" aria-hidden="true" />
                  <span className="text-xs font-semibold">{t.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="text-[10px] font-mono font-semibold text-center text-modern-text-tertiary border-t border-modern-border/50 pt-3">
          6 Portals &bull; Campus Fast Nav
        </div>
      </CardContent>
    </Card>
  );
}