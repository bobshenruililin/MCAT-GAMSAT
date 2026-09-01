import { assembleItem, hashStr, mulberry, round1, round2 } from "./item";
import type { Distractor } from "./item";
import type { FactoryItem, TopicNode } from "./types";

function rngFor(topicId: string, index: number, salt = "quant"): () => number {
  return mulberry(hashStr(`${topicId}:${index}:${salt}`));
}

function intRange(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

const RFD = [
  "GAMSAT.S3.rfd.t1",
  "GAMSAT.S3.rfd.t3",
  "GAMSAT.S3.rfd.t6",
  "GAMSAT.S3.rfd.t8",
] as const;

function skill(topicId: string, index: number): string | undefined {
  if (!topicId.startsWith("GAMSAT.S3")) return undefined;
  return RFD[index % RFD.length];
}

function finish(
  topic: TopicNode,
  index: number,
  design: string,
  stem: string,
  correct: string,
  distractors: [Distractor, Distractor, Distractor],
  explanation: string,
  difficulty: number,
): FactoryItem {
  const tagged = stem.includes(`run ${index}`)
    ? stem
    : `${stem.replace(/\?$/, "")} (run ${index})`;
  return assembleItem({
    conceptId: topic.id,
    type: "discrete",
    stem: tagged,
    correct,
    distractors,
    explanation,
    difficulty,
    rotate: hashStr(stem + topic.id) % 4,
    design,
    skillTag: skill(topic.id, index),
    salt: `${topic.id}#${index}`,
  });
}

type QuantFn = (topic: TopicNode, index: number) => FactoryItem;

const kinematics: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const u = intRange(rng, 2, 12);
  const a = intRange(rng, 1, 6);
  const t = intRange(rng, 2, 8);
  const v = u + a * t;
  const s = u * t + 0.5 * a * t * t;
  const mode = index % 3;
  if (mode === 0) {
    return finish(
      topic, index, "kinematics.v=u+at",
      `A cart on a low-friction rail has initial speed ${u} m s^{-1} and constant acceleration ${a} m s^{-2}. Speed after ${t} s is`,
      `${v} m s^{-1}`,
      [
        { text: `${u + a} m s^{-1}`, why: "Adds acceleration once instead of multiplying by time." },
        { text: `${u * t + a} m s^{-1}`, why: "Mixes a displacement-like u t term into a speed equation." },
        { text: `${a * t} m s^{-1}`, why: "Drops the initial speed and reports only Δv." },
      ],
      `Constant acceleration uses v = u + a t. Substituting the stem values gives v = ${u} + ${a}×${t} = ${v} m s^{-1}. The distractors drop u, add a only once, or smuggle a displacement product into a velocity equation. Units remain m s^{-1} because m s^{-2} times s is a speed.`,
      0.28,
    );
  }
  if (mode === 1) {
    return finish(
      topic, index, "kinematics.s=ut+1/2at2",
      `u = ${u} m s^{-1}, a = ${a} m s^{-2}, t = ${t} s. Displacement from the origin in that interval is`,
      `${s} m`,
      [
        { text: `${u * t} m`, why: "Omits the (1/2) a t^{2} contribution." },
        { text: `${u * t + a * t * t} m`, why: "Forgets the 1/2 in (1/2) a t^{2}." },
        { text: `${v} m`, why: "Reports the final speed with a metre label." },
      ],
      `Displacement under constant a is s = u t + (1/2) a t^{2} = ${u}×${t} + 0.5×${a}×${t}×${t} = ${s} m. Dropping the quadratic term or the 1/2 are the usual algebra traps; quoting v confuses the two kinematic outputs.`,
      0.4,
    );
  }
  const v2 = u * u + 2 * a * s;
  return finish(
    topic, index, "kinematics.v2=u2+2as",
    `A runner enters a marked ${s} m straight at ${u} m s^{-1} and accelerates at ${a} m s^{-2}. The value of v² at the end of the straight is`,
    `${v2} m^{2} s^{-2}`,
    [
      { text: `${u * u + a * s} m^{2} s^{-2}`, why: "Uses u² + a s instead of u² + 2 a s." },
      { text: `${u * u + 2 * a} m^{2} s^{-2}`, why: "Drops multiplication by displacement." },
      { text: `${2 * a * s} m^{2} s^{-2}`, why: "Drops the u² term." },
    ],
    `The time-free identity is v² = u² + 2 a s = ${u}² + 2×${a}×${s} = ${v2} m² s^{-2}. Losing the 2, losing s, or losing u² each maps onto a listed distractor.`,
    0.48,
  );
};

