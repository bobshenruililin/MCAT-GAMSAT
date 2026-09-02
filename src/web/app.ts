import type { ErrorClass } from "@/db/schema";
import { ERROR_CLASSES } from "@/db/schema";
import {
  calibrationNote,
  canProceedAfterReveal,
  canSubmit,
} from "@/engine/quizGate";
import { COVERAGE_TRACKS, type SectionFamily } from "@/engine/sectionBudget";
import { sittingItemIds, familyCounts } from "./assembleWeb";
import { loadLedger, saveLedger } from "./ledger";
import { scheduleAttempt } from "./schedule";
import type { OpenSitting, WebBank, WebItem } from "./types";

const SHORT: Record<string, string> = {
  "MCAT CARS": "CARS",
  "MCAT B/B": "B/B",
  "MCAT C/P": "C/P",
  "MCAT P/S": "P/S",
  "GAMSAT S1": "S1",
  "GAMSAT S2": "S2",
  "GAMSAT S3": "S3",
};

const ERROR_LABELS: Record<ErrorClass, string> = {
  content_gap: "Content gap",
  reasoning: "Reasoning",
  misread: "Misread",
  timing: "Timing",
  trap: "Trap",
  other: "Other",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sit-${Date.now()}`;
}

type Player = {
  answeredKey: string | null;
  confidence: number | null;
  revealed: boolean;
  correct: boolean | null;
  errorClass: ErrorClass | null;
  seconds: number;
  startedAt: number;
};

function freshPlayer(): Player {
  return {
    answeredKey: null,
    confidence: null,
    revealed: false,
    correct: null,
    errorClass: null,
    seconds: 0,
    startedAt: Date.now(),
  };
}

function routeFromHash(): "home" | "sit" | "done" {
  const h = (window.location.hash || "#/").replace(/^#/, "");
  if (h.startsWith("/sit")) return "sit";
  if (h.startsWith("/done")) return "done";
  return "home";
}

export type MountOpts = {
  bank: WebBank;
  storage: Storage;
  now?: () => Date;
};

export function mountApp(root: HTMLElement, opts: MountOpts): { destroy: () => void } {
  const byId = new Map(opts.bank.items.map((it) => [it.id, it]));
  const ledger = loadLedger(opts.storage);
  let player = freshPlayer();
  let timer: number | null = null;

  function now(): Date {
    return opts.now ? opts.now() : new Date();
  }

  function persist(): void {
    saveLedger(opts.storage, ledger);
  }

  function go(hash: string): void {
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
    draw();
  }

  function currentItem(): WebItem | null {
    const sit = ledger.session;
    if (!sit) return null;
    const id = sit.itemIds[sit.cursor];
    return id ? byId.get(id) ?? null : null;
  }

  function startSitting(track?: SectionFamily, resumeIfOpen = false): void {
    const sit = ledger.session;
    const open = Boolean(sit && sit.cursor < sit.itemIds.length);
    if (open && sit && (resumeIfOpen || (track && sit.track === track))) {
      player = freshPlayer();
      go("#/sit");
      return;
    }
    const ids = sittingItemIds(opts.bank.items, ledger, track, now());
    if (ids.length === 0) return;
    ledger.session = {
      id: newId(),
      track: track ?? "mixed",
      itemIds: ids,
      cursor: 0,
      startedAt: now().toISOString(),
    };
    player = freshPlayer();
    persist();
    go("#/sit");
  }

  function resumeOrStart(): void {
    startSitting(undefined, true);
  }

  function grade(): void {
    const item = currentItem();
    if (!item || !canSubmit(player.answeredKey, player.confidence)) return;
    player.seconds = Math.max(0, (Date.now() - player.startedAt) / 1000);
    player.correct = player.answeredKey === item.correctKey;
    player.revealed = true;
    draw();
  }

  function commit(): void {
    const item = currentItem();
    const sit = ledger.session;
    if (!item || !sit || player.answeredKey === null || player.confidence === null) return;
    if (
      !canProceedAfterReveal({
        revealed: player.revealed,
        correct: player.correct,
        errorClass: player.errorClass,
      })
    ) {
      return;
    }
    const correct = player.correct === true;
    ledger.attempts.push({
      itemId: item.id,
      conceptId: item.conceptId,
      correct,
      confidence: player.confidence,
      errorClass: correct ? null : player.errorClass,
      seconds: player.seconds,
      at: now().toISOString(),
    });
    scheduleAttempt(
      ledger,
      item.id,
      item.conceptId,
      correct,
      player.confidence,
      now(),
    );
    sit.cursor += 1;
    if (sit.cursor >= sit.itemIds.length) {
      const slice = ledger.attempts.slice(-sit.itemIds.length);
      ledger.lastSummary = {
        sittingId: sit.id,
        correct: slice.filter((a) => a.correct).length,
        total: sit.itemIds.length,
        track: sit.track,
        finishedAt: now().toISOString(),
      };
      ledger.session = null;
      persist();
      go("#/done");
      return;
    }
    player = freshPlayer();
    persist();
    draw();
  }

  function homeHtml(): string {
    const sit = ledger.session;
    const counts = familyCounts(opts.bank.items, ledger);
    const answered = ledger.attempts.length;
    const hits = ledger.attempts.filter((a) => a.correct).length;
    const open = Boolean(sit && sit.cursor < sit.itemIds.length);
    const continueLabel =
      open && sit ? `Resume · ${sit.cursor}/${sit.itemIds.length}` : "Continue";
    const continueSub =
      open && sit
        ? `${sit.track === "mixed" ? "Mixed" : SHORT[sit.track] ?? sit.track} sitting`
        : "Mixed retrieval · this browser";

    const orbs = COVERAGE_TRACKS.map((family, i) => {
      const row = counts.get(family);
      const topics = row?.topics.size ?? 0;
      const attempted = row?.attempted.size ?? 0;
      const fill = topics === 0 ? 0 : Math.round((100 * attempted) / topics);
      const current = open && sit?.track === family;
      return `
        ${i > 0 ? `<div class="stem" aria-hidden="true"></div>` : ""}
        <button
          type="button"
          class="orb-btn ${current ? "now" : ""}"
          data-testid="family-orb-${esc(family)}"
          data-track="${esc(family)}"
        >
          <span class="orb">
            <span class="fill" style="height:${fill}%"></span>
            <span class="label">${esc(SHORT[family] ?? family)}</span>
          </span>
          <span class="orb-name">${esc(family.replace("MCAT ", "").replace("GAMSAT ", ""))}</span>
        </button>`;
    }).join("");

    return `
      <main class="wrap">
        <p class="kicker">Exam morning</p>
        <h1>The person walking into the room is the product.</h1>
        <p class="lede">
          Website-only retrieval. ${opts.bank.itemCount.toLocaleString("en-US")} hand-authored
          items run in this tab. No accounts. Ledger stays on this device.
          Never verified=true in software.
        </p>
        <button type="button" class="continue" data-testid="continue" ${opts.bank.itemCount === 0 ? "disabled" : ""}>
          <span class="continue-title">${esc(continueLabel)}</span>
          <span class="continue-sub">${esc(continueSub)}</span>
        </button>
        <p class="hint">Click an orb to sit that family. Keys later: A–D, 1–5, Enter.</p>
        <section class="path" aria-label="Exam family path" data-testid="family-path">
          ${orbs}
        </section>
        <p class="foot" data-testid="ledger-line">
          ${answered} retrieve${answered === 1 ? "" : "s"} on this device
          ${answered ? ` · ${hits}/${answered} correct` : ""}.
          Factory millions stay optional local SQLite — they made sitting slow.
          <a href="https://github.com/bobshenruililin/MCAT-GAMSAT">Source</a>
        </p>
      </main>`;
  }

  function playerHtml(item: WebItem, sit: OpenSitting): string {
    const remaining = sit.itemIds.length - sit.cursor;
    const submitReady = canSubmit(player.answeredKey, player.confidence);
    const nextReady = canProceedAfterReveal({
      revealed: player.revealed,
      correct: player.correct,
      errorClass: player.errorClass,
    });
    const cal =
      player.revealed && player.correct !== null && player.confidence !== null
        ? calibrationNote(player.correct, player.confidence)
        : null;
    const elapsed = player.revealed
      ? player.seconds
      : (Date.now() - player.startedAt) / 1000;

    const choices = item.choices
      .map((choice) => {
        const selected = player.answeredKey === choice.key;
        const isCorrect =
          player.revealed && choice.key === item.correctKey;
        const isWrong =
          player.revealed && selected && choice.key !== item.correctKey;
        const cls = [
          "choice",
          selected && !player.revealed ? "picked" : "",
          isCorrect ? "right" : "",
          isWrong ? "wrong" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<li>
          <button type="button" class="${cls}" data-testid="choice-${esc(choice.key)}" data-key="${esc(choice.key)}" ${player.revealed ? "disabled" : ""}>
            <span class="key">${esc(choice.key)}</span>
            <span>${esc(choice.text)}</span>
          </button>
        </li>`;
      })
      .join("");

    const conf = [1, 2, 3, 4, 5]
      .map(
        (n) =>
          `<button type="button" class="conf ${player.confidence === n ? "on" : ""}" data-testid="confidence-${n}" data-n="${n}" ${player.revealed ? "disabled" : ""}>${n}</button>`,
      )
      .join("");

    const errors = ERROR_CLASSES.map(
      (cls) =>
        `<button type="button" class="err ${player.errorClass === cls ? "on" : ""}" data-testid="error-${cls}" data-err="${cls}">${ERROR_LABELS[cls]}</button>`,
    ).join("");

    const passage = item.passage
      ? `<aside class="passage">
          <p class="eyebrow">Passage</p>
          <h2>${esc(item.passage.title)}</h2>
          <p class="passage-body">${esc(item.passage.body)}</p>
        </aside>`
      : "";

    const reveal = player.revealed
      ? `<div class="reveal">
          <p class="${player.correct ? "ok" : "bad"}" data-testid="reveal-verdict">
            ${player.correct ? "Correct" : "Incorrect"} · answer ${esc(item.correctKey)}
          </p>
          ${cal ? `<p class="cal" data-testid="calibration-note">${esc(cal)}</p>` : ""}
          <p data-testid="reveal-explanation">${esc(item.explanation)}</p>
          ${
            Object.keys(item.distractorRationales).length
              ? `<p class="eyebrow">Why the others are wrong</p>
                 <ul class="why">${Object.entries(item.distractorRationales)
                   .map(([k, t]) => `<li><span class="key">${esc(k)}</span> ${esc(t)}</li>`)
                   .join("")}</ul>`
              : ""
          }
          ${
            player.correct
              ? ""
              : `<p class="eyebrow">Why did you miss this?</p><div class="errs">${errors}</div>`
          }
          <button type="button" class="continue small" data-testid="next-item" ${nextReady ? "" : "disabled"}>
            Next
          </button>
        </div>`
      : `<button type="button" class="continue small" data-testid="submit-answer" ${submitReady ? "" : "disabled"}>
          Submit
        </button>`;

    return `
      <main class="wrap player ${item.passage ? "split" : ""}">
        <header class="bar">
          <p>Item ${sit.cursor + 1} of ${sit.itemIds.length} <span class="muted">(${remaining} left)</span></p>
          <p class="mono" data-testid="timer">${Math.floor(elapsed)}s</p>
          <button type="button" class="text-btn" data-testid="leave-session">Home</button>
        </header>
        <div class="stage">
          ${passage}
          <section>
            <p class="eyebrow">${item.type === "passage_question" ? "Passage question" : "Discrete"} · ${esc(item.conceptId)}</p>
            <h1 class="stem">${esc(item.stem)}</h1>
            <ul class="choices">${choices}</ul>
            <p class="eyebrow">Confidence — required before reveal</p>
            <div class="confs">${conf}</div>
            ${reveal}
            <p class="hint">Keys: A–D answer, 1–5 confidence, Enter submit/next.</p>
          </section>
        </div>
      </main>`;
  }

  function doneHtml(): string {
    const s = ledger.lastSummary;
    if (!s) {
      return `<main class="wrap"><p class="lede">No sitting on this device yet.</p>
        <button type="button" class="continue" data-testid="continue"><span class="continue-title">Continue</span></button></main>`;
    }
    return `
      <main class="wrap">
        <p class="kicker">Sitting closed</p>
        <h1>${s.correct} / ${s.total}</h1>
        <p class="lede">${esc(s.track === "mixed" ? "Mixed retrieval" : s.track)}. Confidence was required before the key. The ledger never left this browser.</p>
        <button type="button" class="continue" data-testid="continue">
          <span class="continue-title">Continue</span>
          <span class="continue-sub">Next retrieve</span>
        </button>
        <button type="button" class="text-btn block" data-testid="leave-session">Home</button>
      </main>`;
  }

  function bindHome(): void {
    root.querySelector("[data-testid=continue]")?.addEventListener("click", () => {
      resumeOrStart();
    });
    root.querySelectorAll<HTMLButtonElement>("[data-track]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = btn.dataset.track as SectionFamily;
        startSitting(track);
      });
    });
  }

  function bindPlayer(item: WebItem): void {
    root.querySelectorAll<HTMLButtonElement>("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (player.revealed) return;
        player.answeredKey = btn.dataset.key ?? null;
        draw();
      });
    });
    root.querySelectorAll<HTMLButtonElement>("[data-n]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (player.revealed) return;
        player.confidence = Number(btn.dataset.n);
        draw();
      });
    });
    root.querySelector("[data-testid=submit-answer]")?.addEventListener("click", () => grade());
    root.querySelector("[data-testid=next-item]")?.addEventListener("click", () => commit());
    root.querySelectorAll<HTMLButtonElement>("[data-err]").forEach((btn) => {
      btn.addEventListener("click", () => {
        player.errorClass = btn.dataset.err as ErrorClass;
        draw();
      });
    });
    root.querySelector("[data-testid=leave-session]")?.addEventListener("click", () => go("#/"));
    void item;
  }

  function onKey(e: KeyboardEvent): void {
    if (routeFromHash() !== "sit") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const item = currentItem();
    if (!item) return;
    const key = e.key.toUpperCase();
    if (!player.revealed && ["A", "B", "C", "D"].includes(key)) {
      const match = item.choices.find((c) => c.key.toUpperCase() === key);
      if (match) {
        e.preventDefault();
        player.answeredKey = match.key;
        draw();
      }
      return;
    }
    if (!player.revealed && ["1", "2", "3", "4", "5"].includes(e.key)) {
      e.preventDefault();
      player.confidence = Number(e.key);
      draw();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!player.revealed) grade();
      else commit();
    }
  }

  function draw(): void {
    const route = routeFromHash();
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    if (route === "sit") {
      const sit = ledger.session;
      const item = currentItem();
      if (!sit || !item) {
        go("#/");
        return;
      }
      root.innerHTML = playerHtml(item, sit);
      bindPlayer(item);
      if (!player.revealed) {
        timer = window.setInterval(() => {
          const node = root.querySelector("[data-testid=timer]");
          if (node) {
            node.textContent = `${Math.floor((Date.now() - player.startedAt) / 1000)}s`;
          }
        }, 250);
      }
      return;
    }
    if (route === "done") {
      root.innerHTML = doneHtml();
      bindHome();
      root.querySelector("[data-testid=leave-session]")?.addEventListener("click", () => go("#/"));
      return;
    }
    root.innerHTML = homeHtml();
    bindHome();
  }

  window.addEventListener("hashchange", draw);
  window.addEventListener("keydown", onKey);
  draw();

  return {
    destroy() {
      window.removeEventListener("hashchange", draw);
      window.removeEventListener("keydown", onKey);
      if (timer !== null) window.clearInterval(timer);
    },
  };
}
