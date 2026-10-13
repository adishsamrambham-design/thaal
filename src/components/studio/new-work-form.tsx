"use client";

import { useActionState } from "react";
import { createWork, type FormState } from "@/app/(studio)/write/actions";
import { Button } from "@/components/ui/button";
import { WorkFields } from "./work-fields";

export function NewWorkForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createWork, {});
  return (
    <form action={action} className="space-y-4" aria-label="Start a new work">
      <WorkFields idPrefix="new" />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11 px-5 text-base" disabled={pending}>
        {pending ? "Creating…" : "Start writing"}
      </Button>
    </form>
  );
}
