#!/usr/bin/env python3
"""Emit content/taxonomy.json from the AAMC/ACER outlines.

AI-emitted, verify against official outline.
"""

from __future__ import annotations

import json
from pathlib import Path

HEADER = "AI-emitted, verify against official outline."

# Current AAMC PDF (What's on the MCAT Exam): four sections equal; FC percents within section.
MCAT_SECTION = 0.25
FC_WEIGHT = {
    "FC1": MCAT_SECTION * 0.55,  # B/B
    "FC2": MCAT_SECTION * 0.20,
    "FC3": MCAT_SECTION * 0.25,
    "FC4": MCAT_SECTION * 0.40,  # C/P
    "FC5": MCAT_SECTION * 0.60,
    "FC6": MCAT_SECTION * 0.25,  # P/S
    "FC7": MCAT_SECTION * 0.35,
    "FC8": MCAT_SECTION * 0.20,
    "FC9": MCAT_SECTION * 0.15,
    "FC10": MCAT_SECTION * 0.05,
}
CARS_WEIGHT = MCAT_SECTION
# GAMSAT overall = (S1 + S2 + 2*S3)/4
GAMSAT_S1 = 0.25
GAMSAT_S2 = 0.25
GAMSAT_S3 = 0.50
S3_BIO = GAMSAT_S3 * 0.40
S3_CHEM = GAMSAT_S3 * 0.40
S3_PHYS = GAMSAT_S3 * 0.20


def split(weight: float, n: int) -> list[float]:
    if n <= 0:
        return []
    parts = [round(weight / n, 12)] * (n - 1)
    parts.append(round(weight - sum(parts), 12))
    return parts


def node(id: str, parent_id: str | None, exam: str, level: str, name: str, description: str, exam_weight: float) -> dict:
    return {
        "id": id,
        "parent_id": parent_id,
        "exam": exam,
        "level": level,
        "name": name,
        "description": description,
        "exam_weight": exam_weight,
    }


def expand(parent_id: str, exam: str, level: str, items: list[tuple[str, str, str]], weights: list[float]) -> list[dict]:
    out = []
    for (slug, name, desc), w in zip(items, weights, strict=True):
        out.append(node(f"{parent_id}.{slug}" if level != "section" else slug, parent_id if level != "section" else None, exam, level, name, desc, w))
    return out


# --- MCAT AAMC topic headings (What's on the MCAT Exam) ---

