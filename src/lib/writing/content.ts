import { z } from "zod";

/**
 * The only shapes a chapter may contain. Anything else sent to the server is rejected
 * or stripped before it reaches the database. This is the main defence against someone
 * smuggling scripts or tracking pixels into a book: we never store or render raw HTML.
 */

export const MAX_CONTENT_BYTES = 1_500_000; // ~ a 250,000-word chapter; the DB allows 2 MB
export const EMPTY_DOC = { type: "doc", content: [] } as const;

const mark = z.object({
  type: z.enum(["bold", "italic", "strike", "underline"]),
});

const text = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(100_000),
  marks: z.array(mark).max(4).optional(),
});

const hardBreak = z.object({ type: z.literal("hardBreak") });
const horizontalRule = z.object({ type: z.literal("horizontalRule") });

const inline = z.discriminatedUnion("type", [text, hardBreak]);

const paragraph = z.object({
  type: z.literal("paragraph"),
  content: z.array(inline).max(10_000).optional(),
});

const heading = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
  content: z.array(inline).max(1_000).optional(),
});

export type BlockNode =
  | z.infer<typeof paragraph>
  | z.infer<typeof heading>
  | z.infer<typeof horizontalRule>
  | { type: "blockquote"; content?: BlockNode[] }
  | { type: "bulletList"; content?: ListItemNode[] }
  | { type: "orderedList"; attrs?: { start?: number }; content?: ListItemNode[] }
  | ListItemNode;
type ListItemNode = { type: "listItem"; content?: BlockNode[] };

// A plain union (not discriminatedUnion) because the list nodes refer back to `block`.
const block: z.ZodType<BlockNode> = z.lazy(() =>
  z.union([
    paragraph,
    heading,
    horizontalRule,
    z.object({ type: z.literal("blockquote"), content: z.array(block).max(1_000).optional() }),
    z.object({ type: z.literal("bulletList"), content: z.array(listItem).max(1_000).optional() }),
    z.object({
      type: z.literal("orderedList"),
      attrs: z.object({ start: z.number().int().min(0).max(100_000).optional() }).optional(),
      content: z.array(listItem).max(1_000).optional(),
    }),
    listItem,
  ]),
);

const listItem: z.ZodType<ListItemNode> = z.lazy(() =>
  z.object({ type: z.literal("listItem"), content: z.array(block).max(100).optional() }),
);

export const docSchema = z.object({
  type: z.literal("doc"),
  content: z.array(block).max(50_000).optional(),
});

export type Doc = z.infer<typeof docSchema>;

/** Validates and strips unknown attributes. Returns null if the document isn't allowed. */
export function sanitizeDoc(input: unknown): Doc | null {
  const size = JSON.stringify(input ?? null).length;
  if (size > MAX_CONTENT_BYTES) return null;
  const parsed = docSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

/** Plain text of a document, paragraphs separated by newlines. */
export function docToText(doc: Doc): string {
  const out: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (n.type === "text" && n.text) out.push(n.text);
    else if (n.type === "hardBreak") out.push("\n");
    if (Array.isArray(n.content)) {
      n.content.forEach(walk);
      if (n.type !== "doc" && n.type !== "text") out.push("\n");
    }
  };
  walk(doc);
  return out.join("");
}

const segmenters = new Map<string, Intl.Segmenter>();

/** Counts words using the language's own word rules (works for Malayalam and other Indic scripts). */
export function countWords(text: string, lang = "en"): number {
  let seg = segmenters.get(lang);
  if (!seg) {
    seg = new Intl.Segmenter(lang, { granularity: "word" });
    segmenters.set(lang, seg);
  }
  let n = 0;
  for (const s of seg.segment(text)) if (s.isWordLike) n++;
  return n;
}

/** Stable JSON for comparing documents: object keys sorted, so storage order doesn't matter. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** True if two documents contain the same text and formatting, ignoring key order and stripped attributes. */
export function sameDoc(a: unknown, b: unknown): boolean {
  const sa = sanitizeDoc(a);
  const sb = sanitizeDoc(b);
  return sa !== null && sb !== null && canonical(sa) === canonical(sb);
}
