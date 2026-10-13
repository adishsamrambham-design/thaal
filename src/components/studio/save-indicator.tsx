"use client";

import type { SaveStatus } from "./use-autosave";

const timeFormat = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

function label(status: SaveStatus): { text: string; tone: "quiet" | "busy" | "warn" } {
  switch (status.kind) {
    case "saved":
      return { text: status.at ? `Saved ${timeFormat.format(new Date(status.at))}` : "Saved", tone: "quiet" };
    case "unsaved":
      return { text: "Unsaved changes", tone: "busy" };
    case "saving":
      return { text: "Saving…", tone: "busy" };
    case "offline":
      return { text: "Offline. Saved on this device", tone: "warn" };
    case "retrying":
      return { text: `Can't reach the server. Retrying in ${status.inSeconds}s`, tone: "warn" };
    case "conflict":
      return { text: "Not saved: newer version elsewhere", tone: "warn" };
    case "signed-out":
      return { text: "Not saved: signed out", tone: "warn" };
    case "error":
      return { text: status.message, tone: "warn" };
  }
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const { text, tone } = label(status);
  return (
    <span
      role="status"
      aria-live="polite"
      data-save-status={status.kind}
      className={
        tone === "warn"
          ? "font-medium text-amber-700 dark:text-amber-400"
          : tone === "busy"
            ? "text-muted-foreground"
            : "text-muted-foreground"
      }
    >
      {text}
    </span>
  );
}
