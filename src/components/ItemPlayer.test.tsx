/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ItemPlayer, type PlayerItem } from "./ItemPlayer";

afterEach(() => {
  cleanup();
});

const item: PlayerItem = {
  id: "item-1",
  type: "discrete",
  stem: "A peptide of only D-amino acids is incubated with a mammalian protease. What happens?",
  conceptId: "MCAT.FC1.1A.t1",
  passage: null,
  choices: [
    { key: "A", text: "3" },
    { key: "B", text: "4" },
    { key: "C", text: "5" },
    { key: "D", text: "6" },
  ],
};

describe("ItemPlayer hunt banner", () => {
  it("names a hunted node before answer", () => {
    render(
      <ItemPlayer
        item={{ ...item, hunting: true }}
        position={0}
        remaining={1}
        total={1}
        onGrade={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("hunt-banner")).toHaveTextContent(/hunting this node/i);
    expect(screen.getByTestId("leave-session")).toHaveAttribute("href", "/");
  });

  it("names a returning miss without leaking the error class", () => {
    render(
      <ItemPlayer
        item={{ ...item, hunting: true, priorMisses: 2 }}
        position={0}
        remaining={1}
        total={1}
        onGrade={vi.fn()}
        onCommit={vi.fn()}
      />,
    );
    expect(screen.getByTestId("prior-miss-banner")).toHaveTextContent(
      /missed this item 2 times before/i,
    );
    expect(screen.queryByTestId("hunt-banner")).toBeNull();
    expect(screen.queryByText(/trap/i)).toBeNull();
  });
});

describe("ItemPlayer confidence-before-reveal gate", () => {
  it("cannot submit without confidence", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();
    const onCommit = vi.fn();
    render(
      <ItemPlayer
        item={item}
        position={0}
        remaining={1}
        total={1}
        onGrade={onGrade}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByTestId("choice-A"));
    const submit = screen.getByTestId("submit-answer");
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(onGrade).not.toHaveBeenCalled();
    expect(screen.queryByTestId("reveal-verdict")).toBeNull();
  });

  it("cannot proceed after a miss without an error class", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn().mockResolvedValue({
      correct: false,
      correctKey: "B",
      explanation: "Four.",
      distractorRationales: { A: "too small" },
    });
    const onCommit = vi.fn();
    render(
      <ItemPlayer
        item={item}
        position={0}
        remaining={1}
        total={1}
        onGrade={onGrade}
        onCommit={onCommit}
      />,
    );
    await user.click(screen.getByTestId("choice-A"));
    await user.click(screen.getByTestId("confidence-3"));
    await user.click(screen.getByTestId("submit-answer"));
    expect(await screen.findByTestId("reveal-verdict")).toHaveTextContent(
      "Incorrect",
    );
    const next = screen.getByTestId("next-item");
    expect(next).toBeDisabled();
    await user.click(next);
    expect(onCommit).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("error-content_gap"));
    expect(next).not.toBeDisabled();
    expect(screen.queryByTestId("calibration-note")).toBeNull();
  });

  it("shows pattern name and move only after reveal", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn().mockResolvedValue({
      correct: true,
      correctKey: "B",
      explanation: "Pattern (PAT.CARS.main_point — Main point vs local colour): The key restates the passage's governing claim. Content grain (MCAT.CARS.FND.t1): Foundations.",
      distractorRationales: { A: "too small" },
      pattern: {
        id: "PAT.CARS.main_point",
        name: "Main point vs local colour",
        move: "The key restates the passage's governing claim, not a vivid detail or a tone word.",
      },
    });
    render(
      <ItemPlayer
        item={item}
        position={0}
        remaining={1}
        total={1}
        onGrade={onGrade}
        onCommit={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("pattern-reveal")).toBeNull();
    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("confidence-3"));
    await user.click(screen.getByTestId("submit-answer"));
    expect(await screen.findByTestId("pattern-reveal")).toHaveTextContent(
      /main point vs local colour/i,
    );
    expect(screen.getByTestId("pattern-reveal")).toHaveTextContent(/governing claim/i);
    expect(screen.getByTestId("reveal-explanation")).toHaveTextContent(/Content grain/);
  });

  it("names overconfidence on a high-confidence miss", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn().mockResolvedValue({
      correct: false,
      correctKey: "B",
      explanation: "Four.",
      distractorRationales: { A: "too small" },
    });
    render(
      <ItemPlayer
        item={item}
        position={0}
        remaining={1}
        total={1}
        onGrade={onGrade}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("choice-A"));
    await user.click(screen.getByTestId("confidence-5"));
    await user.click(screen.getByTestId("submit-answer"));
    expect(await screen.findByTestId("calibration-note")).toHaveTextContent(
      /confidence and accuracy need to be the same number/i,
    );
  });

  it("names underconfidence on a low-confidence hit", async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn().mockResolvedValue({
      correct: true,
      correctKey: "B",
      explanation: "Four.",
      distractorRationales: { A: "too small" },
    });
    render(
      <ItemPlayer
        item={item}
        position={0}
        remaining={1}
        total={1}
        onGrade={onGrade}
        onCommit={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("choice-B"));
    await user.click(screen.getByTestId("confidence-1"));
    await user.click(screen.getByTestId("submit-answer"));
    expect(await screen.findByTestId("calibration-note")).toHaveTextContent(
      /low rating brings this card back sooner/i,
    );
  });
});
