import type { ExamPattern } from "./catalog";

export type ApplyBuilt = {
  question: string;
  correct: string;
  distractors: [string, string, string];
  why: [string, string, string];
  close: string;
};

function pick<T>(arr: readonly T[], index: number): T {
  return arr[index % arr.length];
}

/**
 * New instance of the same exam move. The catalog analog stays in the stem
 * as scaffolding; this is the item that must be scored.
 */
export function buildApply(p: ExamPattern, index: number, rung: number): ApplyBuilt {
  switch (p.id) {
    case "PAT.CARS.main_point":
      return carsMainPoint(index, rung);
    case "PAT.CARS.concession_turn":
      return carsConcession(index, rung);
    case "PAT.CARS.weaken":
      return carsWeaken(index, rung);
    case "PAT.CARS.analogy":
      return carsAnalogy(index, rung);
    case "PAT.CARS.except":
      return carsExcept(index, rung);
    case "PAT.CP.setup_equation":
      return cpSetup(index, rung);
    case "PAT.CP.limiting_case":
      return cpLimit(index, rung);
    case "PAT.CP.units":
      return cpUnits(index, rung);
    case "PAT.BB.control":
      return bbControl(index, rung);
    case "PAT.BB.if_then":
      return bbIfThen(index, rung);
    case "PAT.PS.confound":
      return psConfound(index, rung);
    case "PAT.PS.operdef":
      return psOperdef(index, rung);
    case "PAT.S1.competing":
      return s1Competing(index, rung);
    case "PAT.S1.tone":
      return s1Tone(index, rung);
    case "PAT.S2.throughline":
      return s2Throughline(index, rung);
    case "PAT.S3.table":
      return s3Table(index, rung);
    case "PAT.S3.proportion":
      return s3Proportion(index, rung);
    case "PAT.S3.control_s3":
      return s3Next(index, rung);
    default:
      return {
        question: `A later ${p.family} item uses new nouns. Which option applies the same relation as the example?`,
        correct: p.exampleConclusion,
        distractors: [...p.exampleWrong],
        why: [
          "That copies objects from the example and ignores the new constraints.",
          "That answers a different question than the one asked.",
          "That is a neighbouring-outline trap, not this relation.",
        ],
        close: `The example's correct account was: ${p.exampleConclusion} Score the new instance with the same relation.`,
      };
  }
}

function carsMainPoint(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "A botanist argues that seed banks are a form of forgetting because they freeze a species out of its habitat. She lingers on a rusted filing cabinet in the corridor.",
      key: "Seed banks freeze species out of living habitat — a kind of forgetting.",
      detail: "The filing cabinet in the corridor is rusted.",
      extra: "Botanists generally dislike metal furniture.",
      stretch: "Habitat restoration is therefore impossible.",
    },
    {
      stem: "A planner claims night buses rewrite who a city belongs to after midnight. One paragraph describes a vending machine that only takes coins.",
      key: "Night buses change who the city belongs to after midnight.",
      detail: "The vending machine takes only coins.",
      extra: "Planners should ban vending machines.",
      stretch: "No one belongs to a city in daylight.",
    },
    {
      stem: "An archivist says digitisation is a political sort because the scanner queue decides which lives become searchable. She notes a coffee ring on a ledger.",
      key: "Digitisation is political because the scanner queue chooses which lives are searchable.",
      detail: "A ledger has a coffee ring.",
      extra: "Coffee should be banned in archives.",
      stretch: "Paper records have no political content.",
    },
    {
      stem: "A critic argues that open-plan offices train workers to perform busyness. She describes a ficus dropping leaves by the printer.",
      key: "Open-plan offices train workers to perform busyness.",
      detail: "A ficus is dropping leaves by the printer.",
      extra: "Printers cause plant death.",
      stretch: "Private offices make work impossible.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} What is the main point?`,
    correct: c.key,
    distractors: [c.detail, c.extra, c.stretch],
    why: [
      "Local colour, not the governing claim.",
      "Not in the instance; a topic-changer.",
      "Stronger than the author's live claim.",
    ],
    close: "Retrieve the governing claim, not the vivid prop.",
  };
}