const newton: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const m = intRange(rng, 2, 12);
  const a = intRange(rng, 1, 5);
  const g = 10;
  if (index % 2 === 0) {
    const F = m * a;
    return finish(
      topic, index, "newton.F=ma",
      `A ${m} kg block on a frictionless horizontal surface has acceleration ${a} m s^{-2}. The net force is`,
      `${F} N`,
      [
        { text: `${m + a} N`, why: "Adds mass and acceleration instead of multiplying." },
        { text: `${m * g} N`, why: "Quotes weight rather than the horizontal net force." },
        { text: `${a} N`, why: "Drops mass from ΣF = m a." },
      ],
      `Newton’s second law is ΣF = m a = ${m}×${a} = ${F} N. Weight m g = ${m * g} N is vertical and is not the net horizontal force on a frictionless horizontal track.`,
      0.26,
    );
  }
  const mu = round2(0.2 + (index % 4) * 0.1);
  const N = m * g;
  const f = round1(mu * N);
  return finish(
    topic, index, "newton.friction",
    `A ${m} kg crate rests on level ground. Take g = 10 m s^{-2} and μ_s = ${mu}. If the normal force is just the weight, the maximum static-friction magnitude is`,
    `${f} N`,
    [
      { text: `${round1(mu * m)} N`, why: "Forgets to multiply by g when converting mass to weight." },
      { text: `${N} N`, why: "Reports the normal force, not μN." },
      { text: `${m * a} N`, why: "Uses an unrelated m a from a different setup." },
    ],
    `On level ground N = m g = ${m}×10 = ${N} N. The friction ceiling is μN = ${mu}×${N} = ${f} N. Omitting g leaves μ m; quoting N ignores the coefficient.`,
    0.38,
  );
};

const energy: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const m = intRange(rng, 1, 8);
  const v = intRange(rng, 2, 12);
  const h = intRange(rng, 2, 10);
  const g = 10;
  const mode = index % 3;
  if (mode === 0) {
    const ke = 0.5 * m * v * v;
    return finish(
      topic, index, "energy.KE",
      `A ${m} kg probe moves at ${v} m s^{-1}. Translational kinetic energy is`,
      `${ke} J`,
      [
        { text: `${m * v * v} J`, why: "Forgets the 1/2 in (1/2) m v^{2}." },
        { text: `${m * v} J`, why: "Reports momentum with a joule label." },
        { text: `${0.5 * m * v} J`, why: "Uses (1/2) m v instead of (1/2) m v^{2}." },
      ],
      `KE = (1/2) m v^{2} = 0.5×${m}×${v}×${v} = ${ke} J. Dropping 1/2 or a factor of v are the arithmetic traps; m v is momentum, not energy.`,
      0.3,
    );
  }
  if (mode === 1) {
    const pe = m * g * h;
    return finish(
      topic, index, "energy.PE",
      `Take g = 10 m s^{-2}. Gravitational potential energy of a ${m} kg pack raised ${h} m, relative to the floor, is`,
      `${pe} J`,
      [
        { text: `${m * h} J`, why: "Omits g." },
        { text: `${0.5 * m * h * h} J`, why: "Uses a kinetic-looking (1/2) m h^{2}." },
        { text: `${m * g} J`, why: "Quotes weight, not m g h." },
      ],
      `Near Earth, ΔU = m g h = ${m}×10×${h} = ${pe} J with the floor as zero. Forgetting g or inventing (1/2) m h^{2} mixes this with kinetic energy.`,
      0.28,
    );
  }
  const p = m * v;
  return finish(
    topic, index, "momentum.p=mv",
    `A ${m} kg cart moves at constant ${v} m s^{-1}. Linear momentum magnitude is`,
    `${p} kg m s^{-1}`,
    [
      { text: `${0.5 * m * v * v} kg m s^{-1}`, why: "Reports kinetic energy with a momentum unit." },
      { text: `${m + v} kg m s^{-1}`, why: "Adds mass and speed." },
      { text: `${v} kg m s^{-1}`, why: "Drops mass." },
    ],
    `Momentum is p = m v = ${m}×${v} = ${p} kg m s^{-1}. Constant speed means net force is zero, but momentum is still m v.`,
    0.32,
  );
};

const fluids: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const mode = index % 3;
  if (mode === 0) {
    const h = intRange(rng, 2, 20);
    const P = 1000 * 10 * h;
    return finish(
      topic, index, "fluids.hydrostatic",
      `Gauge pressure at depth ${h} m in freshwater (ρ = 1000 kg m^{-3}, g = 10 m s^{-2}) is`,
      `${P} Pa`,
      [
        { text: `${1000 * h} Pa`, why: "Omits g." },
        { text: `${10 * h} Pa`, why: "Omits density." },
        { text: `10000 Pa`, why: "Omits depth and uses ρg only." },
      ],
      `Hydrostatic gauge pressure is ρ g h = 1000×10×${h} = ${P} Pa. Each distractor drops one factor. Atmospheric pressure would be added only for absolute pressure.`,
      0.34,
    );
  }
  if (mode === 1) {
    const Vml = intRange(rng, 1, 8);
    const Fb = 1000 * (Vml * 1e-3) * 10;
    return finish(
      topic, index, "fluids.archimedes",
      `A submerged object displaces ${Vml}×10^{-3} m^{3} of freshwater (ρ = 1000 kg m^{-3}). Take g = 10 m s^{-2}. Buoyant force is`,
      `${Fb} N`,
      [
        { text: `${Vml} N`, why: "Treats the raw 10^{-3} coefficient as a force." },
        { text: `${1000 * Vml} N`, why: "Drops the 10^{-3} conversion and g." },
        { text: `${10 * Vml} N`, why: "Drops density and the cubic-metre conversion." },
      ],
      `Archimedes: F_b = ρ V g = 1000 × ${Vml}×10^{-3} × 10 = ${Fb} N. For a fully submerged object the buoyant force depends on displaced fluid, not on the object's mass.`,
      0.46,
    );
  }
  const a1 = 2;
  const a2 = [1, 4, 5, 8][index % 4];
  const v1 = intRange(rng, 2, 6);
  const v2 = (a1 * v1) / a2;
  return finish(
    topic, index, "fluids.continuity",
    `Incompressible flow: area ${a1}.0 cm^{2} at speed ${v1} cm s^{-1} feeds a ${a2}.0 cm^{2} segment. Speed in the second segment is`,
    `${v2} cm s^{-1}`,
    [
      { text: `${v1} cm s^{-1}`, why: "Ignores area change." },
      { text: `${round2(v1 * a2 / a1)} cm s^{-1}`, why: "Inverts the continuity ratio." },
      { text: `${a1 * a2 * v1} cm s^{-1}`, why: "Multiplies areas instead of using A1 v1 = A2 v2." },
    ],
    `Continuity is A1 v1 = A2 v2, so v2 = (${a1}/${a2})×${v1} = ${v2} cm s^{-1}. Inverting the area ratio is the standard trap. Bernoulli is needed only if the stem asked for pressure.`,
    0.44,
  );
};

