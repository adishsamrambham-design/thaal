import Link from "next/link";
import { Suspense } from "react";
import { Wordmark } from "@/components/site/wordmark";
import { SignOutButton } from "@/components/studio/sign-out-button";
import { getCurrentUser } from "@/lib/auth";

/** "Quiet" pages: the writing studio. No marketing chrome, no lime. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Wordmark className="[&>span:first-child]:text-xl" />
            <Link href="/write" className="text-sm font-medium hover:underline hover:underline-offset-4">
              Your writing
            </Link>
          </div>
          <Suspense fallback={null}>
            <Account />
          </Suspense>
        </div>
      </header>
      <main id="main" className="flex-1 bg-background">
        {children}
      </main>
    </>
  );
}

async function Account() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex min-w-0 items-center gap-4">
      <span className="hidden truncate text-sm text-muted-foreground sm:inline" title={user.email ?? undefined}>
        {user.email}
      </span>
      <SignOutButton />
    </div>
  );
}
