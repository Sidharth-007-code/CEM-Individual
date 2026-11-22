import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Card, LinkButton } from "@/components/ui";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 my-6">
      
      {/* Top Breadcrumb */}
      <LinkButton href="/" variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
        <span>Return to Campus Notice Board</span>
      </LinkButton>

      <div className="border-b-2 border-modern-border/70 pb-4 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-success-light text-modern-text-primary rounded-xl text-xs font-mono font-semibold border border-modern-border shadow-modern-sm">
          <Shield className="w-4 h-4 stroke-[2.5]" />
          <span>MSRUAS Academic Data Protection</span>
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-semibold text-modern-text-primary tracking-tight">
          Campus Marketplace Privacy Policy
        </h1>
        <p className="text-xs font-mono font-bold text-modern-text-tertiary">
          Last revised: Academic Term &bull; Applies to all @msruas.ac.in registered students.
        </p>
      </div>

      <Card variant="default" padding="lg" className="space-y-7 text-sm sm:text-base text-modern-text-primary leading-relaxed font-sans">
        
        <section className="space-y-2">
          <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
            1. Institutional Scope &amp; Purpose
          </h2>
          <p>
            Campus Marketplace is the student exchange platform at <strong>M.S. Ramaiah University of Applied Sciences (MSRUAS)</strong>. The platform is designed solely to facilitate safe, peer-to-peer textbook, calculator, and study material exchanges among enrolled students without commercial intermediary fees or third-party advertising.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
            2. Information We Collect
          </h2>
          <ul className="list-disc list-inside space-y-1.5 font-mono text-xs text-modern-text-secondary">
            <li>
              <strong>Verified Institutional Email:</strong> Registration is restricted strictly to email addresses terminating in <code>@msruas.ac.in</code> (and departmental subdomains).
            </li>
            <li>
              <strong>Academic Profile Details:</strong> Full name, enrolled course (e.g. B.Tech CSE), academic year, and optional personal contact phone number used exclusively for the direct <code>tel:</code> call button during meetups.
            </li>
            <li>
              <strong>Item Listings &amp; Photographs:</strong> Item descriptions, condition ratings, asking prices, and photographs. Photos are compressed client-side to under 800px width (&lt;150KB) to run efficiently on Firebase free-tier storage.
            </li>
            <li>
              <strong>Order Records &amp; Invoices:</strong> Timestamps, designated meetup spot selection, agreed payment terms, and printable student invoices.
            </li>
            <li>
              <strong>Real-Time Chat Transcripts:</strong> Peer-to-peer conversations tied to active listings. Access is cryptographically and logically restricted to the buyer and seller via Firestore Security Rules.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
            3. Cookies &amp; Local Storage Usage
          </h2>
          <p>
            Campus Marketplace adheres to minimal data retention principles. We utilize:
          </p>
          <ul className="list-disc list-inside space-y-1.5 font-mono text-xs text-modern-text-secondary">
            <li>
              <strong>Essential Authentication Tokens:</strong> Firebase Auth session tokens to keep verified students securely authenticated.
            </li>
            <li>
              <strong>User Preferences (localStorage):</strong> Storage of the student&apos;s active UI mode toggle (<code>BUY</code> vs. <code>SELL</code> mode) and your cookie consent acknowledgement (<code>campus_cookie_consent</code>).
            </li>
            <li>
              <strong>Zero Commercial Trackers:</strong> No advertising networks, marketing pixels, or third-party analytics trackers are embedded on this service.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
            4. Inactivity Timeout &amp; Account Protection
          </h2>
          <p>
            To prevent unauthorized access when students leave university laboratory or library workstations unattended, the application implements an <strong>automatic 10-minute inactivity logout</strong>. If no mouse, touch, or keyboard activity is registered within 10 minutes, the session is cleared and redirected to the login screen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
            5. Safe Campus Meetup Zones &amp; CCTV Disclosure
          </h2>
          <p>
            For student physical safety, handovers are restricted to designated university locations (University Central Library Entrance, Main Campus Canteen, Campus Main Gate Security Booth, and Admin Block Steps). Students are advised to conduct all inspections during daylight hours in these monitored public areas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
            6. Moderation, Inquiries &amp; Official Contact
          </h2>
          <p>
            Students can report inappropriate listings using the &quot;Report Listing&quot; button. Listings receiving 3 reports are automatically hidden from public search pending administrative review. For privacy inquiries, account deletion, or marketplace assistance, contact the campus marketplace team at{" "}
            <a href="mailto:campus.marketplace.ruas@gmail.com" className="font-mono font-semibold text-modern-text-primary underline hover:text-modern-primary">
              campus.marketplace.ruas@gmail.com
            </a>{" "}
            or visit the Dean of Student Affairs office.
          </p>
        </section>
      </Card>
    </div>
  );
}

