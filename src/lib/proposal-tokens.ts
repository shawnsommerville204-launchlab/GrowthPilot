import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
function secret() { return process.env.PROPOSAL_TOKEN_SECRET || process.env.ADMIN_ACCESS_TOKEN || ""; }
function encode(value: string) { return Buffer.from(value).toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url").toString("utf8"); }
function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function createProposalToken(leadId: string) {
  if (!secret()) throw new Error("Proposal token secret is not configured.");
  const payload = encode(JSON.stringify({ leadId, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS, nonce: randomBytes(16).toString("hex") }));
  return `${payload}.${sign(payload)}`;
}

export function verifyProposalToken(token: string): string | undefined {
  if (!secret()) return undefined;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return undefined;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined;
  try { const value = JSON.parse(decode(payload)) as { leadId?: unknown; exp?: unknown }; return typeof value.leadId === "string" && typeof value.exp === "number" && value.exp > Math.floor(Date.now() / 1000) ? value.leadId : undefined; } catch { return undefined; }
}