const circuits: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const mode = index % 3;
  if (mode === 0) {
    const V = intRange(rng, 4, 24);
    const R = [2, 4, 5, 8, 10, 12][index % 6];
    const I = round2(V / R);
    return finish(
      topic, index, "circuits.ohm",
      `A ${V} V battery is placed across a ${R} Ω resistor. Current is`,
      `${I} A`,
      [
        { text: `${V * R} A`, why: "Multiplies V and R instead of dividing." },
        { text: `${round2(R / V)} A`, why: "Inverts Ohm’s law." },
        { text: `${V} A`, why: "Drops resistance." },
      ],
      `Ohm’s law is I = V/R = ${V}/${R} = ${I} A. Multiplying V R or inverting to R/V are the algebraic flips. In a single-loop ohmic circuit that current is the same everywhere.`,
      0.26,
    );
  }
  if (mode === 1) {
    const r1 = intRange(rng, 2, 8);
    const r2 = intRange(rng, 2, 8);
    return finish(
      topic, index, "circuits.series",
      `Two resistors ${r1} Ω and ${r2} Ω are in series. Equivalent resistance is`,
      `${r1 + r2} Ω`,
      [
        { text: `${round2((r1 * r2) / (r1 + r2))} Ω`, why: "Uses the two-resistor parallel formula." },
        { text: `${Math.min(r1, r2)} Ω`, why: "Reports the smaller resistor only." },
        { text: `${r1 * r2} Ω`, why: "Multiplies the two values." },
      ],
      `Series resistances add: R_s = ${r1} + ${r2} = ${r1 + r2} Ω. Product-over-sum is the parallel formula. Equivalent series resistance is larger than either piece, not equal to the smaller R.`,
      0.3,
    );
  }
  const r1 = [8, 10, 12, 15][index % 4];
  const r2 = [24, 40, 36, 45][index % 4];
  const rp = (r1 * r2) / (r1 + r2);
  return finish(
    topic, index, "circuits.parallel",
    `Two resistors ${r1} Ω and ${r2} Ω are in parallel. Equivalent resistance is`,
    `${rp} Ω`,
    [
      { text: `${r1 + r2} Ω`, why: "Adds them as if they were in series." },
      { text: `${r1 * r2} Ω`, why: "Multiplies them." },
      { text: `${(r1 + r2) / 2} Ω`, why: "Averages the two resistors instead of using the parallel formula." },
    ],
    `For two parallel resistors, R_p = R1 R2 / (R1 + R2) = ${r1 * r2}/${r1 + r2} = ${rp} Ω. Adding treats them as series. Parallel equivalent is less than the smaller branch (${Math.min(r1, r2)} Ω), so ${r1 + r2} Ω is impossible.`,
    0.4,
  );
};

const gas: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const mode = index % 2;
  if (mode === 0) {
    const n = intRange(rng, 1, 4);
    const T = [273, 300, 310][index % 3];
    const V = intRange(rng, 10, 40);
    const R = 0.082;
    const P = round2((n * R * T) / V);
    return finish(
      topic, index, "gas.ideal-PV=nRT",
      `n = ${n} mol of an ideal gas occupies ${V} L at ${T} K. Take R = 0.082 L atm K^{-1} mol^{-1}. Pressure is closest to`,
      `${P} atm`,
      [
        { text: `${round2(n * R * T)} atm`, why: "Omits division by V." },
        { text: `${round2((n * T) / V)} atm`, why: "Omits R." },
        { text: `${round2((n * R) / V)} atm`, why: "Omits T." },
      ],
      `The ideal-gas law is P = n R T / V = ${n}×0.082×${T}/${V} ≈ ${P} atm. Each distractor drops one symbol from P V = n R T. Temperature must be in kelvin, which the stem already used.`,
      0.42,
    );
  }
  const p1 = intRange(rng, 1, 4);
  const v1 = intRange(rng, 2, 8);
  const v2 = v1 * 2;
  const p2 = round2((p1 * v1) / v2);
  return finish(
    topic, index, "gas.boyle",
    `Boyle’s law, isothermal ideal gas: P1 = ${p1} atm, V1 = ${v1} L, V2 = ${v2} L. P2 is`,
    `${p2} atm`,
    [
      { text: `${p1 * 2} atm`, why: "Doubles pressure because volume doubled." },
      { text: `${p1} atm`, why: "Ignores the volume change." },
      { text: `${p1 * v2} atm`, why: "Multiplies P1 by V2 instead of using P1 V1 = P2 V2." },
    ],
    `At constant T and n, P1 V1 = P2 V2 so P2 = ${p1}×${v1}/${v2} = ${p2} atm. Doubling volume halves pressure; it does not double it.`,
    0.36,
  );
};