MCAT_FC = {
    "FC1": (
        "Foundational Concept 1",
        "Biomolecules have unique properties that determine how they contribute to the structure and function of cells and how they participate in the processes necessary to maintain life.",
        [
            (
                "1A",
                "Structure and function of proteins and their constituent amino acids",
                "Amino acids, protein structure, non-enzymatic protein function, enzymes, and control of enzyme activity.",
                [
                    ("t1", "Amino Acids", "Absolute configuration, dipolar ions, classification, cysteine linkage, peptide bond, hydrolysis."),
                    ("t2", "Protein Structure", "Primary through quaternary structure, conformational stability, isoelectric point, electrophoresis."),
                    ("t3", "Non-Enzymatic Protein Function", "Binding, immune, motor, and structural protein roles."),
                    ("t4", "Enzyme Structure and Function", "Catalysis, classification, specificity, active-site and induced-fit models, cofactors."),
                    ("t5", "Control of Enzyme Activity", "Michaelis–Menten, cooperativity, inhibition types, allostery, zymogens."),
                ],
            ),
            (
                "1B",
                "Transmission of genetic information from the gene to the protein",
                "Nucleic acids, replication, repair, the genetic code, transcription, translation, and regulation.",
                [
                    ("t1", "Nucleic Acid Structure and Function", "Nucleotides, Watson–Crick DNA, base pairing, denaturation and hybridization."),
                    ("t2", "DNA Replication", "Semiconservative replication, enzymes, origins, telomeres."),
                    ("t3", "Repair of DNA", "Mismatch, nucleotide-excision, and related repair during and after replication."),
                    ("t4", "Genetic Code", "Codons, degeneracy, start and stop, wobble."),
                    ("t5", "Transcription", "mRNA, tRNA, rRNA, eukaryotic processing, spliceosomes."),
                    ("t6", "Translation", "Ribosomes, initiation/elongation/termination, post-translational modification."),
                    ("t7", "Eukaryotic Chromosome Organization", "Nucleosomes, heterochromatin, telomeres, centromeres."),
                    ("t8", "Control of Gene Expression in Prokaryotes", "Operons, Jacob–Monod, positive and negative control."),
                    ("t9", "Control of Gene Expression in Eukaryotes", "Transcription factors, chromatin, methylation, noncoding RNA, oncogenes."),
                    ("t10", "Recombinant DNA and Biotechnology", "Restriction enzymes, cloning, PCR, hybridization, expression systems, sequencing."),
                ],
            ),
            (
                "1C",
                "Transmission of heritable information from generation to generation and the processes that increase genetic diversity",
                "Mendelian genetics, meiosis, analytic methods, and evolution.",
                [
                    ("t1", "Evidence that DNA is Genetic Material", "Classic experiments establishing DNA as the hereditary molecule."),
                    ("t2", "Mendelian Concepts", "Gene, allele, dominance patterns, penetrance, expressivity."),
                    ("t3", "Meiosis and Other Factors Affecting Genetic Variability", "Meiosis vs mitosis, linkage, recombination, sex linkage, mutation, extranuclear inheritance."),
                    ("t4", "Analytic Methods", "Hardy–Weinberg, testcross, gene mapping, biometry."),
                    ("t5", "Evolution", "Natural selection, fitness, speciation, drift, bottlenecks."),
                ],
            ),
            (
                "1D",
                "Principles of bioenergetics and fuel molecule metabolism",
                "Thermodynamics of ATP, carbohydrate and fat metabolism, and hormonal integration.",
                [
                    ("t1", "Principles of Bioenergetics", "Free energy, ATP, phosphoryl transfer, biological redox, flavoproteins."),
                    ("t2", "Carbohydrates", "Nomenclature, stereochemistry, glycoside linkage, mono/di/polysaccharides."),
                    ("t3", "Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway", "Aerobic and anaerobic glycolysis, gluconeogenesis, PPP."),
                    ("t4", "Principles of Metabolic Regulation", "Steady state, glycogen metabolism, hormonal and allosteric control."),
                    ("t5", "Citric Acid Cycle", "Acetyl-CoA, cycle reactions, regulation, net yield."),
                    ("t6", "Metabolism of Fatty Acids and Proteins", "Beta-oxidation, ketones, lipogenesis, amino-acid catabolism."),
                    ("t7", "Oxidative Phosphorylation", "ETC, chemiosmosis, uncouplers, apoptosis and oxidative stress."),
                    ("t8", "Hormonal Regulation and Integration of Metabolism", "Tissue-specific metabolism, fuel hormones, obesity."),
                ],
            ),
        ],
    ),
    "FC2": (
        "Foundational Concept 2",
        "Highly organized assemblies of molecules, cells, and organs interact to carry out the functions of living organisms.",
        [
            (
                "2A",
                "Assemblies of molecules, cells, and groups of cells within unicellular and multicellular organisms",
                "Membranes, organelles, cytoskeleton, and tissues.",
                [
                    ("t1", "Plasma Membrane", "Lipids, fluid mosaic, transport, membrane potential, junctions."),
                    ("t2", "Membrane-Bound Organelles and Defining Characteristics of Eukaryotic Cells", "Nucleus, mitochondria, ER, Golgi, lysosomes, peroxisomes."),
                    ("t3", "Cytoskeleton", "Microfilaments, microtubules, intermediate filaments, cilia, centrioles."),
                    ("t4", "Tissues Formed From Eukaryotic Cells", "Epithelium and connective tissue."),
                ],
            ),
            (
                "2B",
                "The structure, growth, physiology, and genetics of prokaryotes and viruses",
                "Cell theory, bacteria, archaea, and viruses.",
                [
                    ("t1", "Cell Theory", "History and impact of cell theory."),
                    ("t2", "Classification and Structure of Prokaryotic Cells", "Domains, shapes, cell wall, flagella."),
                    ("t3", "Growth and Physiology of Prokaryotic Cells", "Fission, growth phases, aerobes/anaerobes, antibiotic resistance."),
                    ("t4", "Genetics of Prokaryotic Cells", "Plasmids, transformation, conjugation, transposons."),
                    ("t5", "Virus Structure", "Capsid, envelope, bacteriophage, genome types."),
                    ("t6", "Viral Life Cycle", "Lytic/lysogenic, transduction, retroviruses, prions and viroids."),
                ],
            ),
            (
                "2C",
                "Processes of cell division, differentiation, and specialization",
                "Mitosis, development, and cell specialization.",
                [
                    ("t1", "Mitosis", "Cell-cycle phases, mitotic structures, checkpoints, cancer."),
                    ("t2", "Biosignalling", "Receptor classes relevant to growth and differentiation."),
                    ("t3", "Reproductive System — Gametogenesis", "Meiotic production of ovum and sperm."),
                    ("t4", "Embryogenesis", "Fertilization through germ layers and neurulation."),
                    ("t5", "Mechanisms of Development", "Determination, differentiation, induction, apoptosis, stem cells."),
                ],
            ),
        ],
    ),
    "FC3": (
        "Foundational Concept 3",
        "Complex systems of tissues and organs sense internal and external environments of multicellular organisms and maintain a stable internal environment.",
        [
            (
                "3A",
                "Structure and functions of the nervous and endocrine systems and ways in which these systems coordinate the organ systems",
                "Neurons, electrochemistry of membranes, and hormones.",
                [
                    ("t1", "Nervous System: Structure and Function", "CNS/PNS, autonomic branches, reflexes, endocrine integration."),
                    ("t2", "Nerve Cell", "Anatomy, myelin, synapse, resting and action potentials, glia."),
                    ("t3", "Electrochemistry of Excitable Membranes", "Concentration cells, Nernst relation as applied to neurons."),
                    ("t4", "Biosignalling", "GPCRs, ligand- and voltage-gated channels, receptor enzymes."),
                    ("t5", "Lipids in Signalling", "Steroids, terpenes, and related messengers."),
                    ("t6", "Endocrine System: Hormones and Their Sources", "Glands, hormone types, neuroendocrinology."),
                    ("t7", "Endocrine System: Mechanisms of Hormone Action", "Receptors, second messengers, transport, feedback."),
                ],
            ),
            (
                "3B",
                "Structure and integrative functions of the main organ systems",
                "Physiology of the major organ systems.",
                [
                    ("t1", "Respiratory System", "Ventilation, gas exchange, Henry's law, pH, neural control."),
                    ("t2", "Circulatory System", "Heart, vessels, blood, hemoglobin, Starling and pressure-flow."),
                    ("t3", "Lymphatic System", "Fluid return, lymphocyte production, transport of lipids."),
                    ("t4", "Immune System", "Innate vs adaptive, antibodies, MHC, clonal selection."),
                    ("t5", "Digestive System", "GI organs, enzymes, absorption, enteric and endocrine control."),
                    ("t6", "Excretory System", "Nephron, countercurrent multiplier, osmoregulation, acid–base."),
                    ("t7", "Reproductive System", "Gonads, genitalia, hormonal cycles, pregnancy."),
                    ("t8", "Muscle System", "Muscle types, NMJ, contraction control, oxygen debt."),
                    ("t9", "Specialized Cell — Muscle Cell", "Sarcomere, sliding filament, troponin, calcium."),
                    ("t10", "Skeletal System", "Bone types, matrix, joints, endocrine control of calcium."),
                    ("t11", "Skin System", "Layers, thermoregulation, barrier function."),
                ],
            ),
        ],
    ),
    "FC4": (
        "Foundational Concept 4",
        "Complex living organisms transport materials, sense their environment, process signals, and respond to changes using processes understood in terms of physical principles.",
        [
            (
                "4A",
                "Translational motion, forces, work, energy, and equilibrium in living systems",
                "Mechanics applied to living systems.",
                [
                    ("t1", "Translational Motion", "Displacement, velocity, acceleration, units."),
                    ("t2", "Force", "Newton's laws, friction, center of mass."),
                    ("t3", "Equilibrium", "Force and torque balance, lever arms."),
                    ("t4", "Work", "W = Fd cosθ, mechanical advantage, work–energy theorem."),
                    ("t5", "Energy of Point Object Systems", "KE, PE, conservation, power."),
                    ("t6", "Periodic Motion", "Amplitude, frequency, waves."),
                ],
            ),
            (
                "4B",
                "Importance of fluids for the circulation of blood, gas movement, and gas exchange",
                "Fluids, circulation, and gases.",
                [
                    ("t1", "Fluids", "Density, buoyancy, hydrostatic pressure, Poiseuille, Bernoulli, surface tension."),
                    ("t2", "Circulatory Pressure and Flow", "Arterial vs venous pressure and flow characteristics."),
                    ("t3", "Gas Phase", "Ideal gas laws, kinetic theory, partial pressures, real-gas deviations."),
                ],
            ),
            (
                "4C",
                "Electrochemistry and electrical circuits and their elements",
                "Electrostatics, circuits, magnetism, and electrochemical cells.",
                [
                    ("t1", "Electrostatics", "Charge, Coulomb, fields, potential."),
                    ("t2", "Circuit Elements", "Current, Ohm, series/parallel R and C, resistivity, meters."),
                    ("t3", "Magnetism", "B fields, Lorentz force on moving charges."),
                    ("t4", "Electrochemistry", "Galvanic and electrolytic cells, Faraday, Nernst, batteries."),
                    ("t5", "Specialized Cell — Nerve Cell Electrical Properties", "Myelin, nodes of Ranvier, impulse propagation."),
                ],
            ),
            (
                "4D",
                "How light and sound interact with matter",
                "Waves, optics, and molecular spectra.",
                [
                    ("t1", "Sound", "Production, intensity, Doppler, ultrasound, resonance."),
                    ("t2", "Light and Electromagnetic Radiation", "Interference, diffraction, polarization, EM spectrum."),
                    ("t3", "Molecular Structure and Absorption Spectra", "IR, UV-vis, NMR."),
                    ("t4", "Geometrical Optics", "Reflection, refraction, mirrors, lenses, the eye."),
                ],
            ),
            (
                "4E",
                "Atoms, nuclear decay, electronic structure, and atomic chemical behavior",
                "Nuclear physics, atomic structure, periodic trends, and stoichiometry.",
                [
                    ("t1", "Atomic Nucleus", "Isotopes, binding energy, decay, half-life, mass spectrometry."),
                    ("t2", "Electronic Structure", "Orbitals, spectra, Pauli, photoelectric effect, Heisenberg."),
                    ("t3", "The Periodic Table — Classification of Elements", "Groups by electronic structure."),
                    ("t4", "The Periodic Table — Variations of Chemical Properties", "IE, EA, EN, atomic and ionic size."),
                    ("t5", "Stoichiometry", "Moles, limiting reagent, oxidation numbers, balancing including redox."),
                ],
            ),
        ],
    ),
    "FC5": (
        "Foundational Concept 5",
        "The principles that govern chemical interactions and reactions form the basis for a broader understanding of the molecular dynamics of living systems.",
        [
            (
                "5A",
                "Unique nature of water and its solutions",
                "Acids, bases, ions, solubility, and titration.",
                [
                    ("t1", "Acid/Base Equilibria", "Kw, pH, conjugates, Ka/Kb, buffers."),
                    ("t2", "Ions in Solutions", "Common ions, hydration, hydronium."),
                    ("t3", "Solubility", "Molarity, Ksp, common-ion effect, complex ions."),
                    ("t4", "Titration", "Indicators, neutralization curves, redox titrations."),
                ],
            ),
            (
                "5B",
                "Nature of molecules and intermolecular interactions",
                "Covalent bonding, stereochemistry, and intermolecular forces.",
                [
                    ("t1", "Covalent Bond", "Lewis, VSEPR, hybridization, resonance, formal charge."),
                    ("t2", "Stereochemistry of Covalently Bonded Molecules", "Isomers, R/S, E/Z, optical activity."),
                    ("t3", "Liquid Phase — Intermolecular Forces", "Hydrogen bonding, dipole, London forces."),
                ],
            ),
            (
                "5C",
                "Separation and purification methods",
                "Extraction, distillation, chromatography, electrophoresis.",
                [
                    ("t1", "Extraction and Distillation", "Partition between immiscible solvents; simple and fractional distillation."),
                    ("t2", "Chromatography", "TLC, paper, column, HPLC, GC, size-exclusion, ion-exchange, affinity."),
                    ("t3", "Electrophoresis and Peptide Purification", "SDS-PAGE, isoelectric focusing, quantitative analysis."),
                    ("t4", "Resolution of Enantiomers", "Racemic mixtures and chiral separation."),
                ],
            ),
            (
                "5D",
                "Structure, function, and reactivity of biologically-relevant molecules",
                "Nucleotides, amino acids, lipids, carbohydrates, and organic functional-group chemistry.",
                [
                    ("t1", "Nucleotides and Nucleic Acids", "Composition, backbone, DNA chemistry."),
                    ("t2", "Amino Acids, Peptides, Proteins", "Structure, Strecker and Gabriel synthesis, peptide reactions."),
                    ("t3", "Three-Dimensional Protein Structure", "Folding, solvation layer, denaturation."),
                    ("t4", "Non-Enzymatic Protein Function", "Binding and structural roles in a chemical context."),
                    ("t5", "Lipids", "Triacylglycerols, phospholipids, steroids, fat-soluble vitamins, prostaglandins."),
                    ("t6", "Carbohydrates", "Cyclic forms, epimers, glycosides, tautomerism."),
                    ("t7", "Aldehydes and Ketones", "Nucleophilic addition, enolates, aldol."),
                    ("t8", "Alcohols", "Acidity, oxidation, substitution, protecting groups."),
                    ("t9", "Carboxylic Acids", "Acidity, derivatives formation, decarboxylation."),
                    ("t10", "Acid Derivatives", "Anhydrides, amides, esters, relative reactivity, β-lactams."),
                    ("t11", "Phenols", "Acidity and biological quinone redox."),
                    ("t12", "Polycyclic and Heterocyclic Aromatic Compounds", "Aromatic heterocycles in biomolecules."),
                ],
            ),
            (
                "5E",
                "Principles of chemical thermodynamics and kinetics",
                "Enzyme kinetics, bioenergetics, thermochemistry, and chemical kinetics.",
                [
                    ("t1", "Enzymes", "Classification, MM kinetics, inhibition, regulation."),
                    ("t2", "Principles of Bioenergetics", "ATP, redox carriers, ΔG and Keq."),
                    ("t3", "Energy Changes in Chemical Reactions", "Laws of thermodynamics, enthalpy, entropy, calorimetry, phase changes."),
                    ("t4", "Rate Processes in Chemical Reactions — Kinetics and Equilibrium", "Rate laws, Arrhenius, kinetic vs thermodynamic control, Le Châtelier."),
                ],
            ),
        ],
    ),
    "FC6": (
        "Foundational Concept 6",
        "Biological, psychological, and sociocultural factors influence the ways that individuals perceive, think about, and react to the world.",
        [
            (
                "6A",
                "Sensing the environment",
                "Sensation, specific senses, and perception.",
                [
                    ("t1", "Sensory Processing", "Thresholds, Weber, signal detection, adaptation, receptor types."),
                    ("t2", "Vision", "Eye structure, pathways, parallel processing, feature detection."),
                    ("t3", "Hearing", "Ear structure, auditory pathways, hair cells."),
                    ("t4", "Other Senses", "Somatosensation, taste, smell, kinesthesia, vestibular sense."),
                    ("t5", "Perception", "Bottom-up/top-down, Gestalt, constancy."),
                ],
            ),
            (
                "6B",
                "Making sense of the environment",
                "Attention, cognition, consciousness, memory, and language.",
                [
                    ("t1", "Attention", "Selective and divided attention."),
                    ("t2", "Cognition", "Information processing, Piaget, problem solving, heuristics, intelligence."),
                    ("t3", "Consciousness", "Sleep stages, circadian rhythms, drugs, hypnosis, meditation."),
                    ("t4", "Memory", "Encoding, storage, retrieval, forgetting, LTP, construction."),
                    ("t5", "Language", "Theories of development, brain areas, language and cognition."),
                ],
            ),
            (
                "6C",
                "Responding to the world",
                "Emotion and stress.",
                [
                    ("t1", "Emotion", "Components, universal emotions, James–Lange, Cannon–Bard, Schachter–Singer, limbic system."),
                    ("t2", "Stress", "Appraisal, stressors, physiological and behavioral responses, coping."),
                ],
            ),
        ],
    ),
    "FC7": (
        "Foundational Concept 7",
        "Biological, psychological, and sociocultural factors influence behavior and behavior change.",
        [
            (
                "7A",
                "Individual influences on behavior",
                "Biology of behavior, personality, disorders, motivation, attitudes.",
                [
                    ("t1", "Biological Bases of Behavior", "Neurons, brain regions, neurotransmitters, endocrine, behavioral genetics, development."),
                    ("t2", "Personality", "Psychoanalytic, humanistic, trait, social-cognitive, biological, behaviorist, situationism."),
                    ("t3", "Psychological Disorders", "Approaches, DSM categories, biological bases including Alzheimer and Parkinson."),
                    ("t4", "Motivation", "Instinct, drive, incentive, need-based theories, biological drives."),
                    ("t5", "Attitudes", "ABC model, foot-in-the-door, cognitive dissonance."),
                ],
            ),
            (
                "7B",
                "Social processes that influence human behavior",
                "Social influence, groups, norms, socialization.",
                [
                    ("t1", "How the Presence of Others Affects Individual Behavior", "Social facilitation, deindividuation, bystander, social loafing, peer pressure."),
                    ("t2", "Group Decision-making Processes", "Group polarization, groupthink."),
                    ("t3", "Normative and Non-normative Behavior", "Norms, deviance theories, collective behavior."),
                    ("t4", "Socialization", "Agents of socialization."),
                ],
            ),
            (
                "7C",
                "Attitude and behavior change",
                "Learning and theories of attitude change.",
                [
                    ("t1", "Habituation and Dishabituation", "Non-associative learning."),
                    ("t2", "Associative Learning", "Classical and operant conditioning, schedules, biological constraints."),
                    ("t3", "Observational Learning", "Modeling, mirror neurons, vicarious emotion."),
                    ("t4", "Theories of Attitude and Behavior Change", "Elaboration likelihood, social cognitive theory, message/target factors."),
                ],
            ),
        ],
    ),
    "FC8": (
        "Foundational Concept 8",
        "Psychological, sociocultural, and biological factors influence the way we think about ourselves and others, as well as how we interact with others.",
        [
            (
                "8A",
                "Self-identity",
                "Self-concept and identity formation.",
                [
                    ("t1", "Self-Concept, Self-identity, and Social Identity", "Self-esteem, self-efficacy, locus of control, identity types."),
                    ("t2", "Formation of Identity", "Developmental theories, looking-glass self, reference groups, culture."),
                ],
            ),
            (
                "8B",
                "Social thinking",
                "Attribution, prejudice, and stereotypes.",
                [
                    ("t1", "Attributing Behavior to Persons or Situations", "Attribution theory, fundamental attribution error, culture."),
                    ("t2", "Prejudice and Bias", "Power/prestige/class, emotion and cognition in prejudice, stigma, ethnocentrism."),
                    ("t3", "Processes Related to Stereotypes", "Self-fulfilling prophecy, stereotype threat."),
                ],
            ),
            (
                "8C",
                "Social interactions",
                "Status, groups, presentation of self, social behavior, discrimination.",
                [
                    ("t1", "Elements of Social Interaction", "Status, roles, groups, networks, organizations, bureaucracy."),
                    ("t2", "Self-presentation and Interacting with Others", "Impression management, dramaturgy, verbal/nonverbal communication."),
                    ("t3", "Social Behavior", "Attraction, aggression, attachment, altruism, animal social behavior, inclusive fitness."),
                    ("t4", "Discrimination", "Individual vs institutional, prejudice vs discrimination."),
                ],
            ),
        ],
    ),
    "FC9": (
        "Foundational Concept 9",
        "Cultural and social differences influence well-being.",
        [
            (
                "9A",
                "Understanding social structure",
                "Theory, institutions, and culture.",
                [
                    ("t1", "Theoretical Approaches", "Functionalism, conflict, symbolic interactionism, social constructionism, feminist and rational-choice views."),
                    ("t2", "Social Institutions", "Education, family, religion, government/economy, health and medicine."),
                    ("t3", "Culture", "Elements of culture, lag, shock, assimilation, multiculturalism, subcultures, media."),
                ],
            ),
            (
                "9B",
                "Demographic characteristics and processes",
                "Demography and social change.",
                [
                    ("t1", "Demographic Structure of Society", "Age, gender, race/ethnicity, immigration, sexual orientation."),
                    ("t2", "Demographic Shifts and Social Change", "Demographic transition, fertility/mortality/migration, social movements, globalization, urbanization."),
                ],
            ),
        ],
    ),
    "FC10": (
        "Foundational Concept 10",
        "Social stratification and access to resources influence well-being.",
        [
            (
                "10A",
                "Social inequality",
                "Spatial inequality, class, and health gradients.",
                [
                    ("t1", "Spatial Inequality", "Residential segregation, neighborhood safety, environmental justice."),
                    ("t2", "Social Class", "SES, capital, social reproduction, mobility, meritocracy, poverty, intersectionality, socioeconomic gradient in health."),
                    ("t3", "Health Disparities", "Access to care, social exclusion, global inequalities in health."),
                ],
            ),
        ],
    ),
}

