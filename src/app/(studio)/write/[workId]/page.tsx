import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { WorkSettingsForm } from "@/components/studio/work-settings-form";
import { requireUser } from "@/lib/auth";
import { languageLabel, partName, workTypeLabel } from "@/lib/writing/catalog";
import { getMyWork } from "@/lib/writing/data";
import { addChapter, deleteWork } from "../actions";

export const metadata: Metadata = { title: "Work", robots: { index: false } };

export default function WorkPage({ params, searchParams }: PageProps<"/write/[workId]">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Work params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Work({ params, searchParams }: Pick<PageProps<"/write/[workId]">, "params" | "searchParams">) {
  const { workId } = await params;
  const query = await searchParams;
  await requireUser(`/write/${workId}`);
  const work = await getMyWork(workId);
  if (!work) notFound();

  const part = partName(work.type);

  return (
    <>
      <Link href="/write" className="text-sm text-muted-foreground hover:text-foreground">
        Your writing
      </Link>
      <h1 lang={work.language} className="mt-3 text-3xl font-bold sm:text-4xl">
        {work.title}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {workTypeLabel(work.type)} in {languageLabel(work.language)}. Private draft.
      </p>

      {query.error === "chapter" && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Couldn&apos;t add a new {part.toLowerCase()}. Try again.
        </p>
      )}

      <section aria-labelledby="parts-heading" className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 id="parts-heading" className="text-lg font-semibold">
            {part}s
          </h2>
          <form action={addChapter.bind(null, work.id)}>
            <Button type="submit" className="h-10 px-4">
              Add {part.toLowerCase()}
            </Button>
          </form>
        </div>
        {work.chapters.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No {part.toLowerCase()}s yet. Add one to start writing.</p>
        ) : (
          <ol className="mt-4 divide-y divide-border border-y border-border">
            {work.chapters.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/write/${work.id}/${c.id}`}
                  className="flex items-baseline justify-between gap-4 py-3 hover:bg-muted/50 sm:px-2"
                >
                  <span lang={work.language} className="font-medium">
                    <span className="mr-3 text-muted-foreground tabular-nums">{c.position}</span>
                    {c.title || `Untitled ${part.toLowerCase()}`}
                  </span>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {c.word_count.toLocaleString("en-IN")} words
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="details-heading" className="mt-14">
        <h2 id="details-heading" className="text-lg font-semibold">
          Details
        </h2>
        <div className="mt-4">
          <WorkSettingsForm
            workId={work.id}
            defaults={{ title: work.title, type: work.type, language: work.language }}
          />
        </div>
      </section>

      <section aria-labelledby="delete-heading" className="mt-14 rounded-lg border border-destructive/30 p-5">
        <h2 id="delete-heading" className="font-semibold">
          Delete this work
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This permanently deletes the work, every {part.toLowerCase()} and its history. It can&apos;t be undone.
        </p>
        <form action={deleteWork.bind(null, work.id)} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="space-y-1.5">
            <span className="block text-sm">
              Type <strong>delete</strong> to confirm
            </span>
            <input
              name="confirm"
              autoComplete="off"
              className="h-10 rounded-md border border-input bg-background px-3"
              aria-invalid={query.error === "confirm"}
            />
          </label>
          <Button type="submit" variant="destructive" className="h-10 px-4">
            Delete work
          </Button>
        </form>
        {query.error === "confirm" && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Type delete in the box to confirm.
          </p>
        )}
      </section>
    </>
  );
}
