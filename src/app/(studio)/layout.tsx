import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";

/** "Quiet" pages: the writing studio. No marketing chrome, no lime. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Wordmark className="[&>span:first-child]:text-xl" />
          <Link href="/discover" className="text-sm text-muted-foreground hover:text-foreground">
            Leave studio
          </Link>
        </div>
      </header>
      <main id="main" className="flex-1 bg-background">
        {children}
      </main>
    </>
  );
}
