# Design direction

**Reference:** the founder's agency-style moodboard. It uses oversized condensed capitals, a lime accent on black and white, surreal photo collage, and pill tags.

## Two modes, one brand
| Mode | Where | Feel |
|---|---|---|
| **Loud** | Home, discovery, campaigns, author profile headers, book landing pages | Huge condensed display type, lime blocks, black sections, collage covers, numbered sequences ("01 Write · 02 Publish · 03 Earn") |
| **Quiet** | Editor, reader, library, settings, checkout | Warm off-white or dark paper, serif body text, generous line height, no lime except one action colour |

People spend hours in the reader and editor, and the loud style is tiring at that length.

## Type (all SIL Open Font Licence, Google Fonts)
- **Display:** **Anek** family by Ek Type (published per script: Anek Latin, Anek Malayalam, …). It has variable weight and width axes down to condensed, so we can match the reference, and it covers **Latin, Malayalam, Devanagari, Tamil, Telugu, Kannada, Bengali, Gujarati, Gurmukhi and Odia** in one design. Malayalam headlines will look like the English ones instead of falling back to a mismatched font.
- **Reading:** Noto Serif + Noto Serif Malayalam / Devanagari / Tamil and so on. Readers can switch to Noto Sans or change size and line height.
- **UI:** Inter or Anek Latin at normal width.
- Malayalam needs more line height than English (about 1.8 vs 1.6) because of tall conjuncts, so this is set per language.

## Starting palette (tokens; easy to change)
- `ink` #0E0E0C · `paper` #F7F5EF · `lime` #D7F34A (accent, used on dark or with ink text only, for contrast) · `mist` #E6E4DC · `stone` #8A877D
- Dark mode for the reader from day one.

## Brand
Working name **Thaal** (താൾ, a page or leaf). Wordmark set in Anek condensed. A real logo can come later from a designer.
