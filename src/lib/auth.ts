import { cookies } from "next/headers";

export const ADMIN_COOKIE = "growthpilot_admin";

export function isAdminTokenConfigured() {
  return Boolean(process.env.ADMIN_ACCESS_TOKEN);
}

export async function isAuthenticated() {
  const token = process.env.ADMIN_ACCESS_TOKEN;
  if (!token) return false;
  return (await cookies()).get(ADMIN_COOKIE)?.value === token;
}
