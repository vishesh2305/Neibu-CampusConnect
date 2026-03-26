// Security utilities for the application

import { headers } from "next/headers";

// Security headers to add to all responses
export function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(self)",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

// CSRF token validation for sensitive operations
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Check for common attack patterns in input
export function detectSQLInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  ];
  return patterns.some((p) => p.test(input));
}

export function detectNoSQLInjection(input: string): boolean {
  const patterns = [
    /\$(?:gt|gte|lt|lte|ne|nin|in|exists|regex|where|elemMatch)/i,
    /\{[^}]*\$[^}]*\}/,
  ];
  return patterns.some((p) => p.test(input));
}

// Validate that request comes from expected origin
export async function validateOrigin(allowedOrigins: string[]): Promise<boolean> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");

  if (!origin && !referer) return true; // Same-origin requests may not have these

  if (origin && allowedOrigins.some((o) => origin.startsWith(o))) return true;
  if (referer && allowedOrigins.some((o) => referer.startsWith(o))) return true;

  return false;
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push("Use at least 8 characters");

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Add uppercase letters");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Add lowercase letters");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Add numbers");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Add special characters");

  // Check for common patterns
  const commonPatterns = ["password", "123456", "qwerty", "abc123"];
  if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push("Avoid common patterns");
  }

  return { score: Math.min(score, 5), feedback };
}
