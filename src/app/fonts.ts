import {
  Anek_Bangla,
  Anek_Devanagari,
  Anek_Kannada,
  Anek_Latin,
  Anek_Malayalam,
  Anek_Tamil,
  Anek_Telugu,
  Noto_Serif,
  Noto_Serif_Malayalam,
} from "next/font/google";

/*
 * Anek (Ek Type, SIL OFL) is one design drawn for Latin and nine Indian scripts,
 * with a width axis down to 75% — the condensed display voice of the brand.
 * The browser picks each glyph from the first family in the stack that has it,
 * so a mixed English/Malayalam headline stays in one consistent design.
 * (next/font needs literal options in every call, so they are repeated on purpose.)
 *
 * Latin and Malayalam are preloaded (launch focus). Other scripts load only when
 * a page actually contains that script, so English-only pages stay light.
 */
export const anekLatin = Anek_Latin({
  display: "swap",
  axes: ["wdth"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-anek-latin",
});
export const anekMalayalam = Anek_Malayalam({
  display: "swap",
  axes: ["wdth"],
  subsets: ["malayalam"],
  variable: "--font-anek-malayalam",
});
export const anekDevanagari = Anek_Devanagari({
  display: "swap",
  axes: ["wdth"],
  subsets: ["devanagari"],
  preload: false,
  variable: "--font-anek-devanagari",
});
export const anekTamil = Anek_Tamil({
  display: "swap",
  axes: ["wdth"],
  subsets: ["tamil"],
  preload: false,
  variable: "--font-anek-tamil",
});
export const anekTelugu = Anek_Telugu({
  display: "swap",
  axes: ["wdth"],
  subsets: ["telugu"],
  preload: false,
  variable: "--font-anek-telugu",
});
export const anekKannada = Anek_Kannada({
  display: "swap",
  axes: ["wdth"],
  subsets: ["kannada"],
  preload: false,
  variable: "--font-anek-kannada",
});
export const anekBangla = Anek_Bangla({
  display: "swap",
  axes: ["wdth"],
  subsets: ["bengali"],
  preload: false,
  variable: "--font-anek-bangla",
});

/* Reading face for long-form text in the reader and editor. */
export const notoSerif = Noto_Serif({
  display: "swap",
  subsets: ["latin", "latin-ext"],
  preload: false,
  variable: "--font-noto-serif",
});
export const notoSerifMalayalam = Noto_Serif_Malayalam({
  display: "swap",
  subsets: ["malayalam"],
  preload: false,
  variable: "--font-noto-serif-malayalam",
});

export const fontVariables = [
  anekLatin,
  anekMalayalam,
  anekDevanagari,
  anekTamil,
  anekTelugu,
  anekKannada,
  anekBangla,
  notoSerif,
  notoSerifMalayalam,
]
  .map((f) => f.variable)
  .join(" ");
