import type { AuditInput } from "./types.ts";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const limits = { businessName: 120, website: 2048, industry: 100, city: 100, email: 254 } as const;

export function validateAuditInput(body: unknown): { input?: AuditInput; error?: string } {
  if (!body || typeof body !== "object") return { error: "Please provide your audit details." };
  const value = body as Record<string, unknown>;
  const input = {
    businessName: text(value.businessName),
    website: text(value.website),
    industry: text(value.industry),
    city: text(value.city),
    email: text(value.email),
  };
  if (!input.businessName) return { error: "Enter your business name." };
  if (!input.website) return { error: "Enter a valid website URL, including https://" };
  if (!isValidWebsite(input.website)) return { error: "Enter a valid website URL, including https://" };
  if (!input.industry) return { error: "Enter your industry." };
  if (!input.city) return { error: "Enter your city." };
  if (input.email && !emailPattern.test(input.email)) return { error: "Enter a valid email address or leave it blank." };
  for (const [key, limit] of Object.entries(limits)) {
    if (input[key as keyof AuditInput].length > limit) return { error: "One of the fields is too long." };
  }
  return { input };
}

export function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
