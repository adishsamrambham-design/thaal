import { expect, test } from "@playwright/test";
import { createWork, editorBox, expectSaved, saveStatus, signIn, uniqueEmail } from "./helpers";

const MALAYALAM = "നിലാവ് പെയ്ത രാത്രിയിൽ പുഴ ഉറങ്ങിയില്ല. ക്ഷമ, ജ്ഞാനം, സ്ത്രീ.";

test("signed-out visitors are sent to sign in, then back to where they were going", async ({ page }) => {
  await page.goto("/write");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fwrite$/);
  await signIn(page, uniqueEmail("redirect"), "/write");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your writing");
});

test("Malayalam text is saved and reloads exactly", async ({ page }) => {
  await signIn(page, uniqueEmail("ml"));
  await createWork(page, "നിലാവ്", "ml");

  await page.getByLabel("Chapter title").fill("ഒന്നാം അദ്ധ്യായം");
  await editorBox(page).click();
  await page.keyboard.insertText(MALAYALAM);
  await expectSaved(page);

  await page.reload();
  await expect(page.getByLabel("Chapter title")).toHaveValue("ഒന്നാം അദ്ധ്യായം");
  await expect(editorBox(page)).toHaveText(MALAYALAM);
  await expect(editorBox(page)).toHaveAttribute("lang", "ml");
});

test("another signed-in user cannot open someone else's draft", async ({ browser }) => {
  const a = await browser.newContext();
  const pageA = await a.newPage();
  await signIn(pageA, uniqueEmail("owner"));
  const chapterUrl = await createWork(pageA, "Private manuscript");
  const workUrl = chapterUrl.replace(/\/[^/]+$/, "");
  await editorBox(pageA).click();
  await pageA.keyboard.insertText("Secret first line");
  await expectSaved(pageA);

  const b = await browser.newContext();
  const pageB = await b.newPage();
  await signIn(pageB, uniqueEmail("intruder"));
  for (const url of [chapterUrl, workUrl]) {
    await pageB.goto(url);
    // Studio pages stream, so the HTTP status is sent before the check finishes; what matters is
    // that B sees the not-found page and none of A's content.
    await expect(pageB.getByRole("heading", { name: "Blank page." }), url).toBeVisible();
    await expect(pageB.getByText("Secret first line")).toHaveCount(0);
    await expect(pageB.getByText("Private manuscript")).toHaveCount(0);
  }
  await pageB.goto("/write");
  await expect(pageB.getByText("Private manuscript")).toHaveCount(0);

  await a.close();
  await b.close();
});

test("writing offline is kept and saved when the connection returns", async ({ page, context }) => {
  await signIn(page, uniqueEmail("offline"));
  await createWork(page, "Offline test");
  await editorBox(page).click();
  await page.keyboard.insertText("Written online. ");
  await expectSaved(page);

  await context.setOffline(true);
  await page.keyboard.insertText("Written offline.");
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "offline");

  await context.setOffline(false);
  await expectSaved(page);
  await page.reload();
  await expect(editorBox(page)).toHaveText("Written online. Written offline.");
});

test("unsaved text survives the tab closing and is restored next time", async ({ page, context }) => {
  await signIn(page, uniqueEmail("recover"));
  const url = await createWork(page, "Recovery test");
  await editorBox(page).click();
  await page.keyboard.insertText("Saved part. ");
  await expectSaved(page);

  // Lose the connection, keep typing, then close the tab before anything reaches the server.
  await context.setOffline(true);
  await page.keyboard.insertText("Unsaved part.");
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "offline");
  await page.close({ runBeforeUnload: false });
  await context.setOffline(false);

  const again = await context.newPage();
  await again.goto(url);
  await expect(again.getByText("Unsaved changes from your last session")).toBeVisible();
  await expect(editorBox(again)).toHaveText("Saved part. Unsaved part.");
  await expectSaved(again);
  await again.reload();
  await expect(editorBox(again)).toHaveText("Saved part. Unsaved part.");
});

test("two tabs editing the same chapter never silently overwrite each other", async ({ page, context }) => {
  await signIn(page, uniqueEmail("conflict"));
  const url = await createWork(page, "Two tabs");
  const other = await context.newPage();
  await other.goto(url);
  await expect(editorBox(other)).toBeVisible();

  await editorBox(page).click();
  await page.keyboard.insertText("From tab one.");
  await expectSaved(page);

  await editorBox(other).click();
  await other.keyboard.insertText("From tab two.");
  await expect(other.getByText("was saved from another tab or device")).toBeVisible();
  await expect(saveStatus(other)).toHaveAttribute("data-save-status", "conflict");

  await other.getByRole("button", { name: "Keep my version" }).click();
  await expectSaved(other);
  await page.reload();
  await expect(editorBox(page)).toHaveText("From tab two.");
});

test("signing out removes any unsaved copies from this device", async ({ page }) => {
  await signIn(page, uniqueEmail("signout"));
  await createWork(page, "Sign-out test");
  await page.evaluate(() => localStorage.setItem("thaal:unsaved:test", "{}"));
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("thaal:unsaved:")))).toEqual(
    [],
  );
  await page.goto("/write");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("work details can be edited and the work deleted", async ({ page }) => {
  await signIn(page, uniqueEmail("manage"));
  const chapterUrl = await createWork(page, "Draft name", "en", "poem");
  const workUrl = chapterUrl.replace(/\/[^/]+$/, "");
  await page.goto(workUrl);
  await expect(page.getByRole("heading", { name: "Poems" })).toBeVisible();

  const details = page.getByRole("form", { name: "Work details" });
  await details.getByLabel("Title").fill("Better name");
  await details.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Better name");

  await page.getByRole("button", { name: "Delete work" }).click();
  await expect(page.getByText("Type delete in the box to confirm.")).toBeVisible();
  await page.getByLabel(/Type delete to confirm/).fill("delete");
  await page.getByRole("button", { name: "Delete work" }).click();
  await expect(page).toHaveURL(/\/write$/);
  // Role queries ignore the hidden copy of the previous page that Next keeps for back-navigation.
  await expect(page.getByRole("link", { name: /Better name/ })).toHaveCount(0);
});