const acid: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const mode = index % 3;
  if (mode === 0) {
    const exp = intRange(rng, 2, 5);
    const pH = exp;
    return finish(
      topic, index, "acid.strong-pH",
      `A strong monoprotic acid is 1.0 × 10^{-${exp}} M. Ignoring water autoionization, pH is`,
      `${pH}`,
      [
        { text: `${14 - exp}`, why: "Reports pOH of a strong acid as if it were pH." },
        { text: `${exp + 1}`, why: "Off-by-one on the exponent." },
        { text: `7`, why: "Assumes any dilute solution is neutral." },
      ],
      `For a strong monoprotic acid, [H+] = C = 1.0×10^{-${exp}} M, so pH = ${exp} when water’s contribution is ignored. pOH = 14 − pH would be ${14 - exp}, which is the complementary number, not the pH. Neutrality is pH 7 only when [H+] = 10^{-7}.`,
      0.3,
    );
  }
  if (mode === 1) {
    const pKa = round2(4.0 + (index % 8) * 0.2);
    const ratio = [1, 2, 10][index % 3];
    const logR = ratio === 1 ? 0 : ratio === 2 ? 0.3 : 1;
    const pH = round1(pKa + logR);
    return finish(
      topic, index, "acid.HH",
      `A buffer has pKa = ${pKa} and [A−]/[HA] = ${ratio}. Henderson–Hasselbalch pH is closest to`,
      `${pH}`,
      [
        { text: `${round1(pKa - logR)}`, why: "Subtracts log([A−]/[HA]) instead of adding." },
        { text: `${pKa}`, why: "Ignores the ratio and quotes pKa as pH." },
        { text: `${round1(14 - pKa)}`, why: "Converts pKa to pKb and reports that as pH." },
      ],
      `pH = pKa + log10([A−]/[HA]). log10(${ratio}) = ${logR}, so pH ≈ ${pKa} + ${logR} = ${pH}. Subtracting the log inverts the conjugate ratio. pH equals pKa only when the ratio is 1.`,
      0.5,
    );
  }
  const mmolH = intRange(rng, 5, 20);
  const mmolOH = intRange(rng, 2, mmolH - 1);
  const V = 0.1;
  const excess = mmolH - mmolOH;
  const pH = round1(-Math.log10(excess / 1000 / V));
  return finish(
    topic, index, "acid.strong-titration",
    `${mmolH} mmol of strong acid is mixed with ${mmolOH} mmol of strong base and diluted to 0.100 L. The pH is closest to`,
    `${pH}`,
    [
      { text: `7.0`, why: "Assumes any acid–base mix is neutral." },
      { text: `${round1(-Math.log10(mmolH / 1000 / V))}`, why: "Ignores the base and uses the original acid only." },
      { text: `${round1(-Math.log10(mmolOH / 1000 / V))}`, why: "Treats leftover base as leftover acid." },
    ],
    `Strong acid/base neutralization leaves ${excess} mmol of H+ in 0.100 L, so [H+] = ${round2(excess / 1000 / V)} M and pH ≈ ${pH}. The mix is not neutral because the millimoles are unequal. Using only the acid millimoles ignores the titration.`,
    0.58,
  );
};

const ksp: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const s = [1, 2, 5][index % 3] * 10 ** (-intRange(rng, 3, 5));
  const ksp = s * s;
  const sci = ksp.toExponential(1);
  return finish(
    topic, index, "ksp.AB",
    `A sparingly soluble salt AB has molar solubility ${s.toExponential(1)} M in pure water. If AB(s) ⇌ A+ + B−, Ksp is`,
    sci,
    [
      { text: s.toExponential(1), why: "Reports s itself instead of s²." },
      { text: (2 * s).toExponential(1), why: "Reports 2s as if Ksp were 2s." },
      { text: (s * s * s).toExponential(1), why: "Cubes s as if the salt were AB2." },
    ],
    `For 1:1 AB, Ksp = s². With s = ${s.toExponential(1)} M, Ksp = ${sci}. Cubing would be appropriate for a 1:2 salt (Ksp = 4s³), not AB. Ksp is not equal to the solubility itself.`,
    0.52,
  );
};

