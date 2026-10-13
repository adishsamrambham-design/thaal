import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/discover"
            className="rounded-sm px-2 py-1.5 text-[0.95rem] font-medium text-muted-foreground hover:text-foreground"
          >
            Discover
          </Link>
          <Button asChild size="lg" className="px-3 text-[0.95rem]">
            <Link href="/write">Start writing</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
