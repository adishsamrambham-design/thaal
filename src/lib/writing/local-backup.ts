/**
 * A copy of unsaved writing kept in this browser, so nothing is lost if the tab closes or the
 * connection drops. It is deleted as soon as the server confirms the save, and every copy is
 * wiped on sign-out, so a shared computer doesn't keep someone's draft.
 */

const PREFIX = "thaal:unsaved:";

export type LocalBackup = { baseVersion: number; title: string; content: unknown; at: string };

export function readBackup(chapterId: string): LocalBackup | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + chapterId);
    return raw ? (JSON.parse(raw) as LocalBackup) : null;
  } catch {
    return null;
  }
}

export function writeBackup(chapterId: string, backup: LocalBackup): void {
  try {
    window.localStorage.setItem(PREFIX + chapterId, JSON.stringify(backup));
  } catch {
    // Storage full or blocked (private mode). Autosave to the server still works.
  }
}

export function clearBackup(chapterId: string): void {
  try {
    window.localStorage.removeItem(PREFIX + chapterId);
  } catch {
    /* ignore */
  }
}

export function clearAllBackups(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
