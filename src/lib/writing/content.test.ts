import { describe, expect, it } from "vitest";
import { countWords, docToText, sanitizeDoc } from "./content";

const para = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });

describe("chapter content allow-list", () => {
  it("accepts ordinary writing with formatting", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "ഒന്ന്" }] },
        { type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }] },
        { type: "bulletList", content: [{ type: "listItem", content: [para("item")] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [para("x")] }] },
        { type: "blockquote", content: [para("quoted")] },
        { type: "horizontalRule" },
      ],
    };
    expect(sanitizeDoc(doc)).not.toBeNull();
  });

  it("rejects node types we don't render, such as raw HTML or images", () => {
    expect(sanitizeDoc({ type: "doc", content: [{ type: "html", value: "<script>alert(1)</script>" }] })).toBeNull();
    expect(
      sanitizeDoc({ type: "doc", content: [{ type: "image", attrs: { src: "https://evil.test/x.png" } }] }),
    ).toBeNull();
  });

  it("rejects links and unknown marks", () => {
    const doc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }],
        },
      ],
    };
    expect(sanitizeDoc(doc)).toBeNull();
  });

  it("strips unknown attributes instead of storing them", () => {
    const out = sanitizeDoc({
      type: "doc",
      content: [{ type: "paragraph", attrs: { onclick: "steal()" }, content: [{ type: "text", text: "hi" }] }],
    });
    expect(JSON.stringify(out)).not.toContain("onclick");
  });

  it("rejects headings outside levels 1–3", () => {
    expect(sanitizeDoc({ type: "doc", content: [{ type: "heading", attrs: { level: 6 } }] })).toBeNull();
  });

  it("rejects oversized documents", () => {
    const huge = { type: "doc", content: Array.from({ length: 400 }, () => para("x".repeat(5000))) };
    expect(sanitizeDoc(huge)).toBeNull();
  });
});

describe("word count", () => {
  it("counts English words", () => {
    expect(countWords("The moon rose, slowly.", "en")).toBe(4);
  });

  it("counts Malayalam words", () => {
    expect(countWords("നിലാവ് പെയ്തു, പുഴ ഉറങ്ങി.", "ml")).toBe(4);
  });

  it("counts Hindi words", () => {
    expect(countWords("चाँद धीरे धीरे निकला", "hi")).toBe(4);
  });

  it("ignores punctuation-only text", () => {
    expect(countWords("— … !", "en")).toBe(0);
  });

  it("extracts text across paragraphs for counting", () => {
    const doc = sanitizeDoc({ type: "doc", content: [para("one two"), para("three")] });
    expect(countWords(docToText(doc!), "en")).toBe(3);
  });
});

describe("document comparison", () => {
  it("treats documents as equal when only key order or stripped attributes differ", async () => {
    const { sameDoc } = await import("./content");
    const editor = {
      type: "doc",
      content: [{ type: "paragraph", attrs: { textAlign: null }, content: [{ type: "text", text: "hi" }] }],
    };
    const stored = { content: [{ content: [{ text: "hi", type: "text" }], type: "paragraph" }], type: "doc" };
    expect(sameDoc(editor, stored)).toBe(true);
    expect(sameDoc(editor, { type: "doc", content: [para("bye")] })).toBe(false);
  });
});
