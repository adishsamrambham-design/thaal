import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Write privately",
    body: "Everything you write is private until you choose to publish it. Drafts save as you type.",
  },
  {
    title: "Publish free or paid",
    body: "Release a whole book or one chapter at a time. Set any price from ₹49, or give it away.",
  },
  {
    title: "Earn 85% of every sale",
    body: "Readers pay the price plus GST. You get 85% of the price, and you keep the copyright.",
  },
];

const stories = [
  { word: "Story", lang: "en", language: "English" },
  { word: "കഥ", lang: "ml", language: "Malayalam" },
  { word: "कहानी", lang: "hi", language: "Hindi" },
  { word: "கதை", lang: "ta", language: "Tamil" },
  { word: "కథ", lang: "te", language: "Telugu" },
  { word: "ಕಥೆ", lang: "kn", language: "Kannada" },
  { word: "গল্প", lang: "bn", language: "Bengali" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero: the bilingual headline is the one loud thing on this page. */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-end lg:gap-12 lg:pt-16 lg:pb-20">
        <div>
          <h1 className="text-[clamp(4.5rem,15vw,11.5rem)]">
            <span className="display block">Write it.</span>
            <span lang="ml" className="display mt-2 block text-[0.78em]">
              എഴുതൂ.
            </span>
          </h1>
          <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Publish novels, stories, poems, serials and comics in English, Malayalam and five more Indian languages.
            Free or paid, your choice.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-5 text-base">
              <Link href="/write">Start writing</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-5 text-base">
              <Link href="/discover">Browse books</Link>
            </Button>
          </div>
        </div>

        <PageStack />
      </section>

      {/* Sequence: these really are steps, so they are numbered. */}
      <section className="bg-ink text-white" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 id="how-heading" className="display max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)]">
            From first draft to first reader.
          </h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg bg-white/15 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="bg-ink p-6 sm:p-8">
                <span className="display block text-6xl text-lime">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 max-w-xs leading-relaxed text-white/75">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Languages: one word, seven scripts, one typeface. */}
      <section className="bg-lime text-ink" aria-labelledby="lang-heading">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="lang-heading" className="display max-w-2xl text-[clamp(2.75rem,7vw,5.5rem)]">
              Every script gets the same stage.
            </h2>
            <p className="max-w-sm leading-relaxed">
              Write in the language you think in. The app itself is in English for now.
            </p>
          </div>
          <ul className="mt-12 grid grid-cols-2 border-t border-ink/25 sm:grid-cols-3 lg:grid-cols-4">
            {stories.map((s) => (
              <li key={s.lang} className="border-b border-ink/25 py-6 pr-4">
                <span
                  lang={s.lang}
                  className="block text-[clamp(2.5rem,6vw,4rem)] leading-tight font-bold [font-stretch:85%]"
                >
                  {s.word}
                </span>
                <span className="mt-1 block text-sm font-medium">{s.language}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/** A fan of manuscript pages — a placeholder for real book covers once there are books. */
function PageStack() {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-lg bg-lime" aria-hidden="true">
      <Page className="top-[7%] left-[7%] -rotate-[7deg]" lang="hi" title="पहला अध्याय" />
      <Page className="top-[21%] left-[30%] rotate-[3deg]" lang="en" title="Chapter one" />
      <Page
        className="top-[36%] left-[52%] rotate-[9deg] shadow-[0_18px_40px_-12px_rgb(0_0_0/0.35)]"
        lang="ml"
        title="ഒന്നാം അദ്ധ്യായം"
      />
    </div>
  );
}

function Page({ className, lang, title }: { className: string; lang: string; title: string }) {
  return (
    <div
      className={`absolute aspect-[3/4] w-[40%] rounded-[3px] bg-white p-[5%] text-ink shadow-[0_10px_30px_-12px_rgb(0_0_0/0.3)] ${className}`}
    >
      <p lang={lang} className="text-[clamp(0.85rem,2.2vw,1.35rem)] leading-snug font-bold">
        {title}
      </p>
      <div className="mt-[10%] space-y-[7%]">
        {[100, 92, 97, 84, 95, 60].map((w, i) => (
          <div key={i} className="h-[3px] rounded-full bg-ink/15" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
