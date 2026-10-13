"use client";

import { useEffect, useState, useTransition } from "react";
import { getVersions, restoreVersion } from "@/app/(studio)/write/actions";
import { Button } from "@/components/ui/button";
import { clearBackup } from "@/lib/writing/local-backup";

type Version = Awaited<ReturnType<typeof getVersions>>[number];
const when = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function VersionHistory({ chapterId, onClose }: { chapterId: string; onClose: () => void }) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    getVersions(chapterId).then(setVersions, () => setError("Couldn't load the history."));
  }, [chapterId]);

  const restore = (id: number) =>
    start(async () => {
      const r = await restoreVersion(chapterId, id);
      if (r.ok) {
        clearBackup(chapterId);
        window.location.reload();
      } else setError("Couldn't restore that version. Save your current text first, then try again.");
    });

  return (
    <section aria-labelledby="history-heading" className="mt-4 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 id="history-heading" className="font-semibold">
          History
        </h2>
        <button type="button" onClick={onClose} className="text-sm underline underline-offset-4">
          Close
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        A copy is kept at most every 10 minutes while you write. The 30 most recent are kept.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {versions === null && !error && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}
      {versions?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No earlier copies yet.</p>}
      {versions && versions.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>
                {when.format(new Date(v.created_at))}
                <span className="text-muted-foreground">, {v.word_count.toLocaleString("en-IN")} words</span>
              </span>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => restore(v.id)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
