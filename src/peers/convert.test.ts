import { describe, expect, it } from "vitest";
import { wordCount } from "@/ingest/validate";
import { loadTopics } from "./assign";
import { convertOpenMcat, convertOpenmcat, emptySeen, seedAssigner } from "./convert";
import { AAMC_CATEGORY, OPENMCAT_TOPIC } from "./maps";
import { padExplanation, stripHtml } from "./text";

describe("peer mapping", () => {
  it("maps every AAMC 1A–10A code onto a taxonomy prefix", () => {
    const topics = loadTopics();
    const ids = new Set(topics.map((t) => t.id));
    for (const [code, prefix] of Object.entries(AAMC_CATEGORY)) {
      if (code === "HUM" || code === "SS" || code === "CARS") {
        expect(topics.some((t) => t.id.startsWith("MCAT.CARS."))).toBe(true);
        continue;
      }
      expect(
        topics.some((t) => t.id.startsWith(`${prefix}.`) && ids.has(t.id)),
        prefix,
      ).toBe(true);
    }
  });

  it("maps every OpenMCAT testedTopicId onto a live topic", () => {
    const ids = new Set(loadTopics().map((t) => t.id));
    for (const [peer, ours] of Object.entries(OPENMCAT_TOPIC)) {
      expect(ids.has(ours), peer).toBe(true);
    }
  });

  it("strips HTML and pads explanations to 40 words", () => {
    expect(stripHtml("Which cue is the patient <b>unable</b> to use?")).toBe(
      "Which cue is the patient unable to use?",
    );
    expect(wordCount(padExplanation(["Short."], "Source: test."))).toBeGreaterThanOrEqual(40);
  });

  it("converts a 4-choice Open-MCAT row onto 1A", () => {
    const assign = seedAssigner(loadTopics(), new Map());
    const bank = convertOpenMcat(
      [
        {
          stem: "Which groups bond to the alpha carbon of a standard amino acid?",
          choices: ["amino, carboxyl, H, R", "two R groups", "phosphate backbone", "only hydroxyls"],
          answerIndex: 0,
          rationale:
            "Every standard amino acid has an amino group, a carboxyl group, a hydrogen, and an R group on Cα. That is the shared core of the 20 encoded residues.",
          why: ["keyed", "two R groups is not the backbone", "phosphate is nucleic acid", "hydroxyl is serine only as R"],
          takeaway: "Draw the tetrahedral Cα.",
          categoryCode: "1A",
          idea: "Amino acid structure",
          tag: "recall",
        },
      ],
      assign,
      emptySeen(),
    );
    expect(bank.items).toHaveLength(1);
    expect(bank.items[0]?.concept_id).toMatch(/^MCAT\.FC1\.1A\.t/);
    expect(wordCount(String(bank.items[0]?.explanation))).toBeGreaterThanOrEqual(40);
  });

  it("tags OpenMCAT SIRS and cp_work", () => {
    const assign = seedAssigner(loadTopics(), new Map());
    const bank = convertOpenmcat(
      {
        passages: [],
        questions: [
          {
            stem: "A 4 kg cart is pushed 3 m up a 30 degree ramp at constant speed against 5 N friction. Work by the push?",
            choices: [
              { id: "A", text: "15 J" },
              { id: "B", text: "59 J" },
              { id: "C", text: "74 J" },
              { id: "D", text: "118 J" },
            ],
            correctChoiceId: "C",
            explanation:
              "At constant speed the push balances mgh plus friction work. Height is 1.5 m so mgh is 58.8 J and friction is 15 J, total about 74 J.",
            choiceExplanations: {
              A: "friction only",
              B: "gravity only",
              C: "sum",
              D: "used ramp length as height",
            },
            testedTopicIds: ["cp_work"],
            testedSkillIds: ["sirs_2"],
            estimatedDifficulty: "medium",
          },
        ],
      },
      assign,
      emptySeen(),
    );
    expect(bank.items[0]?.concept_id).toBe("MCAT.FC4.4A.t4");
    expect(bank.items[0]?.skill_tag).toBe("SIRS2");
    expect(bank.items[0]?.correct_key).toBe("C");
    expect(
      Object.keys(bank.items[0]?.distractor_rationales as Record<string, string>).sort(),
    ).toEqual(["A", "B", "D"]);
  });
});
