// Input validation and sanitization utilities

import { z } from "zod";

// Sanitize string input - remove potential XSS vectors
export function sanitize(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Sanitize for display (less aggressive, preserves some formatting)
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "");
}

// Common validation schemas
export const schemas = {
  email: z
    .string()
    .email("Invalid email address")
    .regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.edu(\.[A-Za-z]{2,})?$/,
      "Must be a .edu email address"
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),

  postContent: z
    .string()
    .min(1, "Post cannot be empty")
    .max(1000, "Post must be less than 1000 characters"),

  messageText: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must be less than 5000 characters"),

  groupName: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name must be less than 50 characters"),

  searchQuery: z
    .string()
    .max(100, "Search query too long")
    .transform((s) => s.trim()),

  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format"),

  url: z.string().url("Invalid URL").optional(),

  marketplacePrice: z
    .number()
    .min(0, "Price must be positive")
    .max(100000, "Price too high"),

  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
};

// Validate and return parsed data or error response
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((e) => e.message).join(", "),
    };
  }
  return { success: true, data: result.data };
}