function carsConcession(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "The reviewer writes that the documentary is meticulously sourced, yet it treats the village as a backdrop for the filmmaker's grief.",
      key: "The live claim is that the village is used as scenery for the filmmaker's grief.",
      foil: "The documentary is meticulously sourced (the granted clause).",
      other: "The reviewer wants more close-ups of documents.",
      twist: "Grief documentaries cannot be ethical.",
    },
    {
      stem: "A councillor grants that the marina creates jobs, but still it prices the launching ramp like a private club.",
      key: "The live claim is that the ramp is priced like a private club.",
      foil: "The marina creates jobs (the granted clause).",
      other: "Councillors dislike boats.",
      twist: "Job creation never justifies a marina.",
    },
    {
      stem: "The essayist admits the translation is fluent; still, it sands off the original's class insults.",
      key: "The live claim is that the translation sands off class insults.",
      foil: "The translation is fluent (the granted clause).",
      other: "All translations are insults.",
      twist: "Fluency is the only criterion of a translation.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} After the turn, what is the author's live claim?`,
    correct: c.key,
    distractors: [c.foil, c.other, c.twist],
    why: [
      "That is the concession, not the turn.",
      "Not licensed by the sentence.",
      "Absolutes that skip the yes-but structure.",
    ],
    close: "The keyed option is the clause after but/yet/still. Praise before the turn is bait.",
  };
}

function carsWeaken(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "An op-ed infers that a library is 'the civic heart' solely from a Saturday queue for tax forms.",
      key: "The queue is mandatory: Saturday is the only day the city accepts paper filings.",
      topic: "It rained that Saturday.",
      insult: "Libraries are obsolete.",
      strengthen: "People also queued for novels.",
    },
    {
      stem: "A column infers neighbourhood trust from one street's unlocked bicycles.",
      key: "A nearby hostel lends bikes that cannot be locked with the supplied cable.",
      topic: "The street has maple trees.",
      insult: "Trust cannot be measured.",
      strengthen: "A survey also found high trust.",
    },
    {
      stem: "A blog infers school quality from one year's rise in mean test scores.",
      key: "That year the district dropped the lowest-scoring cohort from the reported mean.",
      topic: "The school painted its gym.",
      insult: "Tests measure nothing.",
      strengthen: "Attendance also rose.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} Which option most weakens the inference?`,
    correct: c.key,
    distractors: [c.topic, c.insult, c.strengthen],
    why: [
      "Topic-changer; leaves the evidence–claim link intact.",
      "Attacks the topic, not the support.",
      "This would support, not weaken.",
    ],
    close: "A weakener severs evidence from claim. Weather, insults, and extra support are not weakeners.",
  };
}

function carsAnalogy(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "The author compares a municipal footnote to a trapdoor: optional to notice, load-bearing if you step through.",
      key: "A hidden clause in a contract that most signers skip but that reallocates risk.",
      nouns: "A trapdoor in a haunted-house ride.",
      reverse: "A billboard that everyone is forced to see.",
      identity: "Footnotes are literally doors.",
    },
    {
      stem: "The author compares a waiting list to a velvet rope: it looks like order while it manufactures scarcity.",
      key: "A 'limited seating' label on an half-empty hall that raises ticket prices.",
      nouns: "An actual velvet rope at a theatre.",
      reverse: "A queue that expands supply until everyone is served.",
      identity: "Waiting lists are fabric.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} Which option preserves the relation rather than the nouns?`,
    correct: c.key,
    distractors: [c.nouns, c.reverse, c.identity],
    why: [
      "Copies the noun, drops the relation.",
      "Reverses the relation.",
      "Literalises the metaphor.",
    ],
    close: "Map A-is-to-B onto a new domain. Do not hunt for the same objects.",
  };
}

function carsExcept(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "A passage supports that a by-law is (1) older than the mall, (2) enforced at dusk, and (3) aimed at buskers. The author jokes that pigeons are the only remaining public.",
      key: "The by-law's purpose is to protect pigeons.",
      s1: "The by-law is older than the mall.",
      s2: "The by-law is enforced at dusk.",
      s3: "The by-law targets buskers.",
    },
    {
      stem: "A memoir supports that the ferry is (1) late in fog, (2) cheaper than the bridge, and (3) staffed by one family. The narrator aside-calls the radar a superstition.",
      key: "The ferry's radar is presented as a reliable instrument.",
      s1: "The ferry runs late in fog.",
      s2: "The ferry is cheaper than the bridge.",
      s3: "One family staffs the ferry.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} Which option is LEAST supported (EXCEPT)?`,
    correct: c.key,
    distractors: [c.s1, c.s2, c.s3],
    why: [
      "The passage supports this.",
      "The passage supports this.",
      "The passage supports this.",
    ],
    close: "EXCEPT keys the unsupported option. Three true supports are distractors.",
  };
}

