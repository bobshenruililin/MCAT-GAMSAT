import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");

describe("website-only GitHub Pages product", () => {
  it("ships a clickable player, not a static brochure", () => {
    const html = readFileSync(path.join(root, "docs/index.html"), "utf8");
    const css = readFileSync(path.join(root, "docs/styles.css"), "utf8");
    const siteHtml = readFileSync(path.join(root, "site/index.html"), "utf8");
    const wf = readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
    expect(html).toMatch(/id="app"/);
    expect(html).toMatch(/src="\.\/app\.js"/);
    expect(html).toMatch(/href="\.\/styles\.css"/);
    expect(html).not.toMatch(/GitHub Pages cannot run the player/);
    expect(html).not.toMatch(/pnpm bootstrap/);
    expect(css).toMatch(/#2f6b4f/);
    expect(css).toMatch(/\.continue/);
    expect(wf).toMatch(/path: site/);
    expect(siteHtml).toBe(html);
    expect(existsSync(path.join(root, "docs/app.js"))).toBe(true);
    expect(existsSync(path.join(root, "docs/bank.json"))).toBe(true);
    expect(existsSync(path.join(root, "site/app.js"))).toBe(true);
    expect(existsSync(path.join(root, "site/bank.json"))).toBe(true);
    const bank = JSON.parse(readFileSync(path.join(root, "docs/bank.json"), "utf8")) as {
      itemCount: number;
      items: { verified: boolean }[];
    };
    expect(bank.itemCount).toBeGreaterThan(800);
    expect(bank.itemCount).toBeGreaterThanOrEqual(2320);
    expect(bank.items.every((it) => it.verified === false)).toBe(true);
  });
});