const electrochem: QuantFn = (topic, index) => {
  const n = [1, 2, 3][index % 3];
  const t = [1930, 965, 2895][index % 3];
  const F = 96500;
  const moles = round2((t * 1) / (n * F));
  return finish(
    topic, index, "electrochem.faraday",
    `A current of 1.00 A runs for ${t} s through an electrolytic cell reducing M^{n+} to M (n = ${n}). Faradays of charge, to two decimals, and moles of M produced are related by mol = It/(nF). Taking F = 96500 C mol^{-1}, moles of M is closest to`,
    `${moles} mol`,
    [
      { text: `${round2(t / F)} mol`, why: "Drops n, treating every ion as n = 1." },
      { text: `${round2((t * n) / F)} mol`, why: "Multiplies by n instead of dividing." },
      { text: `${n} mol`, why: "Reports the charge number as a mole count." },
    ],
    `Charge Q = I t = ${t} C. Moles of metal = Q/(n F) = ${t}/(${n}×96500) ≈ ${moles} mol. Dividing by n is required because n electrons are consumed per metal atom. Multiplying by n inverts Faraday’s relation.`,
    0.55,
  );
};

const optics: QuantFn = (topic, index) => {
  const mode = index % 3;
  if (mode === 0) {
    const f = [10, 20, 25, 50][index % 4];
    const o = f * 2;
    const i = (f * o) / (o - f);
    return finish(
      topic, index, "optics.thin-lens",
      `A thin lens has f = ${f} cm. An object sits at ${o} cm. Image distance from the thin-lens equation 1/f = 1/o + 1/i is`,
      `${i} cm`,
      [
        { text: `${o - f} cm`, why: "Subtracts f from o instead of using reciprocals." },
        { text: `${f} cm`, why: "Quotes the focal length as the image distance." },
        { text: `${o} cm`, why: "Quotes the object distance as the image distance." },
      ],
      `1/i = 1/f − 1/o = 1/${f} − 1/${o}. Because o = 2f, this is the classic 2f setup: i = ${i} cm, a real image at 2f. Subtracting lengths instead of taking reciprocals is not the thin-lens equation.`,
      0.48,
    );
  }
  if (mode === 1) {
    const nMed = round2(1.3 + (index % 4) * 0.1);
    return finish(
      topic, index, "optics.snell-normal",
      `Light in air (n = 1.00) hits a medium with n = ${nMed} at 0° from the normal. The refracted angle from the normal is`,
      `0°`,
      [
        { text: `90°`, why: "Confuses normal incidence with glancing incidence." },
        { text: `${round1(Math.asin(1 / nMed) * 180 / Math.PI)}°`, why: "Computes a critical angle instead." },
        { text: `30°`, why: "Invented a default refraction angle." },
      ],
      `Snell’s law is n1 sin θ1 = n2 sin θ2. If θ1 = 0, sin 0 = 0, so θ2 = 0 regardless of n2. The ray along the normal does not bend. Critical angle formulas apply to internal incidence at the threshold for TIR, not to this setup.`,
      0.34,
    );
  }
  const nGlass = [1.33, 1.5, 1.6][index % 3];
  const sin2 = round2(0.5 / nGlass);
  return finish(
    topic, index, "optics.snell-30",
    `Air-to-glass, θ1 = 30°, n2 = ${nGlass.toFixed(2)} (item ${index}). Using n1 sin θ1 = n2 sin θ2 and sin 30° = 0.50, sin θ2 is`,
    `${sin2}`,
    [
      { text: `0.50`, why: "Forgets to divide by n2." },
      { text: `${round2(0.5 * nGlass)}`, why: "Multiplies 0.50 by n2 instead of dividing." },
      { text: `${nGlass.toFixed(2)}`, why: "Reports the index as if it were a sine." },
    ],
    `sin θ2 = n1 sin θ1 / n2 = 1.00×0.50 / ${nGlass} = ${sin2}. Multiplying by n2 inverts Snell. The index is not itself a sine.`,
    0.46,
  );
};

const waves: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const mode = index % 2;
  if (mode === 0) {
    const f = [100, 200, 250, 500][index % 4];
    const lam = [0.5, 1, 2, 4][index % 4];
    const v = f * lam;
    return finish(
      topic, index, "waves.v=fλ",
      `A wave has frequency ${f} Hz and wavelength ${lam} m. Wave speed is`,
      `${v} m s^{-1}`,
      [
        { text: `${f / lam} m s^{-1}`, why: "Divides f by λ instead of multiplying." },
        { text: `${f + lam} m s^{-1}`, why: "Adds frequency and wavelength." },
        { text: `${lam} m s^{-1}`, why: "Quotes wavelength as a speed." },
      ],
      `v = f λ = ${f}×${lam} = ${v} m s^{-1}. Dividing instead of multiplying inverts the definition. Period would be 1/f, which is not asked here.`,
      0.28,
    );
  }
  const vs = 340;
  const vo = intRange(rng, 10, 40);
  const f = 400;
  const fobs = round1(f * (vs + vo) / vs);
  return finish(
    topic, index, "waves.doppler",
    `Source at rest emits 400 Hz. Observer runs toward it at ${vo} m s^{-1}. Take v_sound = 340 m s^{-1}. Observed frequency is closest to`,
    `${fobs} Hz`,
    [
      { text: `${f} Hz`, why: "Ignores relative motion." },
      { text: `${round1(f * vs / (vs + vo))} Hz`, why: "Puts the observer speed in the denominator as if the source were moving." },
      { text: `${f + vo} Hz`, why: "Adds speed to frequency with mixed units." },
    ],
    `For a moving observer toward a stationary source, f' = f (v + vo)/v = 400×(340+${vo})/340 ≈ ${fobs} Hz. Source motion would change the denominator. Adding 400 Hz to ${vo} m s^{-1} is dimensionally illegal.`,
    0.58,
  );
};

