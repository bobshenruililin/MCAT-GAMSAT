import { assembleItem, hashStr, mulberry, pick } from "./item";
import type { FactoryItem, FactoryPassage, TopicNode } from "./types";

const SCHOLARS = [
  "Amina Okonkwo", "Pavel Hrdlička", "Mei-Ling Vargas", "Soren Adeyemi",
  "Clara Voss", "Ibrahim El-Sayed", "Naomi Kline", "Diego Ferreira",
  "Hanae Morioka", "Leo Nyathi", "Priya Raman", "Jonas Berg",
  "Fatima Al-Hassan", "Owen Blake", "Yuki Tanaka", "Marta Górska",
  "Samir Haddad", "Elena Rossi", "Kwame Boateng", "Ingrid Nilsen",
];

const ARENAS = [
  "municipal archives", "a coastal fishery", "broadcast newsrooms",
  "university hiring", "vaccine campaigns", "heritage listing",
  "public libraries", "court translation", "urban cycling",
  "museum captions", "disaster mapping", "community radio",
];

const CLAIMS = [
  "that neutrality is a style, not an absence of interest",
  "that speed of publication is being mistaken for care",
  "that local knowledge is treated as anecdote until a model needs it",
  "that institutions remember procedures better than people",
  "that a metric can become the mission that it was supposed to measure",
  "that politeness can be a method of exclusion",
  "that the archive is a construction site, not a warehouse",
  "that expertise without a named audience is just private language",
];

const CONCESSIONS = [
  "The author grants that standards exist for a reason and that amateurs can be wrong.",
  "The piece admits that some gatekeeping keeps fraud out.",
  "A paragraph concedes that not every complaint is evidence of capture.",
  "The writer notes that nostalgia for a slower era is itself a politics.",
];

const TURNS = [
  "The turn is that the standard is being used to hide a choice about who counts as a speaker.",
  "The turn is that fraud-control language is being stretched to cover disagreement.",
  "The turn is that the complaint is not against method but against unacknowledged method.",
  "The turn is that slowness was never evenly distributed; some people were always rushed.",
];

function passageBody(index: number, topicId: string): { title: string; body: string; scholar: string; arena: string; claim: string; year: number } {
  const rng = mulberry(hashStr(`${topicId}:p:${index}`));
  const scholar = pick(SCHOLARS, rng);
  const arena = pick(ARENAS, rng);
  const claim = pick(CLAIMS, rng);
  const concession = pick(CONCESSIONS, rng);
  const turn = pick(TURNS, rng);
  const year = 1970 + (index % 50);
  const title = `${scholar} on ${arena} (${year})`;
  const body =
    `${scholar}'s ${year} essay on ${arena} opens with a scene that looks minor: a form, a caption, a roster. ` +
    `The argument is ${claim}. ${concession} ${turn} ` +
    `Examples accumulate without becoming a catalogue — a mistranslated notice, a map that omits a creek, a hiring rubric that scores “fit.” ` +
    `The prose is dry rather than outraged; the heat is in what is treated as obvious. ` +
    `A late paragraph asks what would have to be true for the current procedure to be called fair, and then shows that those conditions are not met. ` +
    `The essay does not offer a slogan. It offers a test: if a practice cannot survive being described without its official adjectives, the adjectives were doing the work. ` +
    `Readers who want a policy list will be disappointed; readers who want to see how a tone becomes a rule will not.`;
  return { title, body, scholar, arena, claim, year };
}

function cite(ctx: ReturnType<typeof passageBody>, index: number): string {
  return `${ctx.scholar}’s ${ctx.year} essay on ${ctx.arena} (issue ${index + 1})`;
}

