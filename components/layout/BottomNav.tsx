"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Home, Search, PlusCircle, Package, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: "Board", href: "/", icon: Home },
    { label: "Browse", href: "/browse", icon: Search },
    { label: "Post", href: user ? "/listings/new" : "/login", icon: PlusCircle, isCta: true },
    { label: "Orders", href: user ? "/orders" : "/login", icon: Package },
    { label: "Profile", href: user ? "/profile" : "/login", icon: User },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t-2 border-black px-2 py-1.5 shadow-[0_-2px_0px_#000]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCta) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-brutal-yellow text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-mono font-black text-black mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "bg-brutal-yellow/60 border border-black text-black font-black shadow-[1px_1px_0px_#000]"
                  : "text-ink-700 hover:text-black font-semibold"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-mono mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

