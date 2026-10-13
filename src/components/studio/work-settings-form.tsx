"use client";

import { useActionState } from "react";
import { updateWork, type FormState } from "@/app/(studio)/write/actions";
import { Button } from "@/components/ui/button";
import { WorkFields } from "./work-fields";

export function WorkSettingsForm({
  workId,
  defaults,
}: {
  workId: string;
  defaults: { title: string; type: string; language: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateWork.bind(null, workId), {});
  return (
    <form action={action} className="space-y-4" aria-label="Work details">
      <WorkFields idPrefix="edit" defaults={defaults} />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="outline" className="h-10 px-4" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
