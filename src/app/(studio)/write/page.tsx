import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewWorkForm } from "@/components/studio/new-work-form";
import { requireUser } from "@/lib/auth";
import { languageLabel, workTypeLabel } from "@/lib/writing/catalog";
import { listMyWorks } from "@/lib/writing/data";

export const metadata: Metadata = { title: "Your writing", robots: { index: false } };

export default function WritePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Your writing</h1>
      <p className="mt-2 text-muted-foreground">Everything here is private. Only you can see it.</p>
      <Suspense fallback={<p className="mt-10 text-muted-foreground">Loading your works…</p>}>
        <Works />
      </Suspense>
    </div>
  );
}

async function Works() {
  await requireUser("/write");
  const works = await listMyWorks();

  return (
    <>
      <section aria-labelledby="new-heading" className="mt-10 rounded-lg border border-border p-5 sm:p-6">
        <h2 id="new-heading" className="text-lg font-semibold">
          {works.length ? "Start something new" : "Start your first work"}
        </h2>
        <div className="mt-4">
          <NewWorkForm />
        </div>
      </section>

      {works.length > 0 && (
        <section aria-labelledby="works-heading" className="mt-12">
          <h2 id="works-heading" className="text-lg font-semibold">
            Drafts
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {works.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/write/${w.id}`}
                  className="flex flex-col gap-1 py-4 hover:bg-muted/50 sm:flex-row sm:items-baseline sm:justify-between sm:px-2"
                >
                  <span lang={w.language} className="text-lg font-semibold">
                    {w.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {workTypeLabel(w.type)}, {languageLabel(w.language)}. {w.chapter_count}{" "}
                    {w.chapter_count === 1 ? "part" : "parts"}, {w.word_count.toLocaleString("en-IN")} words
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