CARS = (
    "Critical Analysis and Reasoning Skills",
    "MCAT CARS: comprehension and reasoning on humanities and social-science passages. No outside content knowledge required.",
    [
        (
            "FND",
            "Foundations of Comprehension",
            "Understanding the basic components of the text.",
            [
                ("t1", "Main idea and primary purpose", "Identify the author's central claim or purpose."),
                ("t2", "Information retrieval", "Locate explicit statements and details."),
                ("t3", "Inferring meaning", "Draw inferences licensed by the passage."),
                ("t4", "Vocabulary in context", "Determine word or phrase meaning from usage."),
                ("t5", "Paraphrase and summary", "Restate claims without distortion."),
            ],
        ),
        (
            "RWT",
            "Reasoning Within the Text",
            "Integrating, analyzing, and evaluating passage arguments.",
            [
                ("t1", "Integration of parts", "Relate claims, evidence, and examples across paragraphs."),
                ("t2", "Relevance and support", "Judge which statements support or undermine a claim."),
                ("t3", "Logic and structure", "Identify assumptions, conclusions, and argumentative moves."),
                ("t4", "Evaluation of tone and rhetoric", "Assess stance, emphasis, and rhetorical strategy."),
                ("t5", "Internal consistency", "Detect tensions or qualifications inside the passage."),
            ],
        ),
        (
            "RBT",
            "Reasoning Beyond the Text",
            "Applying or extrapolating ideas to new information.",
            [
                ("t1", "Apply to a new context", "Use a passage principle in an unfamiliar scenario."),
                ("t2", "Incorporate new information", "Assess how extra-textual facts would affect the argument."),
                ("t3", "Analogies and hypotheticals", "Map passage relationships onto analogous cases."),
                ("t4", "Limitations and implications", "Extrapolate consequences the author does not state."),
            ],
        ),
    ],
)

