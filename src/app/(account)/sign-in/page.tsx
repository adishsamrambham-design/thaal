import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/auth";
import { publicEnv } from "@/lib/env/client";
import { signInWithGoogle } from "./actions";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:py-20">
      <h1 className="display text-[clamp(3rem,12vw,4.75rem)]">Sign in</h1>
      <p className="mt-4 text-lg text-muted-foreground">Your drafts stay private until you publish them.</p>
      <div className="mt-10">
        <Suspense fallback={<div className="h-48" />}>
          <SignInOptions searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function SignInOptions({ searchParams }: { searchParams: PageProps<"/sign-in">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const linkFailed = params.error === "link";
  const googleFailed = params.error === "google";

  return (
    <div className="space-y-8">
      {(linkFailed || googleFailed) && (
        <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
          {linkFailed
            ? "That sign-in link has expired or was already used. Request a new code."
            : "Google sign-in didn't complete. Try again or use your email."}
        </p>
      )}
      {publicEnv.NEXT_PUBLIC_GOOGLE_SIGN_IN === "on" && (
        <>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="outline" size="lg" className="h-12 w-full text-base">
              Continue with Google
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">or</p>
        </>
      )}
      <SignInForm next={next} />
    </div>
  );
}
