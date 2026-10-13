import { expect, type Page } from "@playwright/test";

const MAILBOX = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export function uniqueEmail(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
}

/** Reads the newest sign-in code sent to this address from the local test mailbox. */
async function readCode(email: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const res = await fetch(`${MAILBOX}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const msg = (await (await fetch(`${MAILBOX}/api/v1/message/${messages[0]!.ID}`)).json()) as {
        Text: string;
        HTML: string;
      };
      const code = (msg.Text || msg.HTML).match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No sign-in email arrived for ${email}`);
}

export async function signIn(page: Page, email: string, next?: string) {
  await page.goto(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByText("We sent a 6-digit code")).toBeVisible();
  await page.getByLabel("Code").fill(await readCode(email));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(next ? new RegExp(`${next}$`) : /\/write$/);
}

/** Creates a work from the studio home and lands in its first chapter's editor. */
export async function createWork(page: Page, title: string, language = "en", type = "novel") {
  await page.goto("/write");
  const form = page.getByRole("form", { name: "Start a new work" });
  await form.getByLabel("Title").fill(title);
  await form.getByLabel("Kind").selectOption(type);
  await form.getByLabel("Language").selectOption(language);
  await form.getByRole("button", { name: "Start writing" }).click();
  await expect(page).toHaveURL(/\/write\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/);
  await expect(editorBox(page)).toBeVisible();
  return page.url();
}

export const editorBox = (page: Page) => page.getByRole("textbox", { name: /text$/ });
export const saveStatus = (page: Page) => page.locator("[data-save-status]");

export async function expectSaved(page: Page) {
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", { timeout: 15_000 });
}
