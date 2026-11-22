import React from "react";
import { ShieldCheck, Lock, KeyRound, ShieldAlert, ArrowLeft, Mail } from "lucide-react";
import { Card, LinkButton } from "@/components/ui";

export default function SecurityPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 my-6">
      
      {/* Top Breadcrumb */}
      <LinkButton href="/" variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
        <span>Return to Campus Notice Board</span>
      </LinkButton>

      <div className="border-b-2 border-modern-border/70 pb-4 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-success-light text-modern-text-primary rounded-xl text-xs font-mono font-semibold border border-modern-border shadow-modern-sm">
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>RUAS Campus Security Architecture</span>
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-semibold text-modern-text-primary tracking-tight">
          Trust, Safety &amp; Security Architecture
        </h1>
        <p className="text-xs font-mono font-bold text-modern-text-tertiary">
          How Campus Marketplace protects student accounts, prevents fraud, and guarantees single-sale transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <Card variant="default" padding="md" className="space-y-2.5">
          <div className="flex items-center space-x-2 text-modern-text-primary font-sans font-semibold text-sm">
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            <span>Cryptographic OTP Verification</span>
          </div>
          <p className="text-xs font-mono text-modern-text-secondary leading-relaxed">
            OTPs are generated with <code>crypto.randomInt</code>, hashed with HMAC-SHA256, and stored in an internal collection (<code>otpRequests</code>) where client read and write access is <strong>strictly denied</strong>. Code verification uses <code>crypto.timingSafeEqual</code> to prevent timing attacks.
          </p>
        </Card>

        <Card variant="default" padding="md" className="space-y-2.5">
          <div className="flex items-center space-x-2 text-modern-text-primary font-sans font-semibold text-sm">
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Single-Sale Atomic Guarantee</span>
          </div>
          <p className="text-xs font-mono text-modern-text-secondary leading-relaxed">
            Race conditions are prevented via atomic Firestore transactions that re-read listings at checkout. In addition, <code>firestore.rules</code> enforces <code>getAfter()</code> validation, rejecting any order that does not simultaneously transition the listing to <code>sold</code>.
          </p>
        </Card>

        <Card variant="default" padding="md" className="space-y-2.5">
          <div className="flex items-center space-x-2 text-modern-text-primary font-sans font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <p className="text-xs font-mono text-modern-text-secondary leading-relaxed">
            Roles (<code>student</code>, <code>verifier</code>, <code>admin</code>) are enforced at the database rules layer. Students cannot escalate their own privileges or modify other students&apos; wishlists, and suspended accounts are locked out of all marketplace transactions.
          </p>
        </Card>

        <Card variant="default" padding="md" className="space-y-2.5">
          <div className="flex items-center space-x-2 text-modern-text-primary font-sans font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
            <span>Campus Terminal Session Protection</span>
          </div>
          <p className="text-xs font-mono text-modern-text-secondary leading-relaxed">
            For security on shared university library and computer lab terminals, sessions automatically terminate after 10 minutes of user inactivity, clearing cached credentials and redirecting to login.
          </p>
        </Card>
      </div>

      <Card variant="default" padding="lg" className="space-y-4 text-sm sm:text-base text-modern-text-primary leading-relaxed">
        <h2 className="font-sans text-lg font-semibold text-modern-text-primary">
          Automated Advisory Linter &amp; Mandatory Human Verification
        </h2>
        <p>
          Before any study material appears on the public student notice board, it passes through two quality gates:
        </p>
        <ol className="list-decimal list-inside space-y-2 font-mono text-xs text-modern-text-secondary">
          <li>
            <strong>Automated AI &amp; Rule-Based Linter:</strong> Evaluates category-specific price ceilings (e.g. ₹5,000 max for textbooks), scans prohibited academic keywords, and requires item photographs.
          </li>
          <li>
            <strong>Mandatory Human Verifier Approval:</strong> Quality representatives on the student council inspect the submission at <code>/verifier</code> to verify genuine syllabus editions and prevent misleading items.
          </li>
        </ol>
      </Card>

      {/* Official Security & Grievance Contact */}
      <Card variant="default" padding="md" className="!bg-modern-warm-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-sans font-semibold text-sm text-modern-text-primary flex items-center space-x-2">
            <Mail className="w-4 h-4 text-modern-text-primary stroke-[2.5]" />
            <span>Security &amp; Support Contact</span>
          </h3>
          <p className="text-xs font-mono font-medium text-modern-text-secondary">
            For security incident reports, account inquiries, or verification questions, reach the official team:
          </p>
        </div>
        <a
          href="mailto:campus.marketplace.ruas@gmail.com"
          className="px-4 py-2 bg-modern-primary text-white hover:bg-modern-primary-hover rounded-xl font-mono font-bold text-xs shadow-[2px_2px_0px_#FFD027] transition shrink-0"
        >
          campus.marketplace.ruas@gmail.com
        </a>
      </Card>
    </div>
  );
}