SIRS = (
    "Scientific Inquiry and Reasoning Skills",
    "Overlay skills on every natural and social science item. exam_weight 0 — selection uses skill_tag, not new-item quota.",
    [
        (
            "SIRS1",
            "Knowledge of Scientific Concepts and Principles",
            "Skill 1.",
            [
                ("t1", "Demonstrate understanding of scientific concepts and principles", "Recall and recognize scientific content."),
                ("t2", "Identify relationships between closely related concepts", "Connect adjacent scientific ideas."),
            ],
        ),
        (
            "SIRS2",
            "Scientific Reasoning and Problem Solving",
            "Skill 2.",
            [
                ("t1", "Reason about scientific principles, theories, and models", "Use models to explain or predict."),
                ("t2", "Analyze and evaluate scientific explanations and predictions", "Judge validity of scientific claims."),
            ],
        ),
        (
            "SIRS3",
            "Reasoning about the Design and Execution of Research",
            "Skill 3.",
            [
                ("t1", "Demonstrate understanding of important components of scientific research", "Variables, controls, samples, methods."),
                ("t2", "Reason about ethical issues in research", "Consent, harm, integrity."),
            ],
        ),
        (
            "SIRS4",
            "Data-Based and Statistical Reasoning",
            "Skill 4.",
            [
                ("t1", "Interpret patterns in data presented in tables, figures, and graphs", "Read scientific figures."),
                ("t2", "Reason about data and draw conclusions from them", "Statistics, uncertainty, inference."),
            ],
        ),
    ],
)

