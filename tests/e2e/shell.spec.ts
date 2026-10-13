import { expect, test } from "@playwright/test";

test("home page shows the bilingual headline and main actions", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Write it.");
  await expect(page.locator('h1 [lang="ml"]')).toHaveText("എഴുതൂ.");
  await expect(page.getByRole("main").getByRole("link", { name: "Start writing" })).toBeVisible();
});

test("no page scrolls sideways", async ({ page }) => {
  for (const path of ["/", "/discover", "/write"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
  }
});

test("navigation reaches discover and the writing studio", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Discover" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discover");
  await page.getByRole("main").getByRole("link", { name: "Start writing" }).click();
  await expect(page.getByText("Private draft. Only you can see this.")).toBeVisible();
});

test("security headers are sent", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("unknown addresses show the not-found page with a 404", async ({ page }) => {
  const res = await page.goto("/no-such-book");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blank page.");
});
