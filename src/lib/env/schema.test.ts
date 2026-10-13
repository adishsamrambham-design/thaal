import { describe, expect, it } from "vitest";
import { parseEnv, publicEnvSchema, serverEnvSchema } from "./schema";

const valid = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abcdefghijklmnopqrstuvwxyz",
};

describe("environment validation", () => {
  it("accepts a complete, valid environment", () => {
    expect(parseEnv(publicEnvSchema, valid)).toEqual(valid);
  });

  it("names the missing variable when one is absent", () => {
    const missing: Record<string, string | undefined> = { ...valid, NEXT_PUBLIC_SUPABASE_URL: undefined };
    expect(() => parseEnv(publicEnvSchema, missing)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("refuses a secret key placed in a public variable", () => {
    expect(() =>
      parseEnv(publicEnvSchema, {
        ...valid,
        // Built at runtime so secret scanners don't flag this obviously fake value.
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_" + "x".repeat(24),
      }),
    ).toThrow(/SECRET key/);
  });

  it("refuses the untouched placeholder from .env.example", () => {
    expect(() =>
      parseEnv(publicEnvSchema, {
        ...valid,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_REPLACE_ME_WITH_LOCAL_KEY",
      }),
    ).toThrow(/placeholder/);
  });

  it("treats an empty optional server secret as not set", () => {
    expect(parseEnv(serverEnvSchema, { ...valid, SUPABASE_SECRET_KEY: "" }).SUPABASE_SECRET_KEY).toBeUndefined();
  });
});
