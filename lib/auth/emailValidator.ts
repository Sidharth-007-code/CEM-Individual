import { ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";

export interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail: string;
  error?: string;
}

/**
 * Validates whether an email belongs strictly to the authorized university domain
 * or its official subdomains (e.g., student.msruas.ac.in), rejecting look-alikes
 * like msruas.ac.in.evil.com or evilmsruas.ac.in.
 */
export function validateUniversityEmail(
  rawEmail: string,
  targetDomain: string = ALLOWED_EMAIL_DOMAIN
): EmailValidationResult {
  if (!rawEmail || typeof rawEmail !== "string") {
    return {
      isValid: false,
      normalizedEmail: "",
      error: "Email address is required.",
    };
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();

  // Basic RFC 5322 sanity check before domain examination
  const generalEmailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  if (!generalEmailRegex.test(normalizedEmail)) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Please provide a valid email format.",
    };
  }

  const [localPart, domainPart] = normalizedEmail.split("@");

  if (!localPart || !domainPart) {
    return {
      isValid: false,
      normalizedEmail,
      error: "Malformed email address.",
    };
  }

  // Escape special regex characters in the target domain
  const escapedDomain = targetDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Regex strictly enforces:
  // Domain must either be EXACTLY targetDomain OR end with .targetDomain
  // (e.g. msruas.ac.in OR student.msruas.ac.in)
  // Lookalikes like evilmsruas.ac.in or msruas.ac.in.evil.com will fail.
  const strictDomainRegex = new RegExp(`^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)*${escapedDomain}$`, "i");

  if (!strictDomainRegex.test(domainPart)) {
    return {
      isValid: false,
      normalizedEmail,
      error: `Registration is restricted to official @${targetDomain} student addresses.`,
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
}

