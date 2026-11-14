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
    { label: "Profile", href: user ? "/dashboard" : "/login", icon: User },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper-50/95 backdrop-blur-md border-t border-ink-200 px-2 py-1.5 shadow-float">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCta) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-4"
              >
                <div className="w-11 h-11 rounded-full bg-saffron-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-serif font-bold text-ink-900 mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition ${
                isActive ? "text-saffron-600 font-bold" : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-sans mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

