import React from "react";
import Link from "next/link";
import { Home, Search, BarChart3, Settings, Heart, Bell } from "lucide-react";

export function AppSwitcherWidget() {
  const tiles = [
    { label: "Home", href: "/", icon: Home, bg: "bg-brutal-yellow" },
    { label: "Search", href: "/browse", icon: Search, bg: "bg-white" },
    { label: "Orders", href: "/orders", icon: BarChart3, bg: "bg-white" },
    { label: "Settings", href: "/profile", icon: Settings, bg: "bg-white" },
    { label: "Wishlist", href: "/wishlist", icon: Heart, bg: "bg-brutal-pink" },
    { label: "Alerts", href: "/dashboard", icon: Bell, bg: "bg-brutal-green" },
  ];

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-4 shadow-brutal flex flex-col justify-between h-full min-h-[160px] group hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <span className="font-sans font-black text-xs uppercase tracking-wider text-black">
          Quick Launch
        </span>
        <span className="w-2 h-2 rounded-full bg-brutal-yellow border border-black animate-pulse" />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 my-2.5">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              href={t.href}
              className={`${t.bg} border-2 border-black rounded-xl p-2.5 flex items-center justify-center shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group/tile`}
              title={t.label}
            >
              <Icon className="w-5 h-5 text-black group-hover/tile:scale-110 transition-transform" />
            </Link>
          );
        })}
      </div>

      <div className="text-[10px] font-mono font-bold text-center text-ink-600 border-t border-black/10 pt-1">
        6 Portals &bull; Campus Fast Nav
      </div>
    </div>
  );
}

