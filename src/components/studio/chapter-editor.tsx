"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold,
  Heading2,
  Heading3,
  History,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { countWords, docToText, sameDoc, sanitizeDoc, type Doc } from "@/lib/writing/content";
import { clearBackup, readBackup } from "@/lib/writing/local-backup";
import { cn } from "@/lib/utils";
import { SaveIndicator } from "./save-indicator";
import { useAutosave } from "./use-autosave";
import { VersionHistory } from "./version-history";

type Props = {
  chapter: { id: string; title: string; content: Doc; version: number };
  work: { id: string; title: string; language: string };
  partLabel: string;
};

type Recovery = { kind: "restored" } | { kind: "older"; title: string; content: Doc } | null;

export function ChapterEditor({ chapter, work, partLabel }: Props) {
  const [title, setTitle] = useState(chapter.title);
  const titleRef = useRef(chapter.title);
  const [words, setWords] = useState(() =>
    countWords(`${chapter.title}\n${docToText(chapter.content)}`, work.language),
  );
  const [recovery, setRecovery] = useState<Recovery>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const autosave = useAutosave({
    chapterId: chapter.id,
    initialVersion: chapter.version,
    language: work.language,
    onSaved: (r) => setWords(r.wordCount),
  });

  const editor = useEditor({
    immediatelyRender: false,
    content: chapter.content,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: false,
      }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    editorProps: {
      attributes: {
        lang: work.language,
        class: "prose-read min-h-[60vh] outline-none",
        "aria-label": `${partLabel} text`,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    // Restore unsaved text left on this device by a closed tab or lost connection.
    onCreate: ({ editor }) => {
      const backup = readBackup(chapter.id);
      if (!backup) return;
      const content = sanitizeDoc(backup.content);
      // Same text as the server (e.g. the save went through but the tab closed before clearing it).
      const same = sameDoc(backup.content, chapter.content) && backup.title === chapter.title;
      if (!content || same) {
        clearBackup(chapter.id);
        return;
      }
      if (backup.baseVersion === chapter.version) {
        editor.commands.setContent(content, { emitUpdate: false });
        titleRef.current = backup.title;
        setTitle(backup.title);
        autosave.change({ title: backup.title, content });
        setRecovery({ kind: "restored" });
      } else {
        setRecovery({ kind: "older", title: backup.title, content });
      }
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      autosave.change({ title: titleRef.current, content });
      setWords(countWords(`${titleRef.current}\n${docToText(content as Doc)}`, work.language));
    },
  });

  const onTitle = (value: string) => {
    titleRef.current = value;
    setTitle(value);
    if (editor) autosave.change({ title: value, content: editor.getJSON() });
  };

  const status = autosave.status;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
      <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/write/${work.id}`}
            lang={work.language}
            className="min-w-0 truncate text-sm text-muted-foreground hover:text-foreground"
          >
            {work.title}
          </Link>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <span className="text-muted-foreground tabular-nums">{words.toLocaleString("en-IN")} words</span>
            <SaveIndicator status={status} />
          </div>
        </div>
        {editor && <Toolbar editor={editor} onHistory={() => setHistoryOpen((v) => !v)} historyOpen={historyOpen} />}
      </div>

      {status.kind === "conflict" && (
        <Banner tone="warn">
          <p>This {partLabel.toLowerCase()} was saved from another tab or device while you were writing.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => autosave.keepMine(status.currentVersion)}>
              Keep my version
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearBackup(chapter.id);
                window.location.reload();
              }}
            >
              Load the other version
            </Button>
          </div>
        </Banner>
      )}
      {status.kind === "signed-out" && (
        <Banner tone="warn">
          <p>
            You&apos;ve been signed out. Your text is kept on this device.{" "}
            <a
              href={`/sign-in?next=${encodeURIComponent(`/write/${work.id}/${chapter.id}`)}`}
              target="_blank"
              rel="noopener"
              className="underline"
            >
              Sign in again in a new tab
            </a>
            , then come back and reload this page.
          </p>
        </Banner>
      )}
      {recovery?.kind === "restored" && (
        <Banner tone="info" onClose={() => setRecovery(null)}>
          <p>Unsaved changes from your last session on this device were restored and are being saved.</p>
        </Banner>
      )}
      {recovery?.kind === "older" && (
        <Banner tone="warn">
          <p>
            This device has unsaved text from an older version of this {partLabel.toLowerCase()}. The version below is
            newer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!editor) return;
                editor.commands.setContent(recovery.content, { emitUpdate: false });
                titleRef.current = recovery.title;
                setTitle(recovery.title);
                autosave.change({ title: recovery.title, content: recovery.content });
                setRecovery(null);
              }}
            >
              Use the text from this device
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearBackup(chapter.id);
                setRecovery(null);
              }}
            >
              Discard it
            </Button>
          </div>
        </Banner>
      )}

      {historyOpen && <VersionHistory chapterId={chapter.id} onClose={() => setHistoryOpen(false)} />}

      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        lang={work.language}
        maxLength={200}
        placeholder={`${partLabel} title`}
        aria-label={`${partLabel} title`}
        className="mt-8 w-full bg-transparent font-serif text-3xl font-semibold outline-none placeholder:text-muted-foreground/60 sm:text-4xl"
      />
      <div className="mt-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, onHistory, historyOpen }: { editor: Editor; onHistory: () => void; historyOpen: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      quote: e.isActive("blockquote"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const tools = useMemo(
    () => [
      { label: "Bold", icon: Bold, active: s.bold, run: () => editor.chain().focus().toggleBold().run() },
      { label: "Italic", icon: Italic, active: s.italic, run: () => editor.chain().focus().toggleItalic().run() },
      {
        label: "Underline",
        icon: Underline,
        active: s.underline,
        run: () => editor.chain().focus().toggleUnderline().run(),
      },
      {
        label: "Strikethrough",
        icon: Strikethrough,
        active: s.strike,
        run: () => editor.chain().focus().toggleStrike().run(),
      },
      {
        label: "Heading",
        icon: Heading2,
        active: s.h2,
        run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: "Subheading",
        icon: Heading3,
        active: s.h3,
        run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      { label: "Quote", icon: Quote, active: s.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
      {
        label: "Bulleted list",
        icon: List,
        active: s.bullet,
        run: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        label: "Numbered list",
        icon: ListOrdered,
        active: s.ordered,
        run: () => editor.chain().focus().toggleOrderedList().run(),
      },
    ],
    [editor, s],
  );

  return (
    <div role="toolbar" aria-label="Formatting" className="-mx-1 mt-2 flex items-center gap-0.5 overflow-x-auto">
      {tools.map(({ label, icon: Icon, active, run }) => (
        <button
          key={label}
          type="button"
          onClick={run}
          aria-label={label}
          aria-pressed={active}
          title={label}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground",
            active && "bg-foreground text-background hover:bg-foreground hover:text-background",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </button>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!s.canUndo}
        aria-label="Undo"
        title="Undo"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <Undo2 className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!s.canRedo}
        aria-label="Redo"
        title="Redo"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-40"
      >
        <Redo2 className="size-4" aria-hidden />
      </button>
      <span className="ml-auto" />
      <button
        type="button"
        onClick={onHistory}
        aria-expanded={historyOpen}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <History className="size-4" aria-hidden />
        History
      </button>
    </div>
  );
}

function Banner({
  tone,
  children,
  onClose,
}: {
  tone: "info" | "warn";
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      role={tone === "warn" ? "alert" : "status"}
      className={cn(
        "mt-4 rounded-md border p-4 text-sm",
        tone === "warn"
          ? "border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
          : "border-border bg-muted",
      )}
    >
      {children}
      {onClose && (
        <button type="button" onClick={onClose} className="mt-2 text-sm underline underline-offset-4">
          Dismiss
        </button>
      )}
    </div>
  );
}
