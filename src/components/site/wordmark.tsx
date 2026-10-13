import Link from "next/link";
import { cn } from "@/lib/utils";

/** Temporary wordmark until a designed logo exists. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-baseline gap-2 leading-none", className)} aria-label="Thaal home">
      <span className="text-2xl font-extrabold tracking-tight [font-stretch:75%]">thaal</span>
      <span lang="ml" className="text-base font-semibold opacity-70" aria-hidden="true">
        താൾ
      </span>
    </Link>
  );
}
