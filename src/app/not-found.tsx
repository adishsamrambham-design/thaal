import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <h1 className="display text-[clamp(4rem,14vw,9rem)]">Blank page.</h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        Nothing is published at this address. The link may be old, or the book may have been unpublished.
      </p>
      <Button asChild size="lg" className="mt-8 h-12 w-fit px-5 text-base">
        <Link href="/">Go to the home page</Link>
      </Button>
    </main>
  );
}
