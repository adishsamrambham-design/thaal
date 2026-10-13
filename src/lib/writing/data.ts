import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Doc } from "./content";

/*
 * Reads for the writing studio. All of these run as the signed-in user, so the database's
 * security rules decide what comes back. A missing row and someone else's row look the same.
 */

export type WorkSummary = {
  id: string;
  title: string;
  type: string;
  language: string;
  status: string;
  updated_at: string;
  chapter_count: number;
  word_count: number;
};

export async function listMyWorks(): Promise<WorkSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .select("id, title, type, language, status, updated_at, chapters(word_count)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Could not load your works");
  return data.map((w) => ({
    id: w.id,
    title: w.title,
    type: w.type,
    language: w.language,
    status: w.status,
    updated_at: w.updated_at,
    chapter_count: w.chapters.length,
    word_count: w.chapters.reduce((sum: number, c: { word_count: number }) => sum + c.word_count, 0),
  }));
}

export type ChapterSummary = { id: string; position: number; title: string; word_count: number; updated_at: string };
export type WorkDetail = Omit<WorkSummary, "chapter_count" | "word_count"> & { chapters: ChapterSummary[] };

export async function getMyWork(workId: string): Promise<WorkDetail | null> {
  if (!isUuid(workId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("works")
    .select("id, title, type, language, status, updated_at, chapters(id, position, title, word_count, updated_at)")
    .eq("id", workId)
    .order("position", { referencedTable: "chapters", ascending: true })
    .maybeSingle();
  if (error) throw new Error("Could not load this work");
  return data;
}

export type ChapterForEditing = {
  id: string;
  work_id: string;
  position: number;
  title: string;
  content: Doc;
  version: number;
  updated_at: string;
};

export async function getMyChapter(chapterId: string): Promise<ChapterForEditing | null> {
  if (!isUuid(chapterId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("id, work_id, position, title, content, version, updated_at")
    .eq("id", chapterId)
    .maybeSingle();
  if (error) throw new Error("Could not load this chapter");
  return data as ChapterForEditing | null;
}

export type VersionSummary = { id: number; version: number; title: string; word_count: number; created_at: string };

export async function listChapterVersions(chapterId: string): Promise<VersionSummary[]> {
  if (!isUuid(chapterId)) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chapter_versions")
    .select("id, version, title, word_count, created_at")
    .eq("chapter_id", chapterId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load version history");
  return data;
}

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
