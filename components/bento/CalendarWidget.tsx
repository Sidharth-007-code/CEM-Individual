"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function CalendarWidget() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activeDate = 11;

  return (
    <Card variant="elevated" padding="md" className="h-full min-h-[160px] flex flex-col">
      <CardHeader
        title="November 2026"
        subtitle="Academic Calendar"
        className="border-b border-modern-border/50 pb-3"
        action={
          <div className="flex items-center space-x-1">
            <button
              type="button"
              className="p-1.5 hover:bg-modern-surface-hover rounded-lg border border-modern-border transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-modern-text-secondary" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:bg-modern-surface-hover rounded-lg border border-modern-border transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-modern-text-secondary" />
            </button>
          </div>
        }
      />

      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="grid grid-cols-7 gap-1 text-center my-2">
          {days.map((d) => (
            <span key={d} className="text-[10px] font-mono font-semibold text-modern-text-tertiary">
              {d}
            </span>
          ))}

          {/* Row 1 - previous month dates (faded) */}
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <span key={`prev-${num}`} className="text-xs font-mono font-medium text-modern-text-tertiary/40 py-1">
              {num}
            </span>
          ))}

          {/* Row 2 - current month dates with active highlight */}
          {[8, 9, 10, 11, 12, 13, 14].map((num) => {
            const isActive = num === activeDate;
            return (
              <div key={num} className="flex items-center justify-center py-1.5">
                {isActive ? (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-modern-primary text-white font-mono font-semibold text-sm flex items-center justify-center shadow-modern-sm hover:shadow-modern transition-shadow"
                    aria-label={`November ${num}, 2026 - Term Exam Week`}
                    aria-current="date"
                  >
                    {num}
                  </button>
                ) : (
                  <span className="text-xs font-mono font-semibold text-modern-text-primary w-8 h-8 flex items-center justify-center">
                    {num}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-xs font-mono text-modern-text-tertiary border-t border-modern-border/50 pt-3">
          <Badge variant="warm" size="xs">
            Term Exam Week
          </Badge>
          <Badge variant="primary" size="xs">
            RUAS Term 1
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}