GAMSAT_S1_CATS = [
    (
        "understand",
        "Understanding",
        "Close reading of humanities and social-science stimuli.",
        [
            ("t1", "Main claim of a prose extract", "Identify what a humanities passage is saying."),
            ("t2", "Paraphrase without over-reading", "Stay inside the stimulus."),
            ("t3", "Follow referents and structure", "Track who is speaking and how the piece is built."),
        ],
    ),
    (
        "infer",
        "Inference",
        "Implied meaning licensed by the stimulus.",
        [
            ("t1", "Implication from diction", "Infer from word choice."),
            ("t2", "Unstated assumptions", "What must be true for the speaker's position."),
            ("t3", "Reading between the lines in poetry", "Implication in compressed literary language."),
        ],
    ),
    (
        "tone",
        "Tone and attitude",
        "Mood, stance, and emphasis.",
        [
            ("t1", "Speaker attitude", "Irony, sincerity, hostility, affection."),
            ("t2", "Shift in tone", "Detect turns inside a short extract."),
            ("t3", "Satire and understatement", "Non-literal evaluative language."),
        ],
    ),
    (
        "argument",
        "Argument structure",
        "Claims, reasons, and flaws in discursive prose.",
        [
            ("t1", "Identify conclusion vs support", "Separate claim from evidence."),
            ("t2", "Evaluate strength of reasoning", "Gaps, overgeneralization, false dichotomy."),
            ("t3", "Compare competing arguments", "Which statement better captures a dispute."),
        ],
    ),
    (
        "compare",
        "Relative analysis",
        "Compare two stimuli without flattening differences.",
        [
            ("t1", "Paired prose", "Agreement, conflict, and purpose."),
            ("t2", "Poem vs commentary", "How a second text reframes the first."),
            ("t3", "Quote sets", "Relationship among several short statements."),
        ],
    ),
    (
        "visual",
        "Visual and cartoon texts",
        "Cartoons, diagrams, and mixed media.",
        [
            ("t1", "Political cartoons", "Irony, symbolism, target of critique."),
            ("t2", "Tables and figures in humanities contexts", "Read non-continuous text."),
            ("t3", "Caption vs image", "Tension between image and words."),
        ],
    ),
    (
        "humanities",
        "Humanities genres",
        "Literature, philosophy, history, arts commentary.",
        [
            ("t1", "Literary narrative", "Character, perspective, theme."),
            ("t2", "Philosophy and ethics extracts", "Abstract claims in short form."),
            ("t3", "Historical commentary", "Interpretation of past events."),
            ("t4", "Arts and cultural criticism", "Aesthetic evaluation."),
        ],
    ),
    (
        "social",
        "Social-science genres",
        "Sociology, politics, psychology, media.",
        [
            ("t1", "Sociological commentary", "Groups, institutions, power."),
            ("t2", "Political argument", "Policy, rights, ideology."),
            ("t3", "Media and language", "How public language frames issues."),
        ],
    ),
]