function carsQuestion(
  topic: TopicNode,
  index: number,
  ctx: ReturnType<typeof passageBody>,
): FactoryItem {
  const id = topic.id;
  let stem: string;
  let correct: string;
  let d1: string, d2: string, d3: string;
  let w1: string, w2: string, w3: string;
  let explain: string;
  let design: string;
  if (id.endsWith("FND.t1") || id.includes("understand.t1")) {
    design = "verbal.main-idea";
    stem = `The primary purpose of ${cite(ctx, index)} is to`;
    correct = `show that an official style in ${ctx.arena} conceals a choice about who counts as a speaker`;
    d1 = `narrate ${ctx.scholar}'s biography as a model career`;
    d2 = `list regulations that should replace current practice in every jurisdiction`;
    d3 = `argue that amateurs should run ${ctx.arena} without standards`;
    w1 = "The passage is not a biography.";
    w2 = "It refuses a policy catalogue.";
    w3 = "It does not reject standards; it says they hide a choice.";
    explain = `Main idea tracks the turn after the concession: standards exist, but they are being used to hide a choice about speakers in ${ctx.arena}. Biography, a universal policy list, and anti-standard populism are the usual CARS overreads. The proper names (${ctx.scholar}, seed ${index}) are cover, not the purpose.`;
  } else if (id.endsWith("FND.t2") || id.includes("understand.t3")) {
    design = "verbal.retrieval";
    stem = `According to ${cite(ctx, index)}, the essay’s heat is located in`;
    correct = `what the prose treats as obvious`;
    d1 = `a slogan in the final sentence`;
    d2 = `a statistical appendix`;
    d3 = `${ctx.scholar}'s personal scandal`;
    w1 = "The passage says there is no slogan.";
    w2 = "No appendix is mentioned.";
    w3 = "No scandal is described.";
    explain = `Information retrieval: the passage states that the heat is in what is treated as obvious, and that the prose is dry. Slogan, appendix, and scandal are planted absences. Seed ${index} does not add those elements.`;
  } else if (id.endsWith("FND.t3") || id.includes("infer.t1") || id.includes("infer.t2")) {
    design = "verbal.inference";
    stem = `${cite(ctx, index)} most strongly implies that official adjectives in ${ctx.arena} function as`;
    correct = `labour that the underlying practice cannot do on its own`;
    d1 = `proof that the practice is already fair`;
    d2 = `decorative Latin with no institutional effect`;
    d3 = `a requirement imposed by ${ctx.scholar}'s publisher`;
    w1 = "The test is that the practice fails without the adjectives — the opposite of proof of fairness.";
    w2 = "The adjectives do work; they are not mere decoration.";
    w3 = "No publisher demand is mentioned.";
    explain = `Inference from the test: if a practice cannot survive being described without official adjectives, the adjectives were doing the work. That is not a claim of fairness, decoration, or a publisher subplot. Index ${index} only relabels the arena.`;
  } else if (id.endsWith("FND.t4")) {
    design = "verbal.vocab";
    stem = `In ${cite(ctx, index)}, “construction site” as applied to the archive most nearly means`;
    correct = `a place where what will count as the past is being assembled`;
    d1 = `a literal building project with cranes`;
    d2 = `a warehouse that stores finished, uncontroversial records`;
    d3 = `a metaphor for ${ctx.scholar}'s childhood`;
    w1 = "The metaphor is institutional, not architectural labour.";
    w2 = "The passage contrasts construction with warehouse.";
    w3 = "No childhood is discussed.";
    explain = `Vocabulary-in-context: the archive as construction site is opposed to warehouse. It means the past is assembled, not that there are cranes, and not a biographical aside. Seed ${index} does not change that contrast.`;
  } else if (id.endsWith("FND.t5") || id.includes("understand.t2")) {
    design = "verbal.paraphrase";
    stem = `${cite(ctx, index)}: which option best paraphrases the author’s warning without adding a policy list?`;
    correct = `If you cannot describe the practice without its official adjectives, those adjectives were doing the work`;
    d1 = `Every institution should be defunded immediately`;
    d2 = `${ctx.scholar} wants amateurs to replace experts`;
    d3 = `Tone never becomes a rule`;
    w1 = "Defunding is an outside leap.";
    w2 = "The essay does not replace experts with amateurs.";
    w3 = "The passage says tone can become a rule.";
    explain = `Paraphrase must stay inside the closing test. Defund, amateur takeover, and “tone never becomes a rule” all leave the passage. Seed ${index} is irrelevant to that constraint.`;
  } else if (id.includes("RWT.t1") || id.includes("argument.t1")) {
    design = "verbal.structure";
    stem = `In ${cite(ctx, index)}, the concession paragraph functions primarily to`;
    correct = `acknowledge a fair point so the later turn cannot be dismissed as anti-standard`;
    d1 = `refute the rest of the essay in advance`;
    d2 = `introduce ${ctx.scholar}'s opponents by name`;
    d3 = `provide the policy list the conclusion otherwise withholds`;
    w1 = "The concession does not wreck the argument; it sets up the turn.";
    w2 = "No opponents are named.";
    w3 = "The piece still withholds a catalogue.";
    explain = `Integration of parts: concession-then-turn is the architecture. Granting that standards exist blocks the straw man “this author hates method.” It does not name opponents or smuggle a policy list. Index ${index}.`;
  } else if (id.includes("RWT.t2") || id.includes("argument.t2")) {
    design = "verbal.support";
    stem = `In ${cite(ctx, index)}, which example is offered as support rather than as a slogan?`;
    correct = `a mistranslated notice, a map that omits a creek, or a hiring rubric that scores “fit”`;
    d1 = `a call to abolish ${ctx.arena}`;
    d2 = `a table of p-values`;
    d3 = `an anecdote about the author’s childhood bicycle`;
    w1 = "Abolition is not argued.";
    w2 = "No p-values appear.";
    w3 = "No bicycle memoir appears.";
    explain = `Relevance/support: the passage names those three mundane examples as accumulation, not a slogan. The other options are absences. Seed ${index} only swaps arena and scholar.`;
  } else if (id.includes("RWT.t3") || id.includes("argument.t3")) {
    design = "verbal.logic";
    stem = `The strongest description of the reasoning in ${cite(ctx, index)} is`;
    correct = `concession, then a turn that reclassifies the conceded standard as a hiding-place`;
    d1 = `pure deduction from a mathematical axiom`;
    d2 = `a sequence of ad hominem attacks on ${ctx.scholar}`;
    d3 = `uncritical summary of a government white paper`;
    w1 = "No axiom is used.";
    w2 = "The scholar is the author, not the target.";
    w3 = "It is not a white-paper summary.";
    explain = `Logic/structure is concession-then-turn, not deduction, insult, or summary. That shape is independent of seed ${index}.`;
  } else if (id.includes("RWT.t4") || id.includes("tone")) {
    design = "verbal.tone";
    stem = `The author’s tone in ${cite(ctx, index)} is best described as`;
    correct = `dry and diagnostic rather than outraged`;
    d1 = `celebratory toward current procedure`;
    d2 = `hysterical and slogan-driven`;
    d3 = `confessional and sentimental`;
    w1 = "The essay criticises procedure; it does not celebrate it.";
    w2 = "It explicitly refuses slogans and outrage as the heat source.";
    w3 = "No confessional mode is used.";
    explain = `Tone: dry rather than outraged, heat in the obvious. Celebratory, hysterical, and sentimental contradict the stated style. Seed ${index} does not change the tone recipe.`;
  } else if (id.includes("RWT.t5") || id.includes("infer.t3")) {
    design = "verbal.consistency";
    stem = `Which statement would be internally inconsistent with ${cite(ctx, index)} as written?`;
    correct = `The official adjectives are idle decoration and the underlying practice is already fully fair`;
    d1 = `Standards can be legitimate and still be used to hide a choice`;
    d2 = `A policy catalogue is not the essay’s offering`;
    d3 = `Tone can ossify into a rule`;
    w1 = "That is the concession-plus-turn, which the passage holds.";
    w2 = "The passage says readers wanting a list will be disappointed.";
    w3 = "The passage says tone can become a rule.";
    explain = `Internal consistency: the idle-decoration-plus-already-fair package contradicts the test of the adjectives. The other three restatements are what the passage actually holds. Index ${index}.`;
  } else if (id.includes("RBT.t1") || id.includes("compare") || id.includes("humanities") || id.includes("social")) {
    design = "verbal.apply";
    stem = `Which new case is most analogous to the test in ${cite(ctx, index)}?`;
    correct = `A hospital checklist that cannot be described without the word “quality,” yet quality is never defined`;
    d1 = `A proof in Euclidean geometry that names every axiom`;
    d2 = `A recipe that lists oven temperature`;
    d3 = `${ctx.scholar} winning a literary prize`;
    w1 = "Named axioms are the opposite of hidden adjectives.";
    w2 = "A temperature is an operational instruction, not an official perfume.";
    w3 = "A prize is biographical, not analogical.";
    explain = `Apply-to-new-context: the analog is a practice that depends on an undefined official word. Geometry and recipes are explicit; a prize is off-axis. Seed ${index} only changes names.`;
  } else if (id.includes("RBT.t2")) {
    design = "verbal.new-info";
    stem = `Suppose a later historian shows that ${ctx.scholar} omitted a successful counterexample in ${ctx.arena} (${cite(ctx, index)}). This information would`;
    correct = `weaken the reach of the examples without automatically falsifying the adjectives-do-the-work test`;
    d1 = `prove that every claim in the essay is false`;
    d2 = `have no possible bearing on any sentence`;
    d3 = `convert the essay into a government white paper`;
    w1 = "One omitted counterexample is not global disproof.";
    w2 = "It does bear on the examples.";
    w3 = "Genre does not change.";
    explain = `Incorporate-new-information: a missing counterexample nicks the examples, not necessarily the structural test. Global disproof and “no bearing” are the CARS poles to avoid. Index ${index}.`;
  } else if (id.includes("RBT.t3")) {
    design = "verbal.analogy";
    stem = `In ${cite(ctx, index)}, the hiring rubric that scores “fit” is used as`;
    correct = `an ordinary institutional practice that smuggles a standard through an undefined word`;
    d1 = `proof that all hiring is illegal`;
    d2 = `a joke with no argumentative role`;
    d3 = `evidence that ${ctx.arena} should be automated`;
    w1 = "Illegality is not claimed.";
    w2 = "The example is doing argumentative work.";
    w3 = "Automation is not proposed.";
    explain = `The “fit” rubric is a hypothetical-in-miniature: an undefined official word doing labour. It is not a joke, a legal conclusion, or an automation brief. Seed ${index}.`;
  } else if (id.includes("visual")) {
    design = "verbal.visual";
    stem = `A cartoon printed with ${cite(ctx, index)} shows a caption that says “neutral” under a scale whose weights are unlabeled. The cartoon is best read as`;
    correct = `a picture of adjectives doing work that the underlying practice cannot do unaided`;
    d1 = `proof that cartoons cannot make arguments`;
    d2 = `a call to abolish captions`;
    d3 = `a portrait of ${ctx.scholar}`;
    w1 = "The passage treats pictures and captions as able to argue.";
    w2 = "Abolishing captions is not the point.";
    w3 = "No portrait is implied.";
    explain = `Visual/caption tension is the same grain as official adjectives. The unlabeled weights plus the word “neutral” is the test in picture form. Index ${index}.`;
  } else {
    design = "verbal.implication";
    stem = `The closing attitude of ${cite(ctx, index)} toward readers who want a policy list is`;
    correct = `unapologetic refusal: the offering is a test, not a catalogue`;
    d1 = `a promise that the list appears in a sequel`;
    d2 = `contempt for anyone who works in ${ctx.arena}`;
    d3 = `agreement that the list is the only serious genre`;
    w1 = "No sequel is promised.";
    w2 = "Workers in the arena are not the target of contempt.";
    w3 = "The essay rejects catalogue-as-seriousness.";
    explain = `Limitations/implications: disappointed list-seekers are anticipated; the essay still will not become a catalogue. That is a genre choice, not contempt for practitioners. Seed ${index}.`;
  }
  return assembleItem({
    conceptId: topic.id,
    type: "passage_question",
    stem,
    correct,
    distractors: [
      { text: d1, why: w1 },
      { text: d2, why: w2 },
      { text: d3, why: w3 },
    ],
    explanation: explain,
    difficulty: 0.45 + (index % 5) * 0.08,
    rotate: hashStr(stem + topic.id + String(index)) % 4,
    design,
    salt: `${topic.id}#${index}`,
  });
}

