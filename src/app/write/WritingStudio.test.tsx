/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WritingStudio } from "@/app/write/page";
import { taskFor } from "@/write/prompts";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
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

  it("autosaves the draft locally and names time-up without wiping it", async () => {
    vi.useFakeTimers();
    render(<WritingStudio />);
    const packA = taskFor("A");
    const area = screen.getByPlaceholderText(/write here/i);
    fireEvent.change(area, { target: { value: "A comment on progress." } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(window.localStorage.getItem(`gamsat-s2-A-${packA.id}`)).toContain("progress");
    fireEvent.click(screen.getByTestId("write-timer-toggle"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
    });
    expect(screen.getByTestId("write-times-up")).toHaveTextContent(/official s2 would have stopped/i);
    expect(screen.getByTestId("write-timer")).toHaveTextContent("0:00");
    expect(area).toHaveValue("A comment on progress.");
  });
});
