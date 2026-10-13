"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { languageValues, workTypeValues } from "@/lib/writing/catalog";
import { countWords, docToText, EMPTY_DOC, sanitizeDoc } from "@/lib/writing/content";
import { isUuid } from "@/lib/writing/data";

/*
 * Every action re-checks who is signed in, then lets the database's security rules
 * decide whether the change is allowed. Nothing here trusts IDs sent by the browser.
 */

export type FormState = { error?: string };

const workFields = z.object({
  title: z.string().trim().min(1, "Give your work a title.").max(200, "Titles can be up to 200 characters."),
  type: z.enum(workTypeValues, "Choose what kind of work this is."),
  language: z.enum(languageValues, "Choose the language you're writing in."),
});

export async function createWork(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/write");

  const fields = workFields.safeParse(Object.fromEntries(form));
  if (!fields.success) return { error: fields.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: work, error } = await supabase.from("works").insert(fields.data).select("id").single();
  if (error || !work) return { error: "Couldn't create the work. Try again." };

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .insert({ work_id: work.id, position: 1, title: "" })
    .select("id")
    .single();
  revalidatePath("/write");
  if (chapterError || !chapter) redirect(`/write/${work.id}`);

  redirect(`/write/${work.id}/${chapter.id}`);
}

export async function updateWork(workId: string, _prev: FormState, form: FormData): Promise<FormState> {
  if (!isUuid(workId) || !(await getCurrentUser())) return { error: "Sign in again to continue." };
  const fields = workFields.safeParse(Object.fromEntries(form));
  if (!fields.success) return { error: fields.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase.from("works").update(fields.data).eq("id", workId).select("id");
  if (error || !data?.length) return { error: "Couldn't save the changes." };

  revalidatePath("/write", "layout");
  return {};
}

export async function deleteWork(workId: string, form: FormData): Promise<void> {
  if (!isUuid(workId) || !(await getCurrentUser())) redirect("/sign-in");
  if (form.get("confirm") !== "delete") redirect(`/write/${workId}?error=confirm`);

  const supabase = await createClient();
  await supabase.from("works").delete().eq("id", workId);
  revalidatePath("/write", "layout");
  redirect("/write");
}

export async function addChapter(workId: string): Promise<void> {
  if (!isUuid(workId) || !(await getCurrentUser())) redirect("/sign-in");
  const supabase = await createClient();

  const { data: last } = await supabase
    .from("chapters")
    .select("position")
    .eq("work_id", workId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: chapter, error } = await supabase
    .from("chapters")
    .insert({ work_id: workId, position: (last?.position ?? 0) + 1, title: "" })
    .select("id")
    .single();
  if (error || !chapter) redirect(`/write/${workId}?error=chapter`);
  revalidatePath("/write", "layout");

  redirect(`/write/${workId}/${chapter.id}`);
}

export async function deleteChapter(workId: string, chapterId: string): Promise<void> {
  if (!isUuid(workId) || !isUuid(chapterId) || !(await getCurrentUser())) redirect("/sign-in");
  const supabase = await createClient();
  await supabase.from("chapters").delete().eq("id", chapterId).eq("work_id", workId);
  revalidatePath("/write", "layout");
  redirect(`/write/${workId}`);
}

// ─────────────────────────────────────────────────────────────── autosave

export type SaveResult =
  | { ok: true; version: number; wordCount: number; savedAt: string }
  | { ok: false; reason: "conflict"; currentVersion: number }
  | { ok: false; reason: "signed-out" | "not-found" | "invalid" | "error" };

const saveInput = z.object({
  chapterId: z.string().refine(isUuid),
  expectedVersion: z.number().int().positive(),
  title: z.string().max(200),
  content: z.unknown(),
  language: z.enum(languageValues),
});

export async function saveChapter(input: z.input<typeof saveInput>): Promise<SaveResult> {
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  if (!(await getCurrentUser())) return { ok: false, reason: "signed-out" };

  const content = sanitizeDoc(parsed.data.content ?? EMPTY_DOC);
  if (!content) return { ok: false, reason: "invalid" };
  const wordCount = countWords(`${parsed.data.title}\n${docToText(content)}`, parsed.data.language);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_chapter", {
    p_chapter_id: parsed.data.chapterId,
    p_expected_version: parsed.data.expectedVersion,
    p_title: parsed.data.title,
    p_content: content,
    p_word_count: wordCount,
  });

  if (error) {
    if (error.code === "P0001") return { ok: false, reason: "conflict", currentVersion: Number(error.details) || 0 };
    if (error.code === "P0002") return { ok: false, reason: "not-found" };
    return { ok: false, reason: "error" };
  }
  return { ok: true, version: data, wordCount, savedAt: new Date().toISOString() };
}

export async function restoreVersion(chapterId: string, versionId: number): Promise<SaveResult> {
  if (!isUuid(chapterId) || !Number.isInteger(versionId)) return { ok: false, reason: "invalid" };
  if (!(await getCurrentUser())) return { ok: false, reason: "signed-out" };

  const supabase = await createClient();
  const [{ data: snap }, { data: current }] = await Promise.all([
    supabase
      .from("chapter_versions")
      .select("title, content, word_count")
      .eq("id", versionId)
      .eq("chapter_id", chapterId)
      .maybeSingle(),
    supabase.from("chapters").select("version").eq("id", chapterId).maybeSingle(),
  ]);
  if (!snap || !current) return { ok: false, reason: "not-found" };

  const { data, error } = await supabase.rpc("save_chapter", {
    p_chapter_id: chapterId,
    p_expected_version: current.version,
    p_title: snap.title,
    p_content: snap.content,
    p_word_count: snap.word_count,
  });
  if (error)
    return { ok: false, reason: error.code === "P0001" ? "conflict" : "error", currentVersion: 0 } as SaveResult;
  return { ok: true, version: data, wordCount: snap.word_count, savedAt: new Date().toISOString() };
}

export async function getVersions(chapterId: string) {
  if (!isUuid(chapterId) || !(await getCurrentUser())) return [];
  const { listChapterVersions } = await import("@/lib/writing/data");
  return listChapterVersions(chapterId);
}
