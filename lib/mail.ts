import nodemailer from "nodemailer";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";

export interface SendOtpEmailParams {
  toEmail: string;
  otpCode: string;
}

/**
 * Transporter singleton for Gmail SMTP
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Dispatches a verification OTP email.
 * Includes a mandatory SECOND SAFEGUARD: strictly refuses any recipient address
 * that does not end in the configured university domain.
 */
export async function sendOtpEmail({ toEmail, otpCode }: SendOtpEmailParams): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = toEmail.trim().toLowerCase();
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || ALLOWED_EMAIL_DOMAIN;

  // HARD SECOND SAFEGUARD: Reject non-institutional domains even if called incorrectly
  const isAllowed = normalizedEmail.endsWith(`@${allowedDomain}`) || normalizedEmail.endsWith(`.${allowedDomain}`);
  if (!isAllowed) {
    console.error(`[Security Guard Alert] Blocked attempt to send OTP to unauthorized domain: ${normalizedEmail}`);
    return {
      success: false,
      error: `Disallowed recipient domain. Recipient must belong to @${allowedDomain}`,
    };
  }

  const transporter = createTransporter();
  const fromName = process.env.MAIL_FROM_NAME || "MSRUAS Campus Marketplace";
  const fromUser = process.env.SMTP_USER || "noreply@msruas.ac.in";

  // Development echo mode for offline/emulator development
  const isDevEchoEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.OTP_DEV_ECHO === "true";

  if (isDevEchoEnabled) {
    console.log("==================================================================");
    console.log(`[DEV OTP ECHO] Intended Recipient: ${normalizedEmail}`);
    console.log(`[DEV OTP ECHO] Verification Code:  ${otpCode}`);
    console.log(`[DEV OTP ECHO] Valid For:          10 Minutes`);
    console.log("==================================================================");
  }

  if (!transporter) {
    // If SMTP credentials aren't supplied in .env.local yet:
    if (isDevEchoEnabled) {
      return { success: true };
    }
    return {
      success: false,
      error: "SMTP transporter is not configured. Please supply SMTP_USER and SMTP_PASS in .env.local.",
    };
  }

  const plainText = [
    `Hello,`,
    ``,
    `Your verification code for Campus Marketplace is: ${otpCode}`,
    ``,
    `This code is valid for 10 minutes.`,
    `Please do not share this code with anyone.`,
    ``,
    `If you did not request this code, please ignore this email.`,
    ``,
    `Regards,`,
    `${fromName}`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: normalizedEmail,
      subject: "Campus Marketplace - Verification Code",
      text: plainText,
    });

    return { success: true };
  } catch (error: any) {
    console.error("[SMTP Error] Failed to dispatch verification email:", error.message || error);
    // In dev mode with dev echo, allow flow to succeed so local development is unobstructed
    if (isDevEchoEnabled) {
      return { success: true };
    }
    return {
      success: false,
      error: "Failed to send email. Please verify SMTP settings.",
    };
  }
}

