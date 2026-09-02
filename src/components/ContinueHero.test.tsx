/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContinueHero } from "./ContinueHero";
import type { OpenSession } from "@/engine/sessionService";
import type { UpNextSkill } from "@/engine/upNext";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

const skill: UpNextSkill = {
  id: "MCAT.FC1.1A.t1",
  name: "Amino acids",
  mastery: 0.3,
  attempts: 0,
  examWeight: 0.01,
  level: "unseen",
  reason: "unseen",
  reasonText: "Unseen, high exam weight.",
};

const session: OpenSession = {
  id: "sess-1",
  kind: "daily",
  mode: "skill",
  track: null,
  startedAt: "2026-09-02T00:00:00.000Z",
  answered: 1,
  total: 4,
  remaining: 3,
};

describe("ContinueHero", () => {
  it("resumes an unfinished sitting as the one Continue", () => {
    render(
      <ContinueHero openSession={session} skill={skill} emptyBank={false} caughtUp={false} />,
    );
    const btn = screen.getByTestId("continue-session");
    expect(btn).toHaveAttribute("href", "/session/sess-1");
    expect(btn).toHaveTextContent(/Continue/);
    expect(screen.queryByTestId("start-skill")).toBeNull();
    expect(screen.queryByTestId("start-daily")).toBeNull();
  });

  it("starts the Up Next skill when nothing is open", () => {
    render(
      <ContinueHero openSession={null} skill={skill} emptyBank={false} caughtUp={false} />,
    );
    expect(screen.getByTestId("start-skill")).toHaveTextContent(/Continue/);
    expect(screen.getByTestId("start-skill")).toHaveTextContent(/Amino acids/);
    expect(screen.queryByTestId("continue-session")).toBeNull();
  });

  it("starts mixed retrieval when there is no skill and no sitting", () => {
    render(
      <ContinueHero openSession={null} skill={null} emptyBank={false} caughtUp={false} />,
    );
    expect(screen.getByTestId("start-daily")).toHaveTextContent(/Continue/);
  });
});
