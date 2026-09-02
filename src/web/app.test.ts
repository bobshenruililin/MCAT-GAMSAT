/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { mountApp } from "./app";
import { memoryStorage } from "./ledger";
import type { WebBank, WebItem } from "./types";

function item(id: string, conceptId: string, family: WebItem["family"]): WebItem {
  return {
    id,
    conceptId,
    family,
    type: "discrete",
    stem: `Stem for ${id}`,
    choices: [
      { key: "A", text: "right" },
      { key: "B", text: "wrong b" },
      { key: "C", text: "wrong c" },
      { key: "D", text: "wrong d" },
    ],
    correctKey: "A",
    explanation: `Key A for ${id}`,
    distractorRationales: { B: "no", C: "no", D: "no" },
    difficultyEst: 0.4,
    examWeight: 0.02,
    passage: null,
    verified: false,
  };
}

const bank: WebBank = {
  version: 1,
  generatedAt: "2026-09-02T00:00:00.000Z",
  itemCount: 3,
  items: [
    item("cars-1", "MCAT.CARS.t1", "MCAT CARS"),
    item("bb-1", "MCAT.FC1.1A.t1", "MCAT B/B"),
    item("cp-1", "MCAT.FC5.5A.t1", "MCAT C/P"),
  ],
};

function click(testId: string): void {
  const node = document.querySelector(`[data-testid="${testId}"]`);
  if (!(node instanceof HTMLElement)) throw new Error(`missing ${testId}`);
  node.click();
}

describe("website player", () => {
  afterEach(() => {
    window.location.hash = "";
    document.body.innerHTML = "";
  });

  it("Continue starts a sitting and refuses reveal without confidence", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const mounted = mountApp(root, { bank, storage: memoryStorage() });
    expect(root.querySelector("[data-testid=continue]")?.textContent).toMatch(/Continue/);
    click("continue");
    expect(window.location.hash).toBe("#/sit");
    expect(root.querySelector("h1.stem")?.textContent).toMatch(/Stem for/);
    click("choice-A");
    const submit = root.querySelector("[data-testid=submit-answer]");
    expect(submit).toBeInstanceOf(HTMLButtonElement);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    click("submit-answer");
    expect(root.querySelector("[data-testid=reveal-verdict]")).toBeNull();
    click("confidence-5");
    click("submit-answer");
    expect(root.querySelector("[data-testid=reveal-verdict]")?.textContent).toMatch(/Correct/);
    click("next-item");
    mounted.destroy();
  });

  it("family orb starts that family's sitting", () => {
    const root = document.createElement("div");
    document.body.appendChild(root);
    const mounted = mountApp(root, { bank, storage: memoryStorage() });
    click("family-orb-MCAT CARS");
    expect(window.location.hash).toBe("#/sit");
    expect(root.querySelector("h1.stem")?.textContent).toBe("Stem for cars-1");
    mounted.destroy();
  });
});
