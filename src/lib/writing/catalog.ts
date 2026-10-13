/** Display names and allowed values for work types and languages. Shared by forms and server checks. */

export const WORK_TYPES = [
  { value: "novel", label: "Novel" },
  { value: "short_story", label: "Short story" },
  { value: "poem", label: "Poetry" },
  { value: "serial", label: "Serial" },
  { value: "comic", label: "Comic" },
] as const;

export const LANGUAGES = [
  { value: "en", label: "English", native: "English" },
  { value: "ml", label: "Malayalam", native: "മലയാളം" },
  { value: "hi", label: "Hindi", native: "हिन्दी" },
  { value: "ta", label: "Tamil", native: "தமிழ்" },
  { value: "te", label: "Telugu", native: "తెలుగు" },
  { value: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { value: "bn", label: "Bengali", native: "বাংলা" },
] as const;

export type WorkType = (typeof WORK_TYPES)[number]["value"];
export type LanguageCode = (typeof LANGUAGES)[number]["value"];

export const workTypeValues = WORK_TYPES.map((t) => t.value) as [WorkType, ...WorkType[]];
export const languageValues = LANGUAGES.map((l) => l.value) as [LanguageCode, ...LanguageCode[]];

export const workTypeLabel = (v: string) => WORK_TYPES.find((t) => t.value === v)?.label ?? v;
export const languageLabel = (v: string) => LANGUAGES.find((l) => l.value === v)?.label ?? v;

/** What a "chapter" is called for each kind of work. */
export const partName = (type: string) =>
  type === "poem" ? "Poem" : type === "comic" ? "Episode" : type === "serial" ? "Episode" : "Chapter";
