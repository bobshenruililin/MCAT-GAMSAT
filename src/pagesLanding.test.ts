import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

describe("GitHub Pages product files stay in sync", () => {
  it("docs and site HTML/CSS match after the website build", () => {
    const docsHtml = readFileSync(path.join(root, "docs/index.html"), "utf8");
    const siteHtml = readFileSync(path.join(root, "site/index.html"), "utf8");
    const docsCss = readFileSync(path.join(root, "docs/styles.css"), "utf8");
    const siteCss = readFileSync(path.join(root, "site/styles.css"), "utf8");
    expect(siteHtml).toBe(docsHtml);
    expect(siteCss).toBe(docsCss);
    expect(docsHtml).toMatch(/src="\.\/app\.js"/);
  });
});
