/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { WritingStudio } from "@/app/write/page";
import { taskFor } from "@/write/prompts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("WritingStudio", () => {
  it("shows today's Task A pack and switches to Task B", async () => {
    const user = userEvent.setup();
    render(<WritingStudio />);
    const packA = taskFor("A");
    expect(screen.getByTestId("prompt-pack")).toHaveTextContent(packA.id);
    expect(screen.getByTestId("write-timer")).toHaveTextContent("30:00");
    expect(screen.getByText(packA.quotes[0])).toBeInTheDocument();
    await user.click(screen.getByTestId("task-b"));
    const packB = taskFor("B");
    expect(screen.getByTestId("prompt-pack")).toHaveTextContent(packB.id);
    expect(screen.getByText(packB.quotes[0])).toBeInTheDocument();
  });
});
