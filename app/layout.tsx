import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/ui/CookieConsent";

const serifFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: false,
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Campus Marketplace | Verified MSRUAS Student Buy & Sell",
  description: "Official student buy-and-sell portal for M.S. Ramaiah University of Applied Sciences. Course CSC203B Software Development Fundamentals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable}`}>
      <body className="bg-paper-50 text-ink-950 min-h-screen flex flex-col font-sans selection:bg-saffron-200 selection:text-ink-950">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <BottomNav />
          <Footer />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}