const nuclear: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const n = intRange(rng, 1, 4);
  const left = round2(100 / 2 ** n);
  return finish(
    topic, index, "nuclear.half-life",
    `A sample starts at 100 Bq. After ${n} half-lives the activity is`,
    `${left} Bq`,
    [
      { text: `${100 - 50 * n} Bq`, why: "Subtracts 50 Bq per half-life instead of halving." },
      { text: `${100 / n} Bq`, why: "Divides by the number of half-lives." },
      { text: `${100 * n} Bq`, why: "Multiplies activity by the number of half-lives." },
    ],
    `Each half-life multiplies activity by 1/2, so after ${n} half-lives the activity is 100 / 2^${n} = ${left} Bq. Linear subtraction is the usual trap. Activity falls exponentially, not by a constant number of becquerels per interval.`,
    0.36,
  );
};

const mm: QuantFn = (topic, index) => {
  const Km = [0.5, 1, 2, 4][index % 4];
  const V = [10, 20, 40, 50][index % 4];
  const s = Km;
  const v = V / 2;
  return finish(
    topic, index, "enzyme.MM-half",
    `A Michaelis–Menten enzyme has Km = ${Km} mM and Vmax = ${V} μM s^{-1}. Initial velocity at [S] = ${s} mM is`,
    `${v} μM s^{-1}`,
    [
      { text: `${V} μM s^{-1}`, why: "Quotes Vmax as if the enzyme were saturated at [S] = Km." },
      { text: `${V * 2} μM s^{-1}`, why: "Doubles Vmax." },
      { text: `${Km} μM s^{-1}`, why: "Reports Km with a velocity unit." },
    ],
    `v = Vmax [S]/(Km + [S]). At [S] = Km this is Vmax/2 = ${V}/2 = ${v} μM s^{-1}. That identity is the definition of Km, not a coincidence. Vmax is approached only as [S] >> Km.`,
    0.4,
  );
};

const hw: QuantFn = (topic, index) => {
  const p = round2(0.1 + (index % 8) * 0.1);
  const q = round2(1 - p);
  const mode = index % 2;
  if (mode === 0) {
    const het = round2(2 * p * q);
    return finish(
      topic, index, "genetics.HW-2pq",
      `A two-allele locus is in Hardy–Weinberg equilibrium with p = ${p}. The expected heterozygote frequency is`,
      `${het}`,
      [
        { text: `${round2(p * q)}`, why: "Computes pq instead of 2pq." },
        { text: `${round2(p * p)}`, why: "Reports p², the homozygous p frequency." },
        { text: `${p}`, why: "Quotes the allele frequency as a genotype frequency." },
      ],
      `HWE heterozygotes are 2pq = 2×${p}×${q} = ${het}. Forgetting the 2 is the standard miss. p² is the p/p homozygote class, not the heterozygotes. Allele frequency p is not a genotype frequency.`,
      0.44,
    );
  }
  const p2 = round2(p * p);
  return finish(
    topic, index, "genetics.HW-p2",
    `Same HWE locus, p = ${p}. Expected frequency of the p/p homozygote is`,
    `${p2}`,
    [
      { text: `${p}`, why: "Quotes allele frequency." },
      { text: `${round2(2 * p * q)}`, why: "Reports the heterozygote term 2pq." },
      { text: `${q}`, why: "Quotes the complementary allele frequency." },
    ],
    `HWE p/p homozygotes are p² = ${p}² = ${p2}. 2pq is the heterozygote class. The allele frequency p is the square root of that genotype frequency only in this special case, not the genotype frequency itself.`,
    0.4,
  );
};

const dilut: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const m1 = [1, 2, 5, 10][index % 4];
  const v1 = intRange(rng, 10, 50);
  const v2 = v1 * [2, 5, 10][index % 3];
  const m2 = round2((m1 * v1) / v2);
  return finish(
    topic, index, "chem.dilution",
    `C1 V1 = C2 V2: ${m1}.00 M stock, ${v1} mL diluted to ${v2} mL. Final concentration is`,
    `${m2} M`,
    [
      { text: `${m1} M`, why: "Ignores dilution." },
      { text: `${round2(m1 * v2 / v1)} M`, why: "Inverts the dilution ratio, concentrating instead of diluting." },
      { text: `${v2 / v1} M`, why: "Reports the dilution factor as a molarity." },
    ],
    `C2 = C1 V1 / V2 = ${m1}×${v1}/${v2} = ${m2} M. Inverting the volumes would describe a concentration step, not a dilution. The factor ${v2 / v1} is dimensionless, not a molarity.`,
    0.32,
  );
};

