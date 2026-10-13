"use client";

import { signOut } from "@/app/(account)/sign-in/actions";
import { clearAllBackups } from "@/lib/writing/local-backup";

export function SignOutButton() {
  return (
    <form action={signOut} onSubmit={() => clearAllBackups()}>
      <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
        Sign out
      </button>
    </form>
  );
}
