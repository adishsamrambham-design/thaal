import { LANGUAGES, WORK_TYPES } from "@/lib/writing/catalog";

export const fieldClass =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

type Defaults = { title?: string; type?: string; language?: string };

/** Title, kind of work and language: the same three fields for creating and editing a work. */
export function WorkFields({ defaults = {}, idPrefix }: { defaults?: Defaults; idPrefix: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
      <label className="space-y-1.5" htmlFor={`${idPrefix}-title`}>
        <span className="text-sm font-medium">Title</span>
        <input
          id={`${idPrefix}-title`}
          name="title"
          required
          maxLength={200}
          defaultValue={defaults.title}
          className={fieldClass}
          autoComplete="off"
        />
      </label>
      <label className="space-y-1.5" htmlFor={`${idPrefix}-type`}>
        <span className="text-sm font-medium">Kind</span>
        <select
          id={`${idPrefix}-type`}
          name="type"
          required
          defaultValue={defaults.type ?? "novel"}
          className={fieldClass}
        >
          {WORK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5" htmlFor={`${idPrefix}-language`}>
        <span className="text-sm font-medium">Language</span>
        <select
          id={`${idPrefix}-language`}
          name="language"
          required
          defaultValue={defaults.language ?? "en"}
          className={fieldClass}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label === l.native ? l.label : `${l.label} (${l.native})`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