const thermo: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const H = intRange(rng, -80, -10);
  const S = intRange(rng, -50, 50) || 10;
  const T = 298;
  const G = round1(H - (T * S) / 1000);
  return finish(
    topic, index, "thermo.gibbs",
    `ΔH = ${H} kJ mol^{-1}, ΔS = ${S} J mol^{-1} K^{-1}, T = 298 K. ΔG ≈ ΔH − TΔS is closest to`,
    `${G} kJ mol^{-1}`,
    [
      { text: `${round1(H - T * S)} kJ mol^{-1}`, why: "Forgot to convert J to kJ, so TΔS is 1000× too large." },
      { text: `${H} kJ mol^{-1}`, why: "Quotes ΔH and ignores entropy." },
      { text: `${round1(H + (T * S) / 1000)} kJ mol^{-1}`, why: "Adds TΔS instead of subtracting." },
    ],
    `Convert ΔS to kJ: ${S}/1000 kJ mol^{-1} K^{-1}. Then ΔG = ${H} − 298×${S}/1000 ≈ ${G} kJ mol^{-1}. The sign of the TΔS term is a minus. Leaving ΔS in joules inflates TΔS by 1000.`,
    0.55,
  );
};

const nernst: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const ratio = intRange(rng, 4, 20);
  return finish(
    topic, index, "nernst.K+",
    `A simplified 58 mV Nernst factor at room temperature: E_K ≈ 58 log10([K]_o/[K]_i) mV with [K]_o/[K]_i = 1/${ratio} (inside high). The potassium equilibrium potential is closest to`,
    `${round1(58 * Math.log10(1 / ratio))} mV`,
    [
      { text: `${round1(58 * Math.log10(ratio))} mV`, why: "Inverts the concentration ratio." },
      { text: `0 mV`, why: "Assumes equilibrium potential is always zero." },
      { text: `+58 mV`, why: "Quotes the 58 mV factor as the potential." },
    ],
    `log10(1/${ratio}) is negative, so E_K is negative, about ${round1(58 * Math.log10(1 / ratio))} mV. Inverting the ratio flips the sign, the classic inside-vs-outside trap. The 58 mV prefactor is not itself the membrane potential.`,
    0.6,
  );
};

const work: QuantFn = (topic, index) => {
  const rng = rngFor(topic.id, index);
  const F = intRange(rng, 5, 40);
  const d = intRange(rng, 2, 12);
  const mode = index % 2;
  if (mode === 0) {
    return finish(
      topic, index, "work.W=Fd",
      `A constant ${F} N force pushes a crate ${d} m in the direction of the force. Work by that force is`,
      `${F * d} J`,
      [
        { text: `${F} J`, why: "Drops the displacement." },
        { text: `${d} J`, why: "Drops the force." },
        { text: `${F + d} J`, why: "Adds force and displacement." },
      ],
      `W = F d cos0° = ${F}×${d} = ${F * d} J. Cosine is 1 because force and displacement are aligned. Adding F and d is dimensionally illegal.`,
      0.24,
    );
  }
  const P = F * intRange(rng, 1, 5);
  const v = intRange(rng, 1, 5);
  return finish(
    topic, index, "work.power",
    `A force of ${F} N moves a load at constant ${v} m s^{-1} in the force direction. Instantaneous power is`,
    `${F * v} W`,
    [
      { text: `${F} W`, why: "Drops velocity." },
      { text: `${F / v} W`, why: "Divides instead of multiplying." },
      { text: `${P} W`, why: "Uses an unrelated product from the seed." },
    ],
    `Power is P = F v = ${F}×${v} = ${F * v} W when F and v are parallel. Dividing F by v is not the mechanical-power identity.`,
    0.34,
  );
};

const shm: QuantFn = (topic, index) => {
  const k = [20, 50, 80, 100][index % 4];
  const m = [0.2, 0.5, 1, 2][index % 4];
  const T = round2(2 * Math.PI * Math.sqrt(m / k));
  return finish(
    topic, index, "shm.spring-T",
    `A mass-spring oscillator has m = ${m} kg and k = ${k} N m^{-1}. Period T = 2π √(m/k) is closest to`,
    `${T} s`,
    [
      { text: `${round2(2 * Math.PI * Math.sqrt(k / m))} s`, why: "Inverts m/k under the square root." },
      { text: `${round2(Math.sqrt(m / k))} s`, why: "Drops the 2π." },
      { text: `${round2(2 * Math.PI * m / k)} s`, why: "Drops the square root." },
    ],
    `T = 2π √(m/k) = 2π √(${m}/${k}) ≈ ${T} s. Inverting to √(k/m) gives a frequency-like quantity, not the period. Dropping 2π or the square root are the two formula fragments.`,
    0.5,
  );
};

