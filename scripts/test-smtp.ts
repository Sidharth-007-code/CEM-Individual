/**
 * Diagnostic tool to verify Gmail SMTP configuration in .env.local
 * Run with: npm run test:smtp
 */

import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log("==========================================================");
console.log("   CAMPUS MARKETPLACE - SMTP DIAGNOSTIC VERIFIER          ");
console.log("==========================================================");
console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user ? user : "(NOT CONFIGURED in .env.local)"}`);
console.log(`Pass: ${pass ? "********" + pass.slice(-4) : "(NOT CONFIGURED in .env.local)"}`);
console.log("----------------------------------------------------------");

if (!user || !pass) {
  console.log("❌ ERROR: SMTP credentials missing in .env.local.");
  console.log("");
  console.log("To set up Gmail SMTP:");
  console.log("1. Open your Google Account (https://myaccount.google.com)");
  console.log("2. Navigate to 'Security' -> ensure '2-Step Verification' is ON");
  console.log("3. Search for 'App passwords' (https://myaccount.google.com/apppasswords)");
  console.log("4. Create an App password named 'CampusMarketplace'");
  console.log("5. Copy the 16-character code (remove spaces, e.g. abcd1234efgh5678)");
  console.log("6. In .env.local, set:");
  console.log('   SMTP_USER="your-email@gmail.com"');
  console.log('   SMTP_PASS="your16charapppassword"');
  console.log("");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: {
    user,
    pass,
  },
});

console.log("Connecting to SMTP server and verifying credentials...");

transporter.verify()
  .then(() => {
    console.log("✅ SUCCESS: SMTP authentication succeeded!");
    console.log(`Connected to ${host}:${port} as ${user}.`);
    console.log("Real student OTP emails will be delivered to @msruas.ac.in addresses.");
    console.log("==========================================================");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ SMTP CONNECTION / AUTHENTICATION FAILED:");
    console.error(err.message || err);
    console.log("");
    console.log("Common reasons:");
    console.log("1. Using your regular Gmail account password instead of a Google App Password.");
    console.log("2. 2-Step Verification is not enabled on the Gmail account.");
    console.log("3. Typos in SMTP_USER or SMTP_PASS.");
    console.log("==========================================================");
    process.exit(1);
  });
