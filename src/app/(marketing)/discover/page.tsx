import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
      <h1 className="display text-[clamp(3.5rem,10vw,7.5rem)]">Discover</h1>
      <div className="mt-10 max-w-xl rounded-lg border border-dashed border-input p-8">
        <h2 className="text-xl font-bold">No books yet</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Published books will appear here, sorted by language and genre. Be the first to publish one.
        </p>
        <Button asChild className="mt-6 h-11 px-4 text-base">
          <Link href="/write">Start writing</Link>
        </Button>
      </div>
    </section>
  );
}
