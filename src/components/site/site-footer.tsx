import Link from "next/link";
import { Wordmark } from "./wordmark";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-sm text-sm text-white/70">
            Thaal is in development. Nothing here is for sale yet, and no payments are taken.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-6 text-sm text-white/80">
          <Link href="/discover" className="hover:text-white">
            Discover
          </Link>
          <Link href="/write" className="hover:text-white">
            Write
          </Link>
        </nav>
      </div>
    </footer>
  );
}
