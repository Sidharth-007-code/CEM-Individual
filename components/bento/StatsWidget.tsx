"use client";

import React from "react";
import { Calendar, Users, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function StatsWidget() {
  return (
    <Card variant="elevated" padding="md" className="h-full min-h-[180px] flex flex-col">
      <CardHeader
        title="Marketplace Pulse"
        subtitle="Campus trading activity (demo data)"
        action={
          <Badge variant="secondary" size="xs">
            Demo
          </Badge>
        }
      />
      <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Exchanges */}
          <StatCard
            label="Exchanges"
            value={248}
            icon={<Calendar className="w-5 h-5" aria-hidden="true" />}
            trend={{ value: "+12%", label: "this week", positive: true }}
            variant="primary"
          />

          {/* Active Students */}
          <StatCard
            label="Students"
            value="1.2K"
            icon={<Users className="w-5 h-5" aria-hidden="true" />}
            trend={{ value: "+8%", label: "active", positive: true }}
            variant="success"
          />
        </div>

        {/* Mini Activity Chart */}
        <div className="relative pt-2 border-t border-modern-border/50">
          <svg
            viewBox="0 0 200 45"
            className="w-full h-10 overflow-visible"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 0,35 Q 30,10 60,25 T 120,15 T 160,28 T 200,8 L 200,45 L 0,45 Z"
              fill="url(#primaryGrad)"
            />
            <path
              d="M 0,35 Q 30,10 60,25 T 120,15 T 160,28 T 200,8"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex items-center justify-between text-xs font-mono text-modern-text-tertiary mt-2">
            <span>Last 7 days (demo)</span>
            <span className="flex items-center space-x-1 text-modern-primary">
              <Activity className="w-3 h-3" aria-hidden="true" />
              <span>Trending up</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}