GAMSAT_S2_CATS = [
    (
        "task_a",
        "Task A — socio-cultural",
        "Argumentative response to socio-cultural quote sets.",
        [
            ("t1", "Theme identification", "Name the socio-cultural issue the quotes orbit."),
            ("t2", "Argumentative thesis", "Take a clear evaluative position."),
            ("t3", "Use of examples", "Concrete cases that earn the claim."),
            ("t4", "Engaging the quote set", "Respond to one or more comments without inventorying all."),
            ("t5", "Counterargument", "Steelman and answer an opposing view."),
        ],
    ),
    (
        "task_b",
        "Task B — personal and social",
        "Reflective or personal response to lived-experience quote sets.",
        [
            ("t1", "Personal theme", "Love, identity, memory, belonging, failure."),
            ("t2", "Reflective voice", "First-person without solipsism."),
            ("t3", "Particular over generic", "Specific scenes instead of platitude."),
            ("t4", "Emotional precision", "Tone control; avoid sentimentality."),
            ("t5", "Creative form (optional)", "Story, letter, or hybrid when it serves thought."),
        ],
    ),
    (
        "craft",
        "Written communication craft",
        "Quality of thinking and integration, per ACER.",
        [
            ("t1", "Structure", "Opening, development, close under time."),
            ("t2", "Integration of ideas", "Quotes as springboard, not checklist."),
            ("t3", "Clarity under timed typing", "Sentence control without spellcheck."),
            ("t4", "Register", "Match formality to task."),
        ],
    ),
]

