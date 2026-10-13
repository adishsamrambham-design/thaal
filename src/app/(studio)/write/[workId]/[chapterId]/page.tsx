import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChapterEditor } from "@/components/studio/chapter-editor";
import { requireUser } from "@/lib/auth";
import { partName } from "@/lib/writing/catalog";
import { getMyChapter, getMyWork } from "@/lib/writing/data";

export const metadata: Metadata = { title: "Writing", robots: { index: false } };

export default function ChapterPage({ params }: PageProps<"/write/[workId]/[chapterId]">) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground sm:px-6">Opening…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/write/[workId]/[chapterId]">, "params">) {
  const { workId, chapterId } = await params;
  await requireUser(`/write/${workId}/${chapterId}`);
  const [work, chapter] = await Promise.all([getMyWork(workId), getMyChapter(chapterId)]);
  if (!work || !chapter || chapter.work_id !== work.id) notFound();

  return (
    <ChapterEditor
      key={`${chapter.id}:${chapter.version}`}
      chapter={{ id: chapter.id, title: chapter.title, content: chapter.content, version: chapter.version }}
      work={{ id: work.id, title: work.title, language: work.language }}
      partLabel={partName(work.type)}
    />
  );
}
