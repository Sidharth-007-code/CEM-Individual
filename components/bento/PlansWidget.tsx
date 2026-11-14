import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

export function PlansWidget() {
  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "/mo",
      popular: false,
      features: ["Student Account", "Browse Notice Board", "Peer Meetups"],
      cta: "Get Started",
      ctaBg: "bg-white",
      href: "/register",
    },
    {
      name: "Pro Student",
      price: "₹299",
      period: "/term",
      popular: true,
      features: ["Unlimited Listings", "AI Listing Assistant", "Featured Placement", "Priority Handover"],
      cta: "Go Pro",
      ctaBg: "bg-black text-white",
      href: "/browse",
    },
    {
      name: "Club / Lab",
      price: "₹999",
      period: "/yr",
      popular: false,
      features: ["Bulk Gear Exchanges", "Department Verification", "Custom Spots"],
      cta: "Contact Us",
      ctaBg: "bg-white",
      href: "/messages",
    },
  ];

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-4">
      <div className="text-center space-y-1">
        <span className="px-2.5 py-0.5 bg-brutal-yellow text-black border border-black rounded-full text-[10px] font-mono font-bold uppercase">
          Zero Commercial Fees
        </span>
        <h3 className="font-sans font-black text-2xl text-black tracking-tight">
          Choose Your Plan
        </h3>
        <p className="text-xs font-semibold text-ink-600">
          Peer-to-peer student exchanges remain 100% free for everyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border-2 border-black p-4 flex flex-col justify-between relative transition-transform hover:-translate-y-1 ${
              p.popular
                ? "bg-brutal-yellow shadow-[4px_4px_0px_#000]"
                : "bg-paper-50 shadow-[2px_2px_0px_#000]"
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black text-white rounded-full text-[9px] font-mono font-bold tracking-wider uppercase shadow-[1px_1px_0px_#000]">
                Most Popular
              </span>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="font-sans font-black text-sm text-black">{p.name}</span>
                <div className="flex items-baseline">
                  <span className="text-xl font-black text-black font-sans">{p.price}</span>
                  <span className="text-[10px] font-mono text-ink-600 ml-0.5">{p.period}</span>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-ink-800 pt-2 border-t border-black/15">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center space-x-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[3] text-black shrink-0" />
                    <span className="font-medium text-[11px]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <Link
                href={p.href}
                className={`w-full py-2 px-3 rounded-xl border-2 border-black font-sans font-black text-xs text-center block shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all ${
                  p.popular ? "bg-black text-white hover:bg-ink-900" : "bg-white text-black hover:bg-paper-100"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

