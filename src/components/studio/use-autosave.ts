"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveChapter, type SaveResult } from "@/app/(studio)/write/actions";
import { clearBackup, writeBackup } from "@/lib/writing/local-backup";

export type SaveStatus =
  | { kind: "saved"; at: string | null }
  | { kind: "unsaved" }
  | { kind: "saving" }
  | { kind: "offline" }
  | { kind: "retrying"; inSeconds: number }
  | { kind: "conflict"; currentVersion: number }
  | { kind: "signed-out" }
  | { kind: "error"; message: string };

type Draft = { title: string; content: unknown };

const DEBOUNCE_MS = 1200;
const MAX_BACKOFF_MS = 30_000;

/**
 * Saves the chapter shortly after the writer pauses.
 *  - Keeps a copy in this browser until the server confirms, so a closed tab or lost connection loses nothing.
 *  - Retries with growing gaps when offline, and immediately when the connection comes back.
 *  - Refuses to overwrite a newer version saved elsewhere; the writer chooses what happens.
 */
export function useAutosave({
  chapterId,
  initialVersion,
  language,
  onSaved,
}: {
  chapterId: string;
  initialVersion: number;
  language: string;
  onSaved?: (r: Extract<SaveResult, { ok: true }>) => void;
}) {
  const [status, setStatus] = useState<SaveStatus>({ kind: "saved", at: null });
  const version = useRef(initialVersion);
  const latest = useRef<Draft | null>(null);
  const changeCount = useRef(0);
  const inFlight = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(2000);
  const blocked = useRef(false); // conflict or signed out: stop saving until the writer decides
  const onSavedRef = useRef(onSaved);
  // flush() schedules itself for retries; going through a ref keeps the latest version.
  const flushRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    onSavedRef.current = onSaved;
  });

  const flush = useCallback(async (): Promise<void> => {
    if (inFlight.current || blocked.current || !latest.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus({ kind: "offline" });
      return;
    }
    inFlight.current = true;
    const sentAt = changeCount.current;
    const draft = latest.current;
    setStatus({ kind: "saving" });

    let result: SaveResult;
    try {
      result = await saveChapter({
        chapterId,
        expectedVersion: version.current,
        title: draft.title,
        content: draft.content,
        language: language as never,
      });
    } catch {
      // Network failure: the server never answered. Keep the local copy and try again later.
      inFlight.current = false;
      const wait = backoff.current;
      backoff.current = Math.min(backoff.current * 2, MAX_BACKOFF_MS);
      setStatus(navigator.onLine ? { kind: "retrying", inSeconds: Math.round(wait / 1000) } : { kind: "offline" });
      if (retry.current) clearTimeout(retry.current);
      retry.current = setTimeout(() => void flushRef.current(), wait);
      return;
    }
    inFlight.current = false;
    backoff.current = 2000;

    if (result.ok) {
      version.current = result.version;
      onSavedRef.current?.(result);
      if (changeCount.current === sentAt) {
        clearBackup(chapterId);
        latest.current = null;
        setStatus({ kind: "saved", at: result.savedAt });
      } else {
        // The writer kept typing while we saved; save again with the newer text.
        writeBackup(chapterId, { baseVersion: version.current, ...latest.current!, at: new Date().toISOString() });
        setStatus({ kind: "unsaved" });
        void flushRef.current();
      }
      return;
    }

    switch (result.reason) {
      case "conflict":
        blocked.current = true;
        setStatus({ kind: "conflict", currentVersion: result.currentVersion });
        return;
      case "signed-out":
        blocked.current = true;
        setStatus({ kind: "signed-out" });
        return;
      case "invalid":
        setStatus({ kind: "error", message: "Some formatting couldn't be saved. Remove it and try again." });
        return;
      default:
        setStatus({ kind: "error", message: "Saving failed. Your text is kept on this device; we'll retry." });
        if (retry.current) clearTimeout(retry.current);
        retry.current = setTimeout(() => void flushRef.current(), backoff.current);
    }
  }, [chapterId, language]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  /** Call on every edit. */
  const change = useCallback(
    (draft: Draft) => {
      latest.current = draft;
      changeCount.current += 1;
      writeBackup(chapterId, { baseVersion: version.current, ...draft, at: new Date().toISOString() });
      if (!blocked.current) setStatus(navigator.onLine ? { kind: "unsaved" } : { kind: "offline" });
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [chapterId, flush],
  );

  /** After a conflict: keep this device's text and overwrite the other version. */
  const keepMine = useCallback(
    (currentVersion: number) => {
      version.current = currentVersion;
      blocked.current = false;
      void flush();
    },
    [flush],
  );

  // Retry straight away when the connection returns.
  useEffect(() => {
    const online = () => {
      if (retry.current) clearTimeout(retry.current);
      backoff.current = 2000;
      void flush();
    };
    const offline = () => {
      if (latest.current) setStatus({ kind: "offline" });
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [flush]);

  // Warn before closing the tab with unsaved text (the local copy still protects it).
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (latest.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  useEffect(
    () => () => {
      if (debounce.current) clearTimeout(debounce.current);
      if (retry.current) clearTimeout(retry.current);
    },
    [],
  );

  return { status, change, keepMine, flush, versionRef: version };
}
