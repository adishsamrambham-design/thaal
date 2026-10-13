"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { sendCode, verifyCode, type SignInState } from "./actions";

const inputClass =
  "h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

export function SignInForm({ next }: { next: string }) {
  const [emailState, sendAction, sending] = useActionState<SignInState, FormData>(sendCode, { step: "email" });
  const [codeState, verifyAction, verifying] = useActionState<SignInState, FormData>(verifyCode, {
    step: "code",
    email: "",
  });

  // The code form takes over once an email has been sent, and keeps its own errors.
  const onCodeStep = emailState.step === "code" && codeState.step === "code";
  const email = emailState.step === "code" ? emailState.email : (emailState.email ?? "");

  if (onCodeStep) {
    return (
      <form action={verifyAction} className="space-y-4" noValidate>
        <p className="leading-relaxed">
          We sent a 6-digit code to <strong className="font-semibold break-all">{email}</strong>. It expires in one
          hour.
        </p>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <label className="block space-y-2">
          <span className="text-sm font-medium">Code</span>
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className={`${inputClass} tracking-[0.4em]`}
            aria-invalid={Boolean(codeState.error)}
            aria-describedby={codeState.error ? "code-error" : undefined}
          />
        </label>
        {codeState.error && (
          <p id="code-error" role="alert" className="text-sm text-destructive">
            {codeState.error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={verifying}>
          {verifying ? "Signing in…" : "Sign in"}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => window.location.reload()}
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form action={sendAction} className="space-y-4" noValidate>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={email}
          className={inputClass}
          aria-invalid={Boolean(emailState.error)}
          aria-describedby={emailState.error ? "email-error" : undefined}
        />
      </label>
      {emailState.error && (
        <p id="email-error" role="alert" className="text-sm text-destructive">
          {emailState.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={sending}>
        {sending ? "Sending…" : "Email me a code"}
      </Button>
      <p className="text-sm text-muted-foreground">No password needed. New here? This creates your account.</p>
    </form>
  );
}
