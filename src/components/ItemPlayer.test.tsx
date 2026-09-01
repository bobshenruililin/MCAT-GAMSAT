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
  stem: "[PLACEHOLDER] What is 2+2?",
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
    expect(screen.queryByTestId("hunt-banner")).not.toBeNull();
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
  });
});
