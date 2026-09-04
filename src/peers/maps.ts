import { readFileSync } from "node:fs";
import path from "node:path";

/** OpenMCAT `testedTopicIds` → this taxonomy topic. */
export const OPENMCAT_TOPIC: Record<string, string> = {
  cp_work: "MCAT.FC4.4A.t4",
  cp_gas_phase: "MCAT.FC4.4B.t3",
  cp_electrochemistry: "MCAT.FC4.4C.t4",
  cp_circuit_elements: "MCAT.FC4.4C.t2",
  cp_electrostatics: "MCAT.FC4.4C.t1",
  cp_stoichiometry: "MCAT.FC4.4E.t5",
  cp_acid_base_equilibria: "MCAT.FC5.5A.t1",
  cp_carboxylic_acids: "MCAT.FC5.5D.t9",
  cp_separations_and_purifications: "MCAT.FC5.5C.t1",
  cp_geometrical_optics: "MCAT.FC4.4D.t4",
  bb_amino_acids: "MCAT.FC1.1A.t1",
  bb_protein_structure: "MCAT.FC1.1A.t2",
  bb_control_of_enzyme_activity: "MCAT.FC1.1A.t5",
  bb_principles_of_bioenergetics: "MCAT.FC1.1D.t1",
  bb_glycolysis_gluconeogenesis_and_the_pentose_phosphate_pathway: "MCAT.FC1.1D.t3",
  bb_oxidative_phosphorylation: "MCAT.FC1.1D.t7",
  bb_nucleic_acid_structure_and_function: "MCAT.FC1.1B.t1",
  bb_translation: "MCAT.FC1.1B.t6",
  bb_transcription: "MCAT.FC1.1B.t5",
  bb_mendelian_concepts: "MCAT.FC1.1C.t2",
  ps_cognition: "MCAT.FC6.6B.t2",
  ps_stress: "MCAT.FC6.6C.t2",
  ps_sensory_processing: "MCAT.FC6.6A.t1",
  ps_biological_bases_of_behavior: "MCAT.FC7.7A.t1",
  ps_associative_learning: "MCAT.FC7.7C.t2",
  ps_social_class: "MCAT.FC10.10A.t2",
  ps_memory: "MCAT.FC6.6B.t4",
  ps_theoretical_approaches: "MCAT.FC9.9A.t1",
  ps_psychological_disorders: "MCAT.FC7.7A.t3",
  ps_formation_of_identity: "MCAT.FC8.8A.t2",
};

export const SIRS_TAG: Record<string, string> = {
  sirs_1: "SIRS1",
  sirs_2: "SIRS2",
  sirs_3: "SIRS3",
  sirs_4: "SIRS4",
};

/** AAMC public category codes → taxonomy category prefix. */
export const AAMC_CATEGORY: Record<string, string> = {
  "1A": "MCAT.FC1.1A",
  "1B": "MCAT.FC1.1B",
  "1C": "MCAT.FC1.1C",
  "1D": "MCAT.FC1.1D",
  "2A": "MCAT.FC2.2A",
  "2B": "MCAT.FC2.2B",
  "2C": "MCAT.FC2.2C",
  "3A": "MCAT.FC3.3A",
  "3B": "MCAT.FC3.3B",
  "4A": "MCAT.FC4.4A",
  "4B": "MCAT.FC4.4B",
  "4C": "MCAT.FC4.4C",
  "4D": "MCAT.FC4.4D",
  "4E": "MCAT.FC4.4E",
  "5A": "MCAT.FC5.5A",
  "5B": "MCAT.FC5.5B",
  "5C": "MCAT.FC5.5C",
  "5D": "MCAT.FC5.5D",
  "5E": "MCAT.FC5.5E",
  "6A": "MCAT.FC6.6A",
  "6B": "MCAT.FC6.6B",
  "6C": "MCAT.FC6.6C",
  "7A": "MCAT.FC7.7A",
  "7B": "MCAT.FC7.7B",
  "7C": "MCAT.FC7.7C",
  "8A": "MCAT.FC8.8A",
  "8B": "MCAT.FC8.8B",
  "8C": "MCAT.FC8.8C",
  "9A": "MCAT.FC9.9A",
  "9B": "MCAT.FC9.9B",
  "10A": "MCAT.FC10.10A",
  CARS: "MCAT.CARS",
  HUM: "MCAT.CARS",
  SS: "MCAT.CARS",
  GC: "MCAT.FC4.4E",
  RM: "MCAT.FC9.9A",
};

export const ATTR = {
  openMcat:
    "Source: Open-MCAT (CC BY-NC 4.0, © 2026 Makenzi L. McDermott). Unverified personal study copy.",
  openmcat: "Source: OpenMCAT (AGPL-3.0). Unverified AI practice; not AAMC.",
  ready:
    "Source: ReadyMCAT (CC BY-SA 4.0), grounded in OpenStax/LibreTexts. Unverified.",
  gamsat: "Source: gamsat-trainer original practice (not ACER). Unverified.",
} as const;

type ConvertManifest = {
  openMcat: { questions: number };
  openmcat: { questions: number };
  gamsat: { questions: number };
  readymcat: { questions: number };
};

/** Sit-able peer counts in this repo, not upstream totals. */
export function landscapePeers(): { name: string; items: number }[] {
  const raw = JSON.parse(
    readFileSync(path.join(process.cwd(), "content/peers/CONVERT_MANIFEST.json"), "utf8"),
  ) as ConvertManifest;
  return [
    { name: "Open-MCAT (in this site)", items: raw.openMcat.questions },
    { name: "ReadyMCAT (in this site)", items: raw.readymcat.questions },
    { name: "OpenMCAT (in this site)", items: raw.openmcat.questions },
    { name: "gamsat-trainer (in this site)", items: raw.gamsat.questions },
  ];
}