GAMSAT_S3_BIO = [
    ("t1", "Cell structure and organelles", "Eukaryotic and prokaryotic cell architecture."),
    ("t2", "Membranes and transport", "Diffusion, osmosis, pumps, membrane potential."),
    ("t3", "Biological molecules", "Water, carbs, lipids, proteins, nucleic acids."),
    ("t4", "Enzymes", "Catalysis, specificity, factors affecting rate."),
    ("t5", "Cellular respiration", "Glycolysis, Krebs, ETC, ATP yield."),
    ("t6", "Photosynthesis", "Light and carbon reactions at first-year level."),
    ("t7", "DNA replication", "Semiconservative replication and enzymes."),
    ("t8", "Transcription and translation", "Central dogma."),
    ("t9", "Gene expression and mutation", "Regulation and types of mutation."),
    ("t10", "Cell cycle, mitosis, meiosis", "Division and genetic consequences."),
    ("t11", "Mendelian and population genetics", "Punnett, pedigrees, Hardy–Weinberg."),
    ("t12", "Evolution", "Selection, speciation, evidence."),
    ("t13", "Microbes and viruses", "Bacteria, viruses, host interaction."),
    ("t14", "Digestive system", "Organs, enzymes, absorption."),
    ("t15", "Circulation and blood", "Heart, vessels, blood components."),
    ("t16", "Respiration and gas exchange", "Lungs, partial pressures."),
    ("t17", "Excretion and osmoregulation", "Kidney, water and ion balance."),
    ("t18", "Nervous system", "Neurons, synapses, CNS/PNS."),
    ("t19", "Endocrine system", "Hormones as chemical messengers."),
    ("t20", "Immune system", "Innate and adaptive outlines."),
    ("t21", "Musculoskeletal system", "Bone, muscle contraction."),
    ("t22", "Reproduction and development", "Gametes, pregnancy, germ layers."),
    ("t23", "Homeostasis", "Feedback loops."),
    ("t24", "Plant structure and function", "First-year plant physiology as tested."),
    ("t25", "Ecology and energy flow", "Trophic levels, cycles."),
    ("t26", "Experimental methods in biology", "Assays, microscopy, controls."),
    ("t27", "Biotechnology", "PCR, gel electrophoresis, recombinant DNA."),
    ("t28", "Acid–base and buffers in physiology", "pH of body fluids."),
]

GAMSAT_S3_CHEM = [
    ("t1", "Atomic structure", "Protons, neutrons, electrons, isotopes."),
    ("t2", "Electron configuration", "Orbitals and periodic placement."),
    ("t3", "Periodic trends", "Radius, IE, EN, reactivity."),
    ("t4", "Ionic and covalent bonding", "Lattice vs molecules."),
    ("t5", "Lewis structures and VSEPR", "Shape and polarity."),
    ("t6", "Intermolecular forces", "H-bonding, dipole, dispersion."),
    ("t7", "Stoichiometry", "Moles, limiting reagent, yields."),
    ("t8", "Concentration and dilution", "Molarity, ppm, serial dilution."),
    ("t9", "Gases", "Ideal gas law, partial pressures."),
    ("t10", "Thermochemistry", "Enthalpy, Hess, calorimetry."),
    ("t11", "Entropy and Gibbs energy", "Spontaneity."),
    ("t12", "Chemical equilibrium", "K, Q, Le Chatelier."),
    ("t13", "Acids and bases", "pH, Ka, strong vs weak."),
    ("t14", "Buffers and titration", "Henderson–Hasselbalch, curves."),
    ("t15", "Solubility", "Ksp, precipitation."),
    ("t16", "Redox", "Oxidation numbers, balancing, cells."),
    ("t17", "Electrochemistry", "Galvanic cells, potential."),
    ("t18", "Kinetics", "Rate laws, temperature, catalysts."),
    ("t19", "Organic functional groups", "Recognition and properties."),
    ("t20", "Hydrocarbons", "Alkanes, alkenes, alkynes, aromatics."),
    ("t21", "Isomerism and stereochemistry", "Structural, geometric, optical."),
    ("t22", "Substitution and addition", "SN1/SN2 and alkene addition at first-year depth."),
    ("t23", "Alcohols, carbonyls, carboxylic acids", "Characteristic reactions."),
    ("t24", "Amines and amides", "Basicity and peptides as chemistry."),
    ("t25", "Aromaticity", "Benzene stability and substitution outline."),
    ("t26", "Spectroscopy intro", "IR, NMR, mass spec as data-reasoning."),
    ("t27", "Separation methods", "Chromatography, distillation, extraction."),
    ("t28", "Colligative properties", "Boiling point elevation, freezing point depression."),
    ("t29", "Phase behaviour", "Phase diagrams, vapour pressure."),
    ("t30", "Coordination and transition metals intro", "As appears in first-year problems."),
]