function cpSetup(index: number, rung: number): ApplyBuilt {
  const m = 2 + (index % 6);
  const F = 8 + (index % 9);
  const a = F / m;
  const aTxt = Number.isInteger(a) ? String(a) : a.toFixed(2);
  return {
    question: `a ${m} kg cart is pulled with ${F} N on a frictionless rail. Magnitude of acceleration?`,
    correct: `${aTxt} m/s² (a = F/m)`,
    distractors: [
      `${F * m} m/s² (multiplied F by m)`,
      `${F} m/s² (forgot to divide by mass)`,
      `${Math.abs(F - m)} m/s² (subtracted instead of dividing)`,
    ],
    why: [
      "Wrong setup: F·m is not Newton's second law.",
      "Skipped the mass in a = F/m.",
      "Arithmetic costume, not the named relation.",
    ],
    close: `Name F=ma first, then substitute F=${F} N and m=${m} kg. The analog used 10 N and 2 kg; new numbers, same setup.`,
  };
}

function cpLimit(index: number, rung: number): ApplyBuilt {
  const R1 = 3 + (index % 7);
  return {
    question: `two resistors in parallel, R1 = ${R1} Ω and R2 → ∞. What happens to Req?`,
    correct: `Req → ${R1} Ω (the infinite branch drops out)`,
    distractors: [
      "Req → 0 Ω (as if the open branch were a short)",
      "Req → ∞ Ω (as if both branches opened)",
      `Req → ${2 * R1} Ω (added the resistors in a series costume)`,
    ],
    why: [
      "An open infinite resistor is not a short.",
      "The finite branch still conducts.",
      "Parallel with ∞ is not series addition.",
    ],
    close: `If R2 → ∞ the R2 branch carries no current, so Req → R1 = ${R1} Ω. The analog was the same limit with unspecified R1.`,
  };
}

function cpUnits(index: number, rung: number): ApplyBuilt {
  const Lcm = 40 + (index % 8) * 5;
  const Lm = Lcm / 100;
  const v = 20 + (index % 10);
  const f = v / (2 * Lm);
  const fTxt = Number.isInteger(f) ? String(f) : f.toFixed(2);
  const trap = v / (2 * Lcm);
  const trapTxt = Number.isInteger(trap) ? String(trap) : trap.toFixed(4);
  return {
    question: `a string of length ${Lcm} cm, wave speed ${v} m/s, fundamental f = v/(2L) with L in metres. What is f?`,
    correct: `${fTxt} Hz (L = ${Lm} m)`,
    distractors: [
      `${trapTxt} Hz (used L = ${Lcm} instead of metres)`,
      `${v / 2} Hz (dropped L entirely)`,
      `${v * Lm} Hz (multiplied instead of dividing)`,
    ],
    why: [
      "Classic cm/m unit trap.",
      "The formula still needs L.",
      "Wrong algebra after a correct conversion.",
    ],
    close: `Convert ${Lcm} cm → ${Lm} m before v/(2L). Mixing cm and m is the designed miss.`,
  };
}

function bbControl(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "An enzyme assay adds inhibitor in tube 1 and the same volume of buffer in tube 2; substrate, pH, and temperature match.",
      key: "Tube 2 (buffer only) is the control that isolates the inhibitor.",
      foil: "A third tube with extra substrate is a better control.",
      other: "Tube 1 is the control because it contains more reagents.",
      twist: "No control is possible for enzyme assays.",
    },
    {
      stem: "Mice: knockout of gene X vs wild-type littermates, same diet and light cycle, assay of the claimed enzyme.",
      key: "Wild-type littermates are the control for the knockout.",
      foil: "A different species on a different diet is a tighter control.",
      other: "The knockout is the control because it is the experimental manipulation.",
      twist: "Lighting must be reversed to control for gene X.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} What is the control?`,
    correct: c.key,
    distractors: [c.foil, c.other, c.twist],
    why: [
      "More reagents is not automatically a better control.",
      "The experimental arm is not the control.",
      "Abandons the isolation logic.",
    ],
    close: "The control isolates the claimed variable. Extra stuff is not a control.",
  };
}

