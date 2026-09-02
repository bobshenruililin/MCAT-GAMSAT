import type { SectionFamily } from "@/engine/sectionBudget";

/**
 * First-principles past-paper moves. Official papers are the only percentile
 * truth; these are original analogs of the *moves*, never cloned stems.
 * skill_tag on items uses `id`.
 *
 * exampleConclusion / exampleWrong are the answer key and traps for the
 * mini-item in exampleSetup — written as exam options, not item-writer notes.
 */
export type ExamPattern = {
  id: string;
  family: SectionFamily;
  name: string;
  move: string;
  topicId: string;
  exampleSetup: string;
  exampleConclusion: string;
  exampleWrong: [string, string, string];
};

export const PATTERNS: ExamPattern[] = [
  {
    id: "PAT.CARS.main_point",
    family: "MCAT CARS",
    name: "Main point vs local colour",
    move: "The key restates the passage's governing claim, not a vivid detail or a tone word.",
    topicId: "MCAT.CARS.FND.t1",
    exampleSetup:
      "A historian argues that archive catalogs are political because they decide which lives are searchable. She spends a paragraph on a torn shipping label.",
    exampleConclusion:
      "Catalogs are political because they decide which lives are searchable.",
    exampleWrong: [
      "The torn shipping label is the author’s main point.",
      "The passage is primarily a biography of the historian.",
      "Catalogs cannot affect whose lives are searchable.",
    ],
  },
  {
    id: "PAT.CARS.concession_turn",
    family: "MCAT CARS",
    name: "Concession then turn",
    move: "A yes-but structure: the author grants X, then the live claim is the clause after but/yet/still.",
    topicId: "MCAT.CARS.FND.t2",
    exampleSetup:
      "A critic writes that the mural is technically dazzling, yet it treats the neighbourhood as scenery.",
    exampleConclusion:
      "The author’s live claim is that the mural treats the neighbourhood as scenery.",
    exampleWrong: [
      "The author mainly praises the mural’s technique.",
      "The author denies that the mural exists.",
      "The author wants every mural banned.",
    ],
  },
  {
    id: "PAT.CARS.weaken",
    family: "MCAT CARS",
    name: "Weaken the support, not the topic",
    move: "A weakener severs the author's link from evidence to claim; a topic-changer is not a weakener.",
    topicId: "MCAT.CARS.RBT.t1",
    exampleSetup:
      "An essay infers civic virtue from one town's high voter turnout.",
    exampleConclusion:
      "Evidence that turnout there is mandatory would weaken the inference from turnout to civic virtue.",
    exampleWrong: [
      "A remark about the town’s weather would weaken the civic-virtue claim.",
      "Civic virtue cannot be discussed in an essay.",
      "High turnout already proves the author’s claim beyond challenge.",
    ],
  },
  {
    id: "PAT.CARS.analogy",
    family: "MCAT CARS",
    name: "Map the relation, not the nouns",
    move: "An analogy item keeps the relation (A is to B as C is to D) and swaps the domain.",
    topicId: "MCAT.CARS.RWT.t2",
    exampleSetup:
      "The author compares a footnote to a trapdoor: optional, easy to miss, load-bearing.",
    exampleConclusion:
      "The shared relation is optional but structural, not a claim that footnotes are doors.",
    exampleWrong: [
      "Footnotes are literally doors.",
      "Trapdoors cannot bear load, so the comparison fails.",
      "The author is mainly describing carpentry.",
    ],
  },
  {
    id: "PAT.CP.setup_equation",
    family: "MCAT C/P",
    name: "Setup, then substitute",
    move: "Name the relation first (Newton, energy, ideal gas), then plug the given numbers; skipping setup invites a unit trap.",
    topicId: "MCAT.FC4.4B.t1",
    exampleSetup:
      "A 2 kg block is pulled with 10 N on a frictionless rail; find acceleration.",
    exampleConclusion: "Acceleration is F/m = 5 m/s².",
    exampleWrong: [
      "Acceleration is 10 × 2 = 20 m/s².",
      "Acceleration is 10 m/s², ignoring mass.",
      "Acceleration is 2 m/s², ignoring force.",
    ],
  },
  {
    id: "PAT.CP.limiting_case",
    family: "MCAT C/P",
    name: "Limiting-case check",
    move: "If a parameter goes to 0 or infinity, the formula must still make physical sense; the option that blows up wrongly is the trap.",
    topicId: "MCAT.FC5.5B.t1",
    exampleSetup:
      "Resistance of two parallel resistors as R2 → ∞.",
    exampleConclusion: "As R2 → ∞, Req → R1.",
    exampleWrong: [
      "Req → 0 Ω, as if the open branch were a short.",
      "Req → ∞ Ω, as if both branches opened.",
      "Req → 2 R1, adding the resistors as if they were in series.",
    ],
  },
  {
    id: "PAT.BB.control",
    family: "MCAT B/B",
    name: "Name the control",
    move: "The control is the condition that isolates the claimed variable; more reagents is not automatically a better control.",
    topicId: "MCAT.FC1.1A.t1",
    exampleSetup:
      "An enzyme assay adds inhibitor in one tube and buffer in the other, same substrate.",
    exampleConclusion:
      "The buffer tube is the control that isolates the inhibitor.",
    exampleWrong: [
      "A third tube with extra substrate is the better control.",
      "The inhibitor tube is the control because it contains more reagents.",
      "Enzyme assays cannot have controls.",
    ],
  },
  {
    id: "PAT.BB.if_then",
    family: "MCAT B/B",
    name: "Pathway if-then",
    move: "If step X is blocked, intermediates before X rise and products after X fall.",
    topicId: "MCAT.FC1.1D.t3",
    exampleSetup:
      "A pathway A→B→C is blocked at B→C.",
    exampleConclusion: "B accumulates and C falls.",
    exampleWrong: [
      "A must disappear.",
      "C accumulates upstream of the block.",
      "Every metabolite stays fixed.",
    ],
  },
  {
    id: "PAT.PS.confound",
    family: "MCAT P/S",
    name: "Confound vs construct",
    move: "A confound covaries with the claimed cause; restating the construct in fancier words is not a confound.",
    topicId: "MCAT.FC6.6C.t1",
    exampleSetup:
      "A lab claims a drug raises alertness after testing only at 8 a.m. on coffee-drinkers.",
    exampleConclusion:
      "Caffeine and time of day covary with the claimed drug effect.",
    exampleWrong: [
      "Alertness is just wakefulness restated.",
      "Pills never work.",
      "The lab needed a longer questionnaire, not a design fix.",
    ],
  },
  {
    id: "PAT.PS.operdef",
    family: "MCAT P/S",
    name: "Operational definition",
    move: "The operational definition is how the study measured the construct, not the everyday synonym.",
    topicId: "MCAT.FC9.9B.t1",
    exampleSetup:
      "Stress was scored as salivary cortisol at 09:00.",
    exampleConclusion:
      "The operational definition is the 09:00 salivary cortisol assay.",
    exampleWrong: [
      "Stress means feeling overwhelmed.",
      "Stress is a Freudian construct and cannot be measured.",
      "Stress is the opposite of relaxation, so no assay is needed.",
    ],
  },
  {
    id: "PAT.S1.competing",
    family: "GAMSAT S1",
    name: "Competing arguments",
    move: "Two voices can share a topic and split on the criterion of judgment; the key names that split.",
    topicId: "GAMSAT.S1.argument.t3",
    exampleSetup:
      "A letter praises a ferry for punctuality; a poem treats the same ferry as a floating waiting room.",
    exampleConclusion:
      "The texts split on clock-time versus lived delay, not on whether boats exist.",
    exampleWrong: [
      "Both texts deny that ferries exist.",
      "The letter is objectively true and the poem is false.",
      "Punctuality and waiting are the same criterion.",
    ],
  },
  {
    id: "PAT.S1.tone",
    family: "GAMSAT S1",
    name: "Tone without plot recap",
    move: "Tone is the speaker's stance toward the subject; a plot summary is not a tone.",
    topicId: "GAMSAT.S1.tone.t1",
    exampleSetup:
      "A narrator lists inherited coats with inventory calm, then calls one of them a borrowed life.",
    exampleConclusion:
      "The tone turns from cataloguing to moral unease.",
    exampleWrong: [
      "Someone inherited several coats.",
      "The narrator is literally a shopkeeper.",
      "The piece has no stance, only objects.",
    ],
  },
  {
    id: "PAT.S2.throughline",
    family: "GAMSAT S2",
    name: "One throughline",
    move: "A Task A/B piece needs one governing claim the examples serve; a quote collage is not a throughline.",
    topicId: "GAMSAT.S2.craft.t1",
    exampleSetup:
      "A draft quotes four prompt lines and never says what they jointly imply.",
    exampleConclusion:
      "The defect is a missing governing claim that the quoted lines would serve.",
    exampleWrong: [
      "The defect is missing adjectives.",
      "The defect is quoting the prompt at all.",
      "The defect is writing in English.",
    ],
  },
  {
    id: "PAT.S3.table",
    family: "GAMSAT S3",
    name: "Read the table before the story",
    move: "The numbers in the table constrain the key; a plausible mechanism that contradicts the table is wrong.",
    topicId: "GAMSAT.S3.phys.t26",
    exampleSetup:
      "A table shows frequency doubling while amplitude stays fixed.",
    exampleConclusion:
      "Any claim that requires amplitude to have changed is forbidden by the table.",
    exampleWrong: [
      "Frequency cannot double in any table.",
      "Amplitude must have changed if frequency changed.",
      "The table cannot constrain a mechanism.",
    ],
  },
  {
    id: "PAT.S3.proportion",
    family: "GAMSAT S3",
    name: "Proportional reasoning",
    move: "If y ∝ x, doubling x doubles y; if y ∝ 1/x, doubling x halves y. Mixed units are the usual trap.",
    topicId: "GAMSAT.S3.chem.t1",
    exampleSetup:
      "Concentration doubles at constant volume; moles?",
    exampleConclusion: "Moles of solute double, because n = cV and V is fixed.",
    exampleWrong: [
      "Moles stay fixed, as if concentration were independent of n.",
      "Moles halve, inverting the proportion.",
      "Moles quadruple, mixing a square law into a direct proportion.",
    ],
  },
  {
    id: "PAT.S3.control_s3",
    family: "GAMSAT S3",
    name: "Experimenter move",
    move: "The next measurement should discriminate two remaining hypotheses, not re-measure a settled column.",
    topicId: "GAMSAT.S3.bio.t1",
    exampleSetup:
      "Two models predict different pH optima for the same enzyme.",
    exampleConclusion:
      "Measure activity across a pH range that can separate the two predicted optima.",
    exampleWrong: [
      "Run a third identical replicate at the same single pH.",
      "Change the enzyme’s name in the lab book.",
      "Stop; one pH point already decides both models.",
    ],
  },
  {
    id: "PAT.CARS.except",
    family: "MCAT CARS",
    name: "EXCEPT / LEAST",
    move: "The keyed option is the one the passage does not support; three true supports are distractors.",
    topicId: "MCAT.CARS.RWT.t4",
    exampleSetup:
      "A passage supports claims 1, 2, and 3 about a law; claim 4 is the author's joke.",
    exampleConclusion:
      "The author’s joke is the statement the passage does not support.",
    exampleWrong: [
      "Claim 1 is unsupported.",
      "Claim 2 is unsupported.",
      "A joke cannot appear in a CARS passage.",
    ],
  },
  {
    id: "PAT.CP.units",
    family: "MCAT C/P",
    name: "Unit trap",
    move: "Convert to SI (or the formula's native unit) before arithmetic; mixing cm and m is the designed miss.",
    topicId: "MCAT.FC4.4A.t1",
    exampleSetup:
      "A 50 cm string, formula wants metres, frequency from v/(2L).",
    exampleConclusion: "Convert 50 cm to 0.50 m before using v/(2L).",
    exampleWrong: [
      "Use L = 50 in v/(2L).",
      "Drop L from the formula.",
      "Multiply v by L instead of dividing.",
    ],
  },
];

export const PATTERN_BY_ID: Record<string, ExamPattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.id, p]),
);

export function isPatternTag(tag: string | null | undefined): boolean {
  return typeof tag === "string" && tag.startsWith("PAT.");
}

export function patternById(id: string | null | undefined): ExamPattern | null {
  if (!id) return null;
  return PATTERN_BY_ID[id] ?? null;
}