export function verbalPassage(topic: TopicNode, index: number): FactoryPassage {
  const ctx = passageBody(index, topic.id);
  return {
    concept_id: topic.id,
    title: ctx.title,
    body: ctx.body,
    questions: [carsQuestion(topic, index, ctx)],
    design: "verbal.passage-1q",
  };
}

const QUOTES = [
  "Comfort is not the same as flourishing.",
  "A metric can become the mission.",
  "Silence can be a tactic; it can also be a wound.",
  "We ration; we merely prefer not to say the word.",
  "The stranger is the test of a constitution.",
  "Progress is the replacement of one nuisance with another.",
  "Expertise without humility becomes a priesthood.",
  "Privacy is the right to be uninterpreted.",
];

export function s2Item(topic: TopicNode, index: number): FactoryItem {
  const rng = mulberry(hashStr(`${topic.id}:${index}:s2`));
  const q1 = pick(QUOTES, rng);
  let q2 = pick(QUOTES, rng);
  if (q2 === q1) q2 = pick(QUOTES.filter((q) => q !== q1), rng);
  const task = topic.id.includes("task_b") ? "B" : "A";
  const stem =
    `Comments for a 30-minute Task ${task} (set ${index + 1}): “${q1}” and “${q2}”. ` +
    `Which writing move is most likely to raise the mark?`;
  const correct = `${topic.description.replace(/\.$/, "")} — do that under time, with particular examples, without inventorying every quote.`;
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem,
    correct,
    distractors: [
      { text: "Inventory every quote in order so the marker sees completeness.", why: "Quote inventory is the named failure mode for S2." },
      { text: "Write a generic paragraph that could fit any prompt this century.", why: "Generic voice is the opposite of particular/theme precision." },
      { text: "Spend the first twenty minutes outlining and the last two typing.", why: "Under time, an unused outline does not score." },
    ],
    explanation:
      `GAMSAT S2 is production under a clock. The move that scores is: ${topic.description} ` +
      `Use a clear position or a precise personal scene; quotes are pressure, not a checklist. ` +
      `Inventory, generic filler, and outline-without-prose are the three ways this hour fails to raise a mark. ` +
      `Set ${index + 1} only swaps the quote pairing.`,
    difficulty: 0.4 + (index % 4) * 0.08,
    rotate: index % 4,
    design: "s2.craft",
    salt: `${topic.id}#${index}`,
  });
}
