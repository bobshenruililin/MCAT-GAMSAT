/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FamilyPath } from "./FamilyPath";

afterEach(() => {
  cleanup();
});

describe("FamilyPath", () => {
  it("renders seven exam-family orbs from coverage, not a new taxonomy", () => {
    render(
      <FamilyPath
        currentId="MCAT.CARS.FND.t1"
        coverage={[
          { family: "MCAT CARS", topics: 10, withItems: 10, attempted: 2 },
          { family: "MCAT B/B", topics: 10, withItems: 10, attempted: 0 },
          { family: "MCAT C/P", topics: 10, withItems: 10, attempted: 0 },
          { family: "MCAT P/S", topics: 10, withItems: 10, attempted: 0 },
          { family: "GAMSAT S1", topics: 10, withItems: 10, attempted: 0 },
          { family: "GAMSAT S2", topics: 10, withItems: 10, attempted: 0 },
          { family: "GAMSAT S3", topics: 10, withItems: 10, attempted: 0 },
        ]}
      />,
    );
    expect(screen.getByTestId("family-path").querySelectorAll("li")).toHaveLength(7);
    expect(screen.getByTestId("family-orb-MCAT CARS")).toHaveTextContent("CARS");
    expect(screen.getByTestId("family-orb-GAMSAT S3")).toHaveTextContent("S3");
  });
});
