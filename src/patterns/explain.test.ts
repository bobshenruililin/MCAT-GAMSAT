import { describe, expect, it } from "vitest";
import { contrastPatternId, decorateExplanation } from "./explain";
import { PATTERNS } from "./catalog";

describe("decorateExplanation", () => {
  it("prepends pattern move and content grain when missing", () => {
    const p = PATTERNS[0];
    const out = decorateExplanation({
      explanation: "The keyed option follows the analog's relation, not its nouns, on this new instance.",
      skillTag: p.id,
      conceptId: p.topicId,
      conceptName: "Foundations of CARS",
    });
    expect(out.pattern?.id).toBe(p.id);
    expect(out.pattern?.name).toBe(p.name);
    expect(out.pattern?.move).toBe(p.move);
    expect(out.explanation.startsWith(`Pattern (${p.id} — ${p.name}):`)).toBe(true);
    expect(out.explanation).toContain(`Content grain (${p.topicId}):`);
    expect(out.explanation).toContain("Foundations of CARS");
  });

  it("does not duplicate an existing Pattern block", () => {
    const p = PATTERNS[1];
    const existing = `Pattern (${p.id} — ${p.name}): ${p.move} Content grain (${p.topicId}): already. The rest of the explanation names why the analog's turn is the key and why the concession is bait.`;
    const out = decorateExplanation({
      explanation: existing,
      skillTag: p.id,
      conceptId: p.topicId,
      conceptName: p.topicId,
    });
    expect(out.explanation.match(/Pattern \(/g)?.length).toBe(1);
  });

  it("picks a contrast pattern from another family when possible", () => {
    const id = PATTERNS[0].id;
    const contrast = contrastPatternId(id);
    expect(contrast).not.toBe(id);
    const a = PATTERNS.find((p) => p.id === id);
    const b = PATTERNS.find((p) => p.id === contrast);
    expect(a && b && a.family !== b.family).toBe(true);
  });
});
