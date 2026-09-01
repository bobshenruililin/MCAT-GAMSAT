export type WritingTask = {
  id: string;
  title: string;
  minutes: number;
  quotes: string[];
  prompt: string;
};

export const TASK_A_PACKS: WritingTask[] = [
  {
    id: "a-progress",
    title: "Task A — sociopolitical comment",
    minutes: 30,
    quotes: [
      "Progress is the replacement of one nuisance with another.",
      "A society that values order above justice will have neither for long.",
      "We do not inherit the world from our parents; we borrow it from our children.",
      "Comfort is not the same as flourishing.",
      "Every generation is convinced it is the first to notice hypocrisy.",
    ],
    prompt:
      "Write a comment on the theme suggested by these statements. Take a position. Use examples. Engage at least two of the quotes without turning the piece into a survey.",
  },
  {
    id: "a-speech",
    title: "Task A — sociopolitical comment",
    minutes: 30,
    quotes: [
      "Free speech that cannot survive a joke is already a liturgy.",
      "Censorship is most efficient when it arrives dressed as care.",
      "A public that only hears itself will still call the echo a debate.",
      "Silence can be a tactic; it can also be a wound.",
      "The first casualty of certainty is the other person's sentence.",
    ],
    prompt:
      "Write a comment on the theme. Defend a position a reasonable opponent could hate. Quote at least two statements as pressure, not decoration.",
  },
  {
    id: "a-medicine",
    title: "Task A — sociopolitical comment",
    minutes: 30,
    quotes: [
      "A health system that only counts what is billable will miss what is killing people.",
      "Prevention is unglamorous because the catastrophe does not arrive to thank you.",
      "Expertise without humility becomes a priesthood.",
      "The patient is not a dataset with a pulse.",
      "We ration; we merely prefer not to say the word.",
    ],
    prompt:
      "Write a comment on medicine, policy, or care as a public question. Take a stand. Use at least two quotes as interlocutors.",
  },
  {
    id: "a-tech",
    title: "Task A — sociopolitical comment",
    minutes: 30,
    quotes: [
      "Convenience is a political programme that forgot to declare itself.",
      "An algorithm has no cruelty and no mercy; it has a loss function.",
      "We asked machines to save time and they sold the hours back to us.",
      "Privacy is the right to be uninterpreted.",
      "Scale is not a moral argument, though it is often used as one.",
    ],
    prompt:
      "Write a comment on technology and public life. Take a position that is not a product review. Engage at least two quotes.",
  },
  {
    id: "a-nation",
    title: "Task A — sociopolitical comment",
    minutes: 30,
    quotes: [
      "A border is a story with a police force.",
      "Patriotism that cannot criticise itself is a brand.",
      "The stranger is the test of a constitution, not of a mood.",
      "History is not a museum if it still sets the seating plan.",
      "We remember wars more easily than the paperwork that made them possible.",
    ],
    prompt:
      "Write a comment on belonging, state power, or memory. Take a position. At least two quotes must do work.",
  },
];

export const TASK_B_PACKS: WritingTask[] = [
  {
    id: "b-home",
    title: "Task B — personal / reflective",
    minutes: 30,
    quotes: [
      "Home is not a place but a permission to be unguarded.",
      "I left so I could see the street I grew up on.",
      "We become the stories we can stand to tell twice.",
      "Kindness is a skill, not a mood.",
      "The first language I loved was the one used against me.",
    ],
    prompt:
      "Write a reflective piece on the theme. Prefer a particular scene over a generic sermon. Voice matters more than vocabulary.",
  },
  {
    id: "b-body",
    title: "Task B — personal / reflective",
    minutes: 30,
    quotes: [
      "The body keeps the appointment the mind tries to cancel.",
      "I learned my limits from a staircase, not a slogan.",
      "Illness is a country with its own weather reports.",
      "To be young is to treat recovery as a personality.",
      "Care is repetitive on purpose.",
    ],
    prompt:
      "Write a reflective piece. Stay in a scene long enough to be embarrassed by it. Engage at least two quotes without listing them.",
  },
  {
    id: "b-work",
    title: "Task B — personal / reflective",
    minutes: 30,
    quotes: [
      "I wanted a vocation and was given a rota.",
      "Dignity at work is the right to finish a sentence.",
      "Burnout is what we call it when the building is the problem.",
      "I kept the lanyard longer than the belief.",
      "A good shift is one in which nobody had to become a hero.",
    ],
    prompt:
      "Write a reflective piece about labour, duty, or the self at work. Particular over generic. Two quotes, used.",
  },
  {
    id: "b-family",
    title: "Task B — personal / reflective",
    minutes: 30,
    quotes: [
      "We inherit silences the way other families inherit china.",
      "I translated my parents into a language they did not speak.",
      "Forgiveness is sometimes just a shorter argument.",
      "The photograph is kind; the kitchen was not.",
      "I left the table and took the table with me.",
    ],
    prompt:
      "Write a reflective piece on family, inheritance, or leaving. One scene, not a timeline. Two quotes as pressure.",
  },
  {
    id: "b-failure",
    title: "Task B — personal / reflective",
    minutes: 30,
    quotes: [
      "I failed in a way that looked like discipline from a distance.",
      "Shame is a spotlight that believes it is a moral system.",
      "The second chance arrived wearing the first chance's clothes.",
      "I kept the trophy in a drawer so it could not lie to guests.",
      "Starting again is not the same as never having started.",
    ],
    prompt:
      "Write a reflective piece on failure, shame, or beginning again. Stay particular. Let at least two quotes bruise the draft.",
  },
];

export const RUBRIC = [
  {
    id: "thesis",
    label: "Clear thesis / controlling idea (Task A: argumentative; Task B: reflective)",
  },
  { id: "quotes", label: "Quotes are used, not pasted — at least two engaged" },
  { id: "particular", label: "Particular examples or scenes, not only abstractions" },
  {
    id: "counter",
    label: "Task A: a real counterargument; Task B: emotional precision without melodrama",
  },
  { id: "structure", label: "A shape the reader can follow (not a quote-by-quote crawl)" },
  { id: "register", label: "Register fits the task; sentences survive a timed reread" },
];

/** UTC day index so consecutive calendar days rotate packs. */
export function packIndex(now = new Date(), length = 5): number {
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor(utc / 86_400_000) % length;
}

export function taskFor(kind: "A" | "B", now = new Date()): WritingTask {
  const packs = kind === "A" ? TASK_A_PACKS : TASK_B_PACKS;
  return packs[packIndex(now, packs.length)]!;
}
