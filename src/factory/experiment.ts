import { assembleItem, hashStr, round2 } from "./item";
import type { FactoryPassage, TopicNode } from "./types";

const RFD = ["GAMSAT.S3.rfd.t1", "GAMSAT.S3.rfd.t3", "GAMSAT.S3.rfd.t6", "GAMSAT.S3.rfd.t8"] as const;

export function experimentPassage(topic: TopicNode, index: number): FactoryPassage {
  const km = [0.25, 0.5, 1, 2][index % 4];
  const vmax = [20, 40, 80][index % 3];
  const s1 = km;
  const s2 = km * 4;
  const v1 = vmax / 2;
  const v2 = round2((vmax * s2) / (km + s2));
  const title = `Initial-rate table ${index} (${topic.name})`;
  const body =
    `Investigators assay a catalyst relevant to ${topic.name}. ` +
    `Initial rates at 25 °C are recorded in Table 1. ` +
    `Assume Michaelis–Menten behaviour unless a row names an inhibitor. ` +
    `A second tube includes 2.0 μM compound X; that row is listed separately.\n\n` +
    `Table 1. Apparent kinetics\n` +
    `| Condition | [S] (mM) | v (μM s^{-1}) |\n` +
    `| Uninhibited | ${s1} | ${v1} |\n` +
    `| Uninhibited | ${s2} | ${v2} |\n` +
    `| + Compound X | ${s1} | ${round2(v1 / 2)} |\n\n` +
    `The uninhibited pair is consistent with Km = ${km} mM and Vmax = ${vmax} μM s^{-1}. ` +
    `Compound X halves v at [S] = Km without a second saturating row in this table.`;

  const q1 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `Using Table ${index}, the uninhibited velocity at [S] = Km is`,
    correct: `${v1} μM s^{-1}, which is Vmax/2`,
    distractors: [
      { text: `${vmax} μM s^{-1}, because any listed [S] is saturating`, why: "Saturating is [S] >> Km, not [S] = Km." },
      { text: `${v2} μM s^{-1}, the higher-[S] row regardless of Km`, why: "That row is 4 Km, not Km." },
      { text: `${km} μM s^{-1}, reading Km as a rate`, why: "Km is a concentration." },
    ],
    explanation:
      `By definition v = Vmax/2 at [S] = Km. The table’s first uninhibited row is that point: ${v1} μM s^{-1} with Vmax ${vmax}. ` +
      `The 4 Km row is closer to Vmax (${v2}) but is not the Km condition. Compound X is a different row. Index ${index}.`,
    difficulty: 0.4,
    rotate: hashStr(topic.id + "q1" + String(index)) % 4,
    design: "experiment.MM-read",
    skillTag: topic.id.startsWith("GAMSAT.S3") ? RFD[index % RFD.length] : undefined,
    salt: `${topic.id}#${index}a`,
  });

  const q2 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `In Table ${index}, the uninhibited row at [S] = 4 Km is closest to`,
    correct: `${v2} μM s^{-1} ≈ 0.80 Vmax for this 4:1 ratio`,
    distractors: [
      { text: `${v1} μM s^{-1}`, why: "That is the Km row." },
      { text: `0 μM s^{-1}`, why: "High substrate does not stop the enzyme." },
      { text: `${vmax * 2} μM s^{-1}`, why: "Velocity cannot exceed Vmax in MM kinetics." },
    ],
    explanation:
      `v/Vmax = [S]/(Km+[S]) = 4/5 = 0.80, so v = ${v2} μM s^{-1}. The Km row is half Vmax, not this row. MM velocity never exceeds Vmax. Seed ${index}.`,
    difficulty: 0.5,
    rotate: hashStr(topic.id + "q2" + String(index)) % 4,
    design: "experiment.MM-4km",
    skillTag: topic.id.startsWith("GAMSAT.S3") ? RFD[(index + 1) % RFD.length] : undefined,
    salt: `${topic.id}#${index}b`,
  });

  const q3 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `In Table ${index}, Compound X halves velocity at [S] = Km. The most cautious reading from this table alone is`,
    correct: `X lowers apparent rate at that [S]; inhibitor class is under-determined without a saturating row`,
    distractors: [
      { text: `X is definitely competitive because only Km rows exist`, why: "Competitive diagnosis needs a Vmax row." },
      { text: `X is an uncoupler of oxidative phosphorylation`, why: "No ETC measurement is in the table." },
      { text: `X doubles Vmax`, why: "The measured v fell, not rose." },
    ],
    explanation:
      `One inhibited velocity at a single [S] cannot assign competitive vs noncompetitive vs uncompetitive. ` +
      `That is a methods/data grain: do not over-claim. Uncoupling and doubled Vmax are not in the table. Passage ${index} on ${topic.name}.`,
    difficulty: 0.55,
    rotate: hashStr(topic.id + "q3" + String(index)) % 4,
    design: "experiment.methods-limit",
    salt: `${topic.id}#${index}c`,
  });

  const q4 = assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem: `Table ${index} is attached to ${topic.name}. Which use of the data actually tests that grain rather than a generic arithmetic flex?`,
    correct: `${topic.name}: ${topic.description} — using the numbers as a cover story for that node`,
    distractors: [
      { text: `Ignore the topic tag and treat every table as organic chemistry named reactions`, why: "Untagged content is rejected in this bank; the node matters." },
      { text: `Memorise the table and reread it instead of answering`, why: "NORTH STAR: studying is retrieval, not rereading." },
      { text: `Assume the inhibitor class without the missing saturating row`, why: "That is the over-claim the previous item blocked." },
    ],
    explanation:
      `Score-max design: experimental numbers train reasoning-from-data while remaining tagged to ${topic.name}. ` +
      `The table is not an excuse to untether from the outline or to reread. Index ${index} changes Km/Vmax so FSRS cannot memorise one card.`,
    difficulty: 0.48,
    rotate: hashStr(topic.id + "q4" + String(index)) % 4,
    design: "experiment.tag-discipline",
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