GAMSAT_S3_PHYS = [
    ("t1", "Kinematics", "v, a, graphs of motion."),
    ("t2", "Projectile motion", "Independence of components."),
    ("t3", "Newton's laws", "Free-body diagrams."),
    ("t4", "Work, energy, power", "Conservation of energy."),
    ("t5", "Momentum", "Collisions, impulse."),
    ("t6", "Circular motion and gravity", "Centripetal force, g."),
    ("t7", "Torque and statics", "Equilibrium of extended bodies."),
    ("t8", "Simple harmonic motion", "Springs and pendulums."),
    ("t9", "Waves", "Speed, frequency, superposition."),
    ("t10", "Sound", "Intensity, Doppler, standing waves."),
    ("t11", "Reflection, refraction, lenses", "Snell, images."),
    ("t12", "Interference and diffraction", "Path difference."),
    ("t13", "Electrostatics", "Coulomb, fields, potential."),
    ("t14", "DC circuits", "Ohm, series/parallel, power."),
    ("t15", "Capacitors", "Charge, energy, RC qualitative."),
    ("t16", "Magnetism", "Force on currents and charges."),
    ("t17", "Electromagnetic induction", "Faraday, Lenz, transformers."),
    ("t18", "Heat and temperature", "Specific heat, latent heat."),
    ("t19", "Ideal gases and kinetic theory", "As physics."),
    ("t20", "Fluids", "Pressure, buoyancy, continuity."),
    ("t21", "Radioactivity", "Decay, half-life, activity."),
    ("t22", "Photoelectric effect and photons", "Quantum intro at year-12."),
    ("t23", "Nuclear reactions", "Fission/fusion outline, binding energy."),
    ("t24", "Dimensional analysis and units", "SI, conversion, estimation."),
    ("t25", "Medical physics applications", "X-ray, ultrasound, as stimulus contexts."),
    ("t26", "Graphs and experimental physics", "Slope, intercept, uncertainty."),
]

GAMSAT_S3_RFD = [
    ("t1", "Reading graphs", "Axes, slope, log scales."),
    ("t2", "Tables of experimental results", "Compare conditions."),
    ("t3", "Identify variables", "Independent, dependent, controlled."),
    ("t4", "Experimental design", "Controls, randomization, sample size."),
    ("t5", "Error and uncertainty", "Random vs systematic, significant figures."),
    ("t6", "Interpolate and extrapolate", "Limits of the data."),
    ("t7", "Proportional reasoning", "Direct and inverse relations from data."),
    ("t8", "Evaluate hypotheses", "What the results can and cannot support."),
    ("t9", "Unit conversion in data problems", "Keep quantities consistent."),
    ("t10", "Multi-panel figures", "Relate two plots or a plot and a table."),
]


def add_tree(nodes: list[dict], exam: str, section_id: str, section_name: str, section_desc: str, section_weight: float, categories: list) -> None:
    nodes.append(node(section_id, None, exam, "section", section_name, section_desc, section_weight))
    cat_weights = split(section_weight, len(categories))
    for (slug, name, desc, topics), cw in zip(categories, cat_weights, strict=True):
        cat_id = f"{section_id}.{slug}"
        nodes.append(node(cat_id, section_id, exam, "category", name, desc, cw))
        tws = split(cw, len(topics))
        for (tslug, tname, tdesc), tw in zip(topics, tws, strict=True):
            nodes.append(node(f"{cat_id}.{tslug}", cat_id, exam, "topic", tname, tdesc, tw))


def build() -> list[dict]:
    nodes: list[dict] = []
    for fc, (name, desc, cats) in MCAT_FC.items():
        add_tree(nodes, "mcat", f"MCAT.{fc}", name, desc, FC_WEIGHT[fc], cats)
    add_tree(nodes, "mcat", "MCAT.CARS", CARS[0], CARS[1], CARS_WEIGHT, CARS[2])
    add_tree(nodes, "mcat", "MCAT.SIRS", SIRS[0], SIRS[1], 0.0, SIRS[2])

    add_tree(
        nodes,
        "gamsat",
        "GAMSAT.S1",
        "Section 1 — Reasoning in Humanities and Social Sciences",
        "ACER S1; 25% of overall.",
        GAMSAT_S1,
        GAMSAT_S1_CATS,
    )
    add_tree(
        nodes,
        "gamsat",
        "GAMSAT.S2",
        "Section 2 — Written Communication",
        "ACER S2; 25% of overall. Two tasks.",
        GAMSAT_S2,
        GAMSAT_S2_CATS,
    )
    nodes.append(node("GAMSAT.S3", None, "gamsat", "section", "Section 3 — Reasoning in Biological and Physical Sciences", "ACER S3 double-weighted (50% of overall). Chemistry 40%, biology 40%, physics 20%.", GAMSAT_S3))
    s3_cats = [
        ("bio", "Biology", "First-year university biology.", S3_BIO, GAMSAT_S3_BIO),
        ("chem", "Chemistry", "First-year university chemistry.", S3_CHEM, GAMSAT_S3_CHEM),
        ("phys", "Physics", "Year-12 / A-level physics.", S3_PHYS, GAMSAT_S3_PHYS),
        ("rfd", "Reasoning from data", "Overlay: graphs, design, uncertainty. exam_weight 0.", 0.0, GAMSAT_S3_RFD),
    ]
    for slug, name, desc, weight, topics in s3_cats:
        cat_id = f"GAMSAT.S3.{slug}"
        nodes.append(node(cat_id, "GAMSAT.S3", "gamsat", "category", name, desc, weight))
        tws = split(weight, len(topics))
        for (tslug, tname, tdesc), tw in zip(topics, tws, strict=True):
            nodes.append(node(f"{cat_id}.{tslug}", cat_id, "gamsat", "topic", tname, tdesc, tw))
    return nodes


def main() -> None:
    nodes = build()
    payload = {"header": HEADER, "nodes": nodes}
    out = Path(__file__).resolve().parents[1] / "content" / "taxonomy.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf8")
    from collections import Counter

    c = Counter((n["exam"], n["level"]) for n in nodes)
    print(f"wrote {out} ({len(nodes)} nodes)")
    for k in sorted(c):
        print(f"  {k[0]}/{k[1]}: {c[k]}")


if __name__ == "__main__":
    main()
