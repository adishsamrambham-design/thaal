import { z } from "zod";

/**
 * Every environment variable the app reads is declared here.
 * If something is missing or malformed, the app refuses to start
 * and prints exactly which variable is wrong.
 *
 * NEXT_PUBLIC_* values are visible to anyone using the site.
 * Everything else must stay on the server.
 */

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url("NEXT_PUBLIC_SITE_URL must be a full URL, e.g. http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url("NEXT_PUBLIC_SUPABASE_URL must be the Supabase project URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks too short")
    .refine((v) => !v.startsWith("sb_secret_"), {
      message:
        "A SECRET key was put in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. That would expose it to the public. Use the publishable key.",
    })
    .refine((v) => !v.includes("REPLACE_ME"), {
      message: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY still has the placeholder from .env.example",
    }),
  /** Show "Continue with Google" only once Google sign-in is configured in Supabase. */
  NEXT_PUBLIC_GOOGLE_SIGN_IN: z.preprocess(
    (v) => (v === undefined || v === "" ? "off" : v),
    z.enum(["on", "off"], "NEXT_PUBLIC_GOOGLE_SIGN_IN must be on or off"),
  ),
});

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const serverEnvSchema = publicEnvSchema.extend({
  /** Bypasses Row Level Security. Server-only, admin tasks only. Optional until Phase 2. */
  SUPABASE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function formatEnvError(error: z.ZodError): string {
  const lines = error.issues.map((i) => `  • ${i.path.join(".") || "(env)"}: ${i.message}`);
  return [
    "",
    "❌ Invalid or missing environment variables:",
    ...lines,
    "",
    "Copy .env.example to .env.local and fill in the values. See README.md → 'Local setup'.",
    "",
  ].join("\n");
}

export function parseEnv<T extends z.ZodType>(schema: T, source: Record<string, string | undefined>): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }
  return result.data;
}
