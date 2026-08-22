import { AuditResult } from "@/lib/analyzer";

export type StoredAudit = {
  result: AuditResult;
  input: { businessName: string; website?: string; industry?: string; city?: string; email?: string };
  audit?: { id?: string; createdAt?: string };
  id?: string;
};

const SESSION_KEY = "growthpilot-audit";
const MAP_KEY = "growthpilot-audit-map";

export function writeStoredAudit(data: StoredAudit) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  const map = readStoredAuditMap();
  const id = data.audit?.id ?? data.id ?? "local-authority";
  map[id] = data;
  sessionStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export function readStoredAudit(): StoredAudit | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(stored) as StoredAudit) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function readStoredAuditById(auditId: string): StoredAudit | null {
  if (typeof window === "undefined") return null;
  const map = readStoredAuditMap();
  return map[auditId] ?? null;
}

export function readStoredAuditMap(): Record<string, StoredAudit> {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(MAP_KEY);
    return stored ? (JSON.parse(stored) as Record<string, StoredAudit>) : {};
  } catch {
    sessionStorage.removeItem(MAP_KEY);
    return {};
  }
}
