import type { SectionFamily } from "@/engine/sectionBudget";

/**
 * First-principles past-paper moves. Official papers are the only percentile
 * truth; these are original analogs of the *moves*, never cloned stems.
 * skill_tag on items uses `id`.
 */
export type ExamPattern = {
  id: string;
  family: SectionFamily;
  name: string;
  move: string;
  topicId: string;
  exampleSetup: string;
  exampleConclusion: string;
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
      "The analog key is the catalog-as-politics claim, not the shipping label.",
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
      "The analog key is the scenery objection, not the dazzling praise.",
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
      "The analog weakener is evidence that turnout there is mandatory, not a remark about weather.",
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
      "The analog map is optional-but-structural, not 'footnotes are doors'.",
  },
  {
    id: "PAT.CP.setup_equation",
    family: "MCAT C/P",
    name: "Setup, then substitute",
    move: "Name the relation first (Newton, energy, ideal gas), then plug the given numbers; skipping setup invites a unit trap.",
    topicId: "MCAT.FC4.4B.t1",
    exampleSetup:
      "A 2 kg block is pulled with 10 N on a frictionless rail; find acceleration.",
    exampleConclusion:
      "The analog is a = F/m = 5 m/s², not 10×2.",
  },
  {
    id: "PAT.CP.limiting_case",
    family: "MCAT C/P",
    name: "Limiting-case check",
    move: "If a parameter goes to 0 or infinity, the formula must still make physical sense; the option that blows up wrongly is the trap.",
    topicId: "MCAT.FC5.5B.t1",
    exampleSetup:
      "Resistance of two parallel resistors as R2 → ∞.",
    exampleConclusion:
      "The analog limit is R_eq → R1, not 0 and not infinity.",
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
      "The analog control is the buffer tube, not a third tube with extra substrate.",
  },
  {
    id: "PAT.BB.if_then",
    family: "MCAT B/B",
    name: "Pathway if-then",
    move: "If step X is blocked, intermediates before X rise and products after X fall.",
    topicId: "MCAT.FC1.1D.t3",
    exampleSetup:
      "A pathway A→B→C is blocked at B→C.",
    exampleConclusion:
      "The analog is B accumulates, C drops — not A disappearing.",
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
      "The analog confound is caffeine/time of day, not 'alertness is wakefulness'.",
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
      "The analog operationalization is the cortisol assay, not 'feeling overwhelmed'.",
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
      "The analog split is clock-time vs lived delay, not whether boats exist.",
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
      "The analog tone turns from cataloguing to moral unease.",
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
      "The analog defect is missing throughline, not missing adjectives.",
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
      "The analog forbids any option that requires amplitude change.",
  },
  {
    id: "PAT.S3.proportion",
    family: "GAMSAT S3",
    name: "Proportional reasoning",
    move: "If y ∝ x, doubling x doubles y; if y ∝ 1/x, doubling x halves y. Mixed units are the usual trap.",
    topicId: "GAMSAT.S3.chem.t1",
    exampleSetup:
      "Concentration doubles at constant volume; moles?",
    exampleConclusion:
      "The analog is moles double, not stay fixed.",
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
      "The analog next step is an activity-vs-pH curve, not a third identical replicate at one pH.",
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
      "The analog EXCEPT key is the joke, not one of the supported claims.",
  },
  {
    id: "PAT.CP.units",
    family: "MCAT C/P",
    name: "Unit trap",
    move: "Convert to SI (or the formula's native unit) before arithmetic; mixing cm and m is the designed miss.",
    topicId: "MCAT.FC4.4A.t1",
    exampleSetup:
      "A 50 cm string, formula wants metres, frequency from v/(2L).",
    exampleConclusion:
      "The analog uses L = 0.50 m, not 50.",
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