function bbIfThen(index: number, rung: number): ApplyBuilt {
  const steps = ["A→B", "B→C", "C→D"] as const;
  const blocked = pick(steps, index);
  const map: Record<(typeof steps)[number], { key: string; foils: [string, string, string] }> = {
    "A→B": {
      key: "A accumulates; B, C, and D fall.",
      foils: [
        "A disappears and D piles up.",
        "Only C accumulates.",
        "All intermediates stay fixed.",
      ],
    },
    "B→C": {
      key: "B accumulates; C and D fall (A may rise or hold).",
      foils: [
        "C accumulates and B vanishes.",
        "D rises because the block is bypassed automatically.",
        "A must disappear.",
      ],
    },
    "C→D": {
      key: "C accumulates; D falls.",
      foils: [
        "D accumulates upstream of the block.",
        "A and B must both vanish.",
        "The block raises every metabolite equally.",
      ],
    },
  };
  const m = map[blocked];
  return {
    question: `linear pathway A→B→C→D is blocked at ${blocked}. What happens to the metabolites?`,
    correct: m.key,
    distractors: m.foils,
    why: [
      "Reverses upstream vs downstream.",
      "A block does not invent a bypass by default.",
      "Ignores the if-then of a linear path.",
    ],
    close: `Upstream of ${blocked} rises; downstream falls. Do not make the first metabolite vanish as a superstition.`,
  };
}

function psConfound(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "A lab claims a pill raises alertness after testing only at 08:00 in habitual coffee-drinkers who were not asked to abstain.",
      key: "Caffeine and time of day covary with the pill.",
      construct: "Alertness is just wakefulness restated.",
      insult: "Pills never work.",
      other: "The lab should have used a longer questionnaire.",
    },
    {
      stem: "A study claims tutoring raises maths scores after assigning tutors only to students who already attend Saturday school.",
      key: "Saturday-school attendance covaries with tutoring.",
      construct: "Maths is quantitative reasoning by another name.",
      insult: "Tutoring is a scam.",
      other: "The test should have had more colours.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} Which option names the confound?`,
    correct: c.key,
    distractors: [c.construct, c.insult, c.other],
    why: [
      "Restating the construct is not a confound.",
      "A topic insult is not a design confound.",
      "Does not name a covarying cause.",
    ],
    close: "A confound covaries with the claimed cause. Synonyms and insults are not confounds.",
  };
}

function psOperdef(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "Stress in the methods section is scored as salivary cortisol at 09:00.",
      key: "The operational definition is the 09:00 cortisol assay.",
      folk: "Stress means feeling overwhelmed.",
      theory: "Stress is a Freudian construct and cannot be measured.",
      other: "Stress is the opposite of relaxation, so no assay is needed.",
    },
    {
      stem: "Empathy is scored as the number of unprompted helping acts in a 10-minute waiting-room tape.",
      key: "The operational definition is counted helping acts on the tape.",
      folk: "Empathy means being a nice person.",
      theory: "Empathy is innate and therefore unmeasurable.",
      other: "The waiting room's furniture operationalises empathy.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} What is the operational definition?`,
    correct: c.key,
    distractors: [c.folk, c.theory, c.other],
    why: [
      "Everyday synonym, not the measure.",
      "A theory fight is not the methods line.",
      "Does not name how the construct was scored.",
    ],
    close: "Operationalisation is the measure in the methods, not the folk word.",
  };
}

function s1Competing(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "A letter praises a ferry for punctuality; a poem treats the same ferry as a floating waiting room.",
      key: "The split is clock-time versus lived delay, not whether boats exist.",
      foil: "Both texts deny that ferries exist.",
      other: "The letter is objectively true and the poem is false.",
      twist: "Punctuality and waiting are the same criterion.",
    },
    {
      stem: "A brochure sells a stadium as 'community'; a match-day diary treats the same stadium as a machine for moving beer.",
      key: "The split is civic belonging versus throughput of spectators and beer.",
      foil: "Neither text is about a stadium.",
      other: "Beer sales disprove community in every case.",
      twist: "Community and beer are identical claims.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} What is the competing-argument split?`,
    correct: c.key,
    distractors: [c.foil, c.other, c.twist],
    why: [
      "They share a topic; they split on criterion.",
      "Truth-value of one voice is not the split.",
      "Collapses the two criteria.",
    ],
    close: "Two voices can share a topic and split on the criterion of judgment. Name that split.",
  };
}

function s1Tone(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "A narrator lists inherited coats with inventory calm, then calls one of them a borrowed life.",
      key: "Tone turns from cataloguing to moral unease.",
      plot: "Someone inherited several coats (plot recap).",
      extra: "The narrator is literally a shopkeeper.",
      twist: "The piece has no stance, only objects.",
    },
    {
      stem: "A speaker itemises a town's war memorials, then says the newest plaque is still warm.",
      key: "Tone turns from civic inventory to unease that grief is still current.",
      plot: "The town has war memorials (plot recap).",
      extra: "The speaker is a stonemason.",
      twist: "Warmth is a weather report.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} Which option names the tone rather than the plot?`,
    correct: c.key,
    distractors: [c.plot, c.extra, c.twist],
    why: [
      "Plot summary is not tone.",
      "Occupation is not licensed.",
      "Ignores the stance toward the subject.",
    ],
    close: "Tone is stance. A recap of objects is not a tone.",
  };
}

