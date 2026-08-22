import { AuditInput, AuditResult } from "./analyzer";

type Lead = AuditInput & { id: string; result: AuditResult; createdAt: string };
const leads = new Map<string, Lead>();

export function saveLead(input: AuditInput, result: AuditResult) {
  const id = crypto.randomUUID();
  leads.set(id, { ...input, id, result, createdAt: new Date().toISOString() });
  return id;
}

export function getLead(id: string) { return leads.get(id); }
