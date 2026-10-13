// Fails if anything that looks like a server secret ended up in files sent to browsers.
// Run after `pnpm build`.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const roots = [".next/static", ".next/server/app"].filter(existsSync);
if (roots.length === 0) {
  console.error("No build output found. Run `pnpm build` first.");
  process.exit(1);
}

const patterns = [/sb_secret_[A-Za-z0-9_-]{10,}/, /"role"\s*:\s*"service_role"/];
const secretValue = process.env.SUPABASE_SECRET_KEY;
if (secretValue && secretValue.length >= 20)
  patterns.push(new RegExp(secretValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

// .next/server holds server-only code, but its HTML/RSC payloads are sent to browsers.
const isBrowserFacing = (file) => file.startsWith(".next/static") || /\.(html|rsc|body)$/.test(file);

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (isBrowserFacing(p)) {
      const text = readFileSync(p, "utf8");
      for (const re of patterns) if (re.test(text)) hits.push(`${p} matches ${re}`);
    }
  }
}
roots.forEach(walk);

if (hits.length) {
  console.error("❌ Possible secret in browser-facing build output:\n" + hits.join("\n"));
  process.exit(1);
}
console.log("✓ No server secrets found in browser-facing build output.");
