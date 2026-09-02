import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AMBITION, formatCount } from "@/engine/ambition";

const root = path.resolve(__dirname, "..");

describe("GitHub Pages door", () => {
  it("is a static landing with designed scale and local clone commands", () => {
    const html = readFileSync(path.join(root, "site/index.html"), "utf8");
    const css = readFileSync(path.join(root, "site/styles.css"), "utf8");
    const docsHtml = readFileSync(path.join(root, "docs/index.html"), "utf8");
    const docsCss = readFileSync(path.join(root, "docs/styles.css"), "utf8");
    const wf = readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
    expect(html).toMatch(/Exam morning/);
    expect(html).toContain(formatCount(AMBITION.totalDesignedItems));
    expect(html).toMatch(/pnpm bootstrap/);
    expect(html).toMatch(/pnpm sit/);
    expect(html).toMatch(/corepack prepare pnpm@10\.33\.3 --activate/);
    expect(html).toMatch(/pnpm: command not found/);
    expect(html).toMatch(/git clone/);
    expect(html).toMatch(/GitHub Pages cannot run the player/);
    expect(html).toMatch(/http:\/\/localhost:3000/);
    expect(html).toMatch(/Safari or Chrome/);
    expect(html).toMatch(/Use it outside Cursor/);
    expect(html).not.toMatch(/api\/sessions/);
    expect(css).toMatch(/#2f6b4f/);
    expect(wf).toMatch(/upload-pages-artifact/);
    expect(wf).toMatch(/deploy-pages/);
    expect(wf).toMatch(/path: site/);
    expect(docsHtml).toBe(html);
    expect(docsCss).toBe(css);
    expect(readFileSync(path.join(root, "docs/.nojekyll"), "utf8")).toBe("");
    expect(readFileSync(path.join(root, "scripts/mac-setup.sh"), "utf8")).toMatch(
      /corepack prepare pnpm@10\.33\.3 --activate/,
    );
  });
});
