"use client";

import React from "react";
import { MapPin, Sun, Cloud, Droplets, Wind } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function WeatherWidget() {
  return (
    <Card variant="elevated" padding="md" className="h-full min-h-[160px] relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-modern-primary/5 via-modern-primary/3 to-modern-surface" />

      <CardHeader
        title="Bengaluru Weather"
        subtitle="MSRUAS Campus Conditions (demo data)"
        className="relative z-10 border-b border-modern-border/20 pb-3"
        action={
          <Badge variant="secondary" size="xs">
            Demo
          </Badge>
        }
      />

      <CardContent className="relative z-10 flex flex-col justify-between h-full pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-16 h-16">
              <Sun className="w-10 h-10 text-modern-warm absolute -top-1 -right-1 animate-spin-slow" aria-hidden="true" />
              <Cloud className="w-12 h-12 text-modern-text-primary/30 absolute bottom-0 left-0" aria-hidden="true" />
            </div>
            <div>
              <div className="font-sans font-bold text-4xl sm:text-5xl text-modern-text-primary drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
                24°C
              </div>
              <p className="text-sm font-medium text-modern-text-secondary mt-0.5">Partly Cloudy &bull; MSRUAS Campus</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-modern-text-secondary border-t border-modern-border/50 pt-3">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-modern-text-tertiary" aria-hidden="true" />
            <span>Bengaluru</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <Droplets className="w-3.5 h-3.5 text-modern-text-tertiary" aria-hidden="true" />
              <span className="text-modern-text-secondary">65%</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Wind className="w-3.5 h-3.5 text-modern-text-tertiary" aria-hidden="true" />
              <span className="text-modern-text-secondary">12 km/h</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-modern-text-tertiary border-t border-modern-border/50 pt-2">
          <span>High: 28°</span>
          <span>Low: 20°</span>
        </div>
      </CardContent>
    </Card>
  );
}