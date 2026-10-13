"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNextPath } from "@/lib/auth";
import { publicEnv } from "@/lib/env/client";
import { createClient } from "@/lib/supabase/server";

export type SignInState =
  { step: "email"; error?: string; email?: string } | { step: "code"; email: string; error?: string };

const emailSchema = z.email().max(254);
const codeSchema = z.string().regex(/^\d{6}$/);

function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute, then try again.";
    case "otp_expired":
      return "That code has expired or is wrong. Request a new code.";
    default:
      return "Sign-in didn't work. Check the details and try again.";
  }
}

export async function sendCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = emailSchema.safeParse(
    String(form.get("email") ?? "")
      .trim()
      .toLowerCase(),
  );
  if (!email.success) return { step: "email", error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: true },
  });
  if (error) return { step: "email", email: email.data, error: friendlyAuthError(error.code) };

  return { step: "code", email: email.data };
}

export async function verifyCode(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = emailSchema.safeParse(String(form.get("email") ?? ""));
  const code = codeSchema.safeParse(String(form.get("code") ?? "").replace(/\s/g, ""));
  if (!email.success) return { step: "email", error: "Enter your email address again." };
  if (!code.success) return { step: "code", email: email.data, error: "Enter the 6-digit code from the email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token: code.data, type: "email" });
  if (error) return { step: "code", email: email.data, error: friendlyAuthError(error.code ?? "otp_expired") };

  redirect(safeNextPath(String(form.get("next") ?? "")));
}

export async function signInWithGoogle(form: FormData): Promise<void> {
  if (publicEnv.NEXT_PUBLIC_GOOGLE_SIGN_IN !== "on") redirect("/sign-in");
  const next = safeNextPath(String(form.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/sign-in?error=google");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
