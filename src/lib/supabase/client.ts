import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env/client";

/**
 * Supabase client for code running in the browser.
 * Uses the publishable key only; what it can read is limited by Row Level Security.
 */
export function createClient() {
  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
