import type { Metadata } from "next";

export const metadata: Metadata = { title: "Write", robots: { index: false } };

/**
 * Placeholder for the editor (Phase 2). Shows the reading/writing type so it can be
 * reviewed early, in English and Malayalam.
 */
export default function WritePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm text-muted-foreground">Private draft. Only you can see this.</p>

      <article className="mt-8 space-y-10">
        <section>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">The editor arrives in the next phase</h1>
          <p className="prose-read mt-5">
            This is how your writing will look while you work: a calm page, a reading typeface and nothing else on
            screen. Sign-in, autosave and private drafts are next. Everything you write here will stay private until you
            choose to publish it.
          </p>
        </section>

        <section lang="ml">
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">ഒന്നാം അദ്ധ്യായം</h2>
          <p className="prose-read mt-5">
            നിങ്ങൾ എഴുതുന്നതെല്ലാം പ്രസിദ്ധീകരിക്കുന്നതുവരെ നിങ്ങൾക്ക് മാത്രം കാണാവുന്നതായിരിക്കും. മലയാളം വായിക്കാൻ
            എളുപ്പമാകുന്ന തരത്തിൽ വരികൾക്കിടയിൽ കൂടുതൽ അകലം നൽകിയിട്ടുണ്ട്.
          </p>
        </section>
      </article>
    </div>
  );
}
