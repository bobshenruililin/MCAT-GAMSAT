import { assembleItem, hashStr, round2 } from "./item";
import type { FactoryPassage, TopicNode } from "./types";

const RFD = ["GAMSAT.S3.rfd.t1", "GAMSAT.S3.rfd.t3", "GAMSAT.S3.rfd.t6", "GAMSAT.S3.rfd.t8"] as const;

export function isKineticsTopic(id: string): boolean {
  return (
    id.startsWith("MCAT.FC1.1A.t4") ||
    id.startsWith("MCAT.FC1.1A.t5") ||
    id.startsWith("MCAT.FC5") ||
    id.startsWith("GAMSAT.S3.chem") ||
    id.startsWith("GAMSAT.S3.bio")
  );
}

export function experimentPassage(topic: TopicNode, index: number): FactoryPassage {
  const km = [0.25, 0.5, 1, 2][index % 4];
  const vmax = [20, 40, 80][index % 3];
  const s1 = km;
  const s2 = km * 4;
  const v1 = vmax / 2;
  const v2 = round2((vmax * s2) / (km + s2));
  const sample = `Sample ${index + 1}`;
  const title = `Initial-rate assay (${sample})`;
  const body =
    `Investigators assay a catalyst. ` +
    `Initial rates at 25 °C are recorded in Table 1. ` +
    `Assume Michaelis–Menten behaviour unless a row names an inhibitor. ` +
    `A second tube includes 2.0 μM compound X; that row is listed separately.\n\n` +
    `Table 1. Apparent kinetics for ${sample}\n` +
    `| Condition | [S] (mM) | v (μM s^{-1}) |\n` +
    `| Uninhibited | ${s1} | ${v1} |\n` +
    `| Uninhibited | ${s2} | ${v2} |\n` +
    `| + Compound X | ${s1} | ${round2(v1 / 2)} |\n\n` +
    `The uninhibited pair is consistent with Km = ${km} mM and Vmax = ${vmax} μM s^{-1}. ` +
    `Compound X halves v at [S] = Km without a second saturating row in this table.`;

  const q1 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `Using Table 1 for ${sample}, the uninhibited velocity at [S] = Km is`,
    correct: `${v1} μM s^{-1}, which is Vmax/2`,
    distractors: [
      { text: `${vmax} μM s^{-1}, because any listed [S] is saturating`, why: "Saturating is [S] >> Km, not [S] = Km." },
      { text: `${v2} μM s^{-1}, the higher-[S] row regardless of Km`, why: "That row is 4 Km, not Km." },
      { text: `${km} μM s^{-1}, reading Km as a rate`, why: "Km is a concentration." },
    ],
    explanation:
      `By definition v = Vmax/2 at [S] = Km. The table’s first uninhibited row is that point: ${v1} μM s^{-1} with Vmax ${vmax}. ` +
      `The 4 Km row is closer to Vmax (${v2}) but is not the Km condition. Compound X is a different row.`,
    difficulty: 0.4,
    rotate: hashStr(topic.id + "q1" + String(index)) % 4,
    design: "experiment.MM-read",
    skillTag: topic.id.startsWith("GAMSAT.S3") ? RFD[index % RFD.length] : undefined,
    salt: `${topic.id}#${index}a`,
  });

  const q2 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `In Table 1 for ${sample}, the uninhibited row at [S] = 4 Km is closest to`,
    correct: `${v2} μM s^{-1} ≈ 0.80 Vmax for this 4:1 ratio`,
    distractors: [
      { text: `${v1} μM s^{-1}`, why: "That is the Km row." },
      { text: `0 μM s^{-1}`, why: "High substrate does not stop the enzyme." },
      { text: `${vmax * 2} μM s^{-1}`, why: "Velocity cannot exceed Vmax in MM kinetics." },
    ],
    explanation:
      `v/Vmax = [S]/(Km+[S]) = 4/5 = 0.80, so v = ${v2} μM s^{-1}. The Km row is half Vmax, not this row. MM velocity never exceeds Vmax.`,
    difficulty: 0.5,
    rotate: hashStr(topic.id + "q2" + String(index)) % 4,
    design: "experiment.MM-4km",
    skillTag: topic.id.startsWith("GAMSAT.S3") ? RFD[(index + 1) % RFD.length] : undefined,
    salt: `${topic.id}#${index}b`,
  });

  const q3 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `In Table 1 for ${sample}, Compound X halves velocity at [S] = Km. The most cautious reading from this table alone is`,
    correct: `X lowers apparent rate at that [S]; inhibitor class is under-determined without a saturating row`,
    distractors: [
      { text: `X is definitely competitive because only Km rows exist`, why: "Competitive diagnosis needs a Vmax row." },
      { text: `X is an uncoupler of oxidative phosphorylation`, why: "No ETC measurement is in the table." },
      { text: `X doubles Vmax`, why: "The measured v fell, not rose." },
    ],
    explanation:
      `One inhibited velocity at a single [S] cannot assign competitive vs noncompetitive vs uncompetitive. ` +
      `That is a methods/data grain: do not over-claim. Uncoupling and doubled Vmax are not in the table.`,
    difficulty: 0.55,
    rotate: hashStr(topic.id + "q3" + String(index)) % 4,
    design: "experiment.methods-limit",
    skillTag: topic.id.startsWith("GAMSAT.S3") ? RFD[(index + 2) % RFD.length] : undefined,
    salt: `${topic.id}#${index}c`,
  });

  const q4 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `For ${sample}, which additional measurement would best classify Compound X?`,
    correct: `An uninhibited and inhibited pair at [S] >> Km, to see whether Vmax falls`,
    distractors: [
      { text: `Repeating the Km row at a different temperature only`, why: "Temperature shifts both Km and Vmax; it does not isolate inhibitor class." },
      { text: `A single optical-density blank with no substrate`, why: "A blank does not compare inhibited vs uninhibited Vmax." },
      { text: `Counting how many times the word enzyme appears in the notebook`, why: "That is not a kinetic measurement." },
    ],
    explanation:
      `Competitive vs noncompetitive vs uncompetitive is settled by whether saturating substrate restores Vmax. ` +
      `The table already has a Km row; a high-[S] pair with and without X is the missing comparison. ` +
      `Temperature and blanks do not substitute for that row.`,
    difficulty: 0.48,
    rotate: hashStr(topic.id + "q4" + String(index)) % 4,
    design: "experiment.next-measurement",
    salt: `${topic.id}#${index}d`,
  });

  return {
    concept_id: topic.id,
    title,
    body,
    questions: [q1, q2, q3, q4],
    design: "experiment.table-4q",
  };
}