function s2Throughline(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: `A Task A draft on "ambition" quotes four prompt lines, then lists the writer's hobbies, and never says what the quotes jointly imply.`,
      key: "The defect is a missing throughline — examples that serve no governing claim.",
      foil: "The defect is missing adjectives.",
      other: "The defect is that hobbies are never allowed in Task A.",
      twist: "The defect is quoting the prompt at all.",
    },
    {
      stem: `A Task B draft on "home" retells three anecdotes in three tones and ends without a last claim that could survive a stranger reading only the final paragraph.`,
      key: "The defect is no governing claim the anecdotes serve.",
      foil: "The defect is that anecdotes are banned in Task B.",
      other: "The defect is insufficient metaphor density.",
      twist: "The defect is writing in English.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} What is the craft defect?`,
    correct: c.key,
    distractors: [c.foil, c.other, c.twist],
    why: [
      "Surface style is not the throughline test.",
      "Anecdotes can serve a claim; they did not here.",
      "Ignores the governing-claim requirement.",
    ],
    close: "Task A/B needs one claim the examples serve. Quote collage is not a throughline.",
  };
}

function s3Table(index: number, rung: number): ApplyBuilt {
  const f1 = 100 + (index % 5) * 20;
  const f2 = 2 * f1;
  const A = 3 + (index % 4);
  return {
    question: `a table lists trial 1 frequency ${f1} Hz amplitude ${A} mm; trial 2 frequency ${f2} Hz amplitude ${A} mm. Which claim is forbidden by the table?`,
    correct: "Any option that requires amplitude to have changed between trials.",
    distractors: [
      "Frequency doubled while amplitude stayed fixed — allowed by the table.",
      "A mechanism that does not mention amplitude — not contradicted by these two rows.",
      "The experimenter recorded two frequencies — allowed by the table.",
    ],
    why: [
      "This restates the table; it is not forbidden.",
      "Silence about amplitude is not a contradiction.",
      "The table does record two frequencies.",
    ],
    close: `Read the numbers first. Amplitude is ${A} mm in both rows, so a story that needs an amplitude change is wrong even if it sounds physical.`,
  };
}

function s3Proportion(index: number, rung: number): ApplyBuilt {
  const c0 = 0.1 + (index % 5) * 0.1;
  const c1 = 2 * c0;
  const c0Txt = c0.toFixed(1);
  const c1Txt = c1.toFixed(1);
  return {
    question: `concentration rises from ${c0Txt} M to ${c1Txt} M at constant volume. What happens to moles of solute?`,
    correct: "Moles double, because n = cV and V is fixed.",
    distractors: [
      "Moles stay fixed, as if concentration were independent of n.",
      "Moles halve, inverting the proportion.",
      "Moles quadruple, mixing a 1/x trap into a direct proportion.",
    ],
    why: [
      "c doubled at constant V must double n.",
      "That would be y ∝ 1/x, which this is not.",
      "Over-applies a square law that is not in the relation.",
    ],
    close: "If y ∝ x, doubling x doubles y. Here n ∝ c at constant V. Mixed inverse-square costumes are the usual trap.",
  };
}

function s3Next(index: number, rung: number): ApplyBuilt {
  const cases = [
    {
      stem: "Two models remain: model P predicts enzyme activity peaks at pH 5, model Q at pH 8. One replicate at pH 7 is already in the table.",
      key: "Measure activity across a pH curve that can separate a pH-5 peak from a pH-8 peak.",
      foil: "Run a third identical replicate at the same pH 7.",
      other: "Change the enzyme's name in the lab book.",
      twist: "Stop; one pH-7 point already decides both models.",
    },
    {
      stem: "Two remaining hypotheses: the unknown is a strong acid vs a weak acid at the same nominal concentration. Conductivity at one temperature is already recorded.",
      key: "Titrate or measure pH/conductivity in a way that discriminates complete vs partial dissociation.",
      foil: "Repeat the same single conductivity row.",
      other: "Weigh the flask again without a new measurement that splits the hypotheses.",
      twist: "Declare both hypotheses true.",
    },
  ] as const;
  const c = pick(cases, index);
  return {
    question: `${c.stem} What is the productive next measurement?`,
    correct: c.key,
    distractors: [c.foil, c.other, c.twist],
    why: [
      "Re-measures a settled column.",
      "Does not discriminate the two hypotheses.",
      "Stops before a discriminating test.",
    ],
    close: "The next measurement should split the remaining hypotheses, not clone a finished cell.",
  };
}
