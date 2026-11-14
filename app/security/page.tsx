import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, KeyRound, AlertTriangle, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SecurityPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 my-6">
      
      {/* Top Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-paper-100 transition"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        <span>Return to Campus Notice Board</span>
      </Link>

      <div className="border-b-2 border-black/10 pb-4 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brutal-green text-black rounded-xl text-xs font-mono font-black border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>RUAS Campus Security Architecture</span>
        </div>
        <h1 className="font-sans text-3xl sm:text-4xl font-black text-black tracking-tight">
          Trust, Safety &amp; Security Architecture
        </h1>
        <p className="text-xs font-mono font-bold text-ink-600">
          How Campus Marketplace protects student accounts, prevents fraud, and guarantees single-sale transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-white border-2 border-black rounded-2xl p-5 space-y-2.5 shadow-brutal">
          <div className="flex items-center space-x-2 text-black font-sans font-black text-sm">
            <KeyRound className="w-4 h-4 stroke-[2.5]" />
            <span>Cryptographic OTP Verification</span>
          </div>
          <p className="text-xs font-mono text-ink-700 leading-relaxed">
            OTPs are generated with <code>crypto.randomInt</code>, hashed with HMAC-SHA256, and stored in an internal collection (<code>otpRequests</code>) where client read and write access is <strong>strictly denied</strong>. Code verification uses <code>crypto.timingSafeEqual</code> to prevent timing attacks.
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-5 space-y-2.5 shadow-brutal">
          <div className="flex items-center space-x-2 text-black font-sans font-black text-sm">
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Single-Sale Atomic Guarantee</span>
          </div>
          <p className="text-xs font-mono text-ink-700 leading-relaxed">
            Race conditions are prevented via atomic Firestore transactions that re-read listings at checkout. In addition, <code>firestore.rules</code> enforces <code>getAfter()</code> validation, rejecting any order that does not simultaneously transition the listing to <code>sold</code>.
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-5 space-y-2.5 shadow-brutal">
          <div className="flex items-center space-x-2 text-black font-sans font-black text-sm">
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>Role-Based Access Control (RBAC)</span>
          </div>
          <p className="text-xs font-mono text-ink-700 leading-relaxed">
            Roles (<code>student</code>, <code>verifier</code>, <code>admin</code>) are enforced at the database rules layer. Students cannot escalate their own privileges or modify other students&apos; wishlists, and suspended accounts are locked out of all marketplace transactions.
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-2xl p-5 space-y-2.5 shadow-brutal">
          <div className="flex items-center space-x-2 text-black font-sans font-black text-sm">
            <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
            <span>Campus Terminal Session Protection</span>
          </div>
          <p className="text-xs font-mono text-ink-700 leading-relaxed">
            For security on shared university library and computer lab terminals, sessions automatically terminate after 10 minutes of user inactivity, clearing cached credentials and redirecting to login.
          </p>
        </div>
      </div>

      <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal space-y-4 text-xs sm:text-sm text-ink-900 leading-relaxed">
        <h2 className="font-sans text-lg font-black text-black">
          Automated Advisory Linter &amp; Mandatory Human Verification
        </h2>
        <p>
          Before any study material appears on the public student notice board, it passes through two quality gates:
        </p>
        <ol className="list-decimal list-inside space-y-2 font-mono text-xs text-ink-700">
          <li>
            <strong>Automated AI &amp; Rule-Based Linter:</strong> Evaluates category-specific price ceilings (e.g. ₹5,000 max for textbooks), scans prohibited academic keywords, and requires item photographs.
          </li>
          <li>
            <strong>Mandatory Human Verifier Approval:</strong> Quality representatives on the student council inspect the submission at <code>/verifier</code> to verify genuine syllabus editions and prevent misleading items.
          </li>
        </ol>
      </div>
    </div>
  );
}

