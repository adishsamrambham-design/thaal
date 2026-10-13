import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

/** The signed-in user, verified on the server, or null. Must be called inside a <Suspense> boundary. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: data.claims.sub, email };
}

/** Like getCurrentUser, but sends signed-out visitors to the sign-in page. */
export async function requireUser(next = "/write"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}

/** Only allow redirects back into our own site after sign-in. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/write";
  return next;
}