const photo: QuantFn = (topic, index) => {
  const f = (5 + (index % 6)) * 1e14;
  const h = 4.14e-15;
  const phi = round1(1 + (index % 5) * 0.4);
  const E = round2(h * f);
  const K = round2(Math.max(E - phi, 0.1));
  return finish(
    topic, index, "photoelectric.Kmax",
    `A photon of energy ${E} eV hits a metal with work function ${phi} eV. Maximum photoelectron kinetic energy is`,
    `${K} eV`,
    [
      { text: `${E} eV`, why: "Ignores the work function." },
      { text: `${phi} eV`, why: "Quotes φ as Kmax." },
      { text: `${round2(E + phi)} eV`, why: "Adds φ instead of subtracting." },
    ],
    `Einstein’s relation is Kmax = hf − φ = ${E} − ${phi} = ${K} eV. Adding φ inverts the energy bookkeeping. Kmax is not the photon energy unless φ is zero.`,
    0.5,
  );
};

const colligative: QuantFn = (topic, index) => {
  const i = [1, 2, 3][index % 3];
  const m = round2(0.25 + (index % 4) * 0.25);
  const kf = 1.86;
  const dT = round2(i * kf * m);
  return finish(
    topic, index, "colligative.freezing",
    `Freezing-point depression: i = ${i}, Kf = 1.86 °C kg mol^{-1}, molality = ${m} m. ΔTf is`,
    `${dT} °C`,
    [
      { text: `${round2(kf * m)} °C`, why: "Drops the van’t Hoff factor i." },
      { text: `${round2(i * m)} °C`, why: "Drops Kf." },
      { text: `${round2(i * kf)} °C`, why: "Drops molality." },
    ],
    `ΔTf = i Kf m = ${i}×1.86×${m} = ${dT} °C. Forgetting i treats the solute as nonelectrolyte. This is a depression: the freezing point falls by ΔTf, it does not rise.`,
    0.45,
  );
};

const QUANT_MAP: { test: (id: string) => boolean; fn: QuantFn }[] = [
  { test: (id) => /FC4\.4A\.t1|S3\.phys\.t1|S3\.phys\.t2/.test(id), fn: kinematics },
  { test: (id) => /FC4\.4A\.t2|FC4\.4A\.t3|S3\.phys\.t3|S3\.phys\.t7/.test(id), fn: newton },
  { test: (id) => /FC4\.4A\.t4|FC4\.4A\.t5|S3\.phys\.t4|S3\.phys\.t5/.test(id), fn: energy },
  { test: (id) => /FC4\.4A\.t6|S3\.phys\.t8/.test(id), fn: shm },
  { test: (id) => /FC4\.4B|S3\.phys\.t20|S3\.bio\.t16/.test(id), fn: fluids },
  { test: (id) => /FC4\.4C\.t2|S3\.phys\.t14|S3\.phys\.t15/.test(id), fn: circuits },
  { test: (id) => /FC4\.4C\.t1|FC4\.4C\.t3|S3\.phys\.t13|S3\.phys\.t16/.test(id), fn: circuits },
  { test: (id) => /FC4\.4C\.t4|S3\.chem\.t16|S3\.chem\.t17/.test(id), fn: electrochem },
  { test: (id) => /FC4\.4B\.t3|S3\.chem\.t9|S3\.phys\.t19/.test(id), fn: gas },
  { test: (id) => /FC4\.4D\.t1|S3\.phys\.t9|S3\.phys\.t10/.test(id), fn: waves },
  { test: (id) => /FC4\.4D\.t2|FC4\.4D\.t4|S3\.phys\.t11|S3\.phys\.t12/.test(id), fn: optics },
  { test: (id) => /FC4\.4E\.t1|S3\.phys\.t21|S3\.phys\.t23/.test(id), fn: nuclear },
  { test: (id) => /FC4\.4E\.t2|S3\.phys\.t22/.test(id), fn: photo },
  { test: (id) => /FC5\.5A\.t1|FC5\.5A\.t4|S3\.chem\.t13|S3\.chem\.t14|S3\.bio\.t28/.test(id), fn: acid },
  { test: (id) => /FC5\.5A\.t3|S3\.chem\.t15/.test(id), fn: ksp },
  { test: (id) => /FC5\.5A\.t2|S3\.chem\.t8/.test(id), fn: dilut },
  { test: (id) => /FC1\.1A\.t5|S3\.bio\.t4|S3\.chem\.t18/.test(id), fn: mm },
  { test: (id) => /FC1\.1C\.t4|S3\.bio\.t11/.test(id), fn: hw },
  { test: (id) => /FC1\.1D\.t1|S3\.chem\.t10|S3\.chem\.t11/.test(id), fn: thermo },
  { test: (id) => /FC3\.3A\.t3|FC4\.4C\.t5|S3\.bio\.t18/.test(id), fn: nernst },
  { test: (id) => /S3\.chem\.t28/.test(id), fn: colligative },
  { test: (id) => /S3\.phys\.t6/.test(id), fn: newton },
  { test: (id) => /S3\.phys\.t18/.test(id), fn: energy },
  { test: (id) => /S3\.phys\.t24|S3\.phys\.t26/.test(id), fn: kinematics },
  { test: (id) => /FC4\.4E\.t5|S3\.chem\.t7/.test(id), fn: dilut },
  { test: (id) => /work|FC4\.4A\.t4/.test(id), fn: work },
];

export function tryQuant(topic: TopicNode, index: number): FactoryItem | null {
  for (const row of QUANT_MAP) {
    if (row.test(topic.id)) return row.fn(topic, index);
  }
  return null;
}
