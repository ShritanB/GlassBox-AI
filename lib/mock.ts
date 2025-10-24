import type { TReasoningGraph } from "@/schema/reasoning";

export const mockReasoningGraph: TReasoningGraph = {
  question: "Is coffee dehydrating for most people?",
  definitions: [
    { term: "diuresis", meaning: "Increased urine production that can lead to fluid loss." },
    { term: "habitual drinker", meaning: "Someone who consumes coffee daily for at least two weeks." },
  ],
  assumptions: [
    { id: "assump1", text: "Most adults in the analysis are healthy and not on diuretic medications." },
    {
      id: "assump2",
      text: "Fluid balance is evaluated over a full day rather than immediately after consumption.",
    },
  ],
  sources: [
    {
      id: "s1",
      title: "Armstrong et al. 2014 - Coffee intake does not cause dehydration",
      url: "https://pubmed.ncbi.nlm.nih.gov/24476471/",
      published: "2014",
      quality: "high",
    },
    {
      id: "s2",
      title: "Mayo Clinic - Caffeine: How much is too much?",
      url: "https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/expert-answers/caffeine/faq-20057965",
      quality: "med",
    },
    {
      id: "s3",
      title: "Institute of Medicine - Dietary Reference Intakes for Water",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK56068/",
      published: "2005",
      quality: "high",
    },
    {
      id: "s4",
      title: "European Food Safety Authority - Scientific Opinion on Caffeine",
      url: "https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2015.4102",
      published: "2015",
      quality: "high",
    },
  ],
  nodes: [
    {
      id: "answer",
      type: "answer",
      text: "Coffee is not dehydrating for most habitual drinkers.",
      rationale:
        "Controlled trials show coffee contributes to daily fluid balance similarly to water, especially among regular consumers who develop tolerance to caffeine's diuretic effect.",
      confidence: 0.74,
      citations: [{ source_id: "s1" }, { source_id: "s4" }],
      tags: [],
    },
    {
      id: "sq1",
      type: "subquestion",
      text: "Does coffee consumption lead to net negative fluid balance compared with water?",
      rationale: "Central query examining the net hydration effect of coffee intake.",
      confidence: 0.6,
      citations: [],
      tags: [],
    },
    {
      id: "claim1",
      type: "claim",
      text: "Moderate coffee intake provides hydration comparable to water in habitual drinkers.",
      rationale:
        "Randomized crossover trials found no significant difference in hydration markers between water and coffee conditions.",
      confidence: 0.78,
      citations: [{ source_id: "s1" }],
      tags: ["hydration", "clinical-trial"],
    },
    {
      id: "evidence1",
      type: "evidence",
      text: "Armstrong et al. measured body mass, total body water, and urinary markers over three days comparing coffee and water intake.",
      rationale:
        "Objective measures of hydration showed equivalence between interventions when caffeine intake was moderate (4 mg/kg).",
      confidence: 0.72,
      citations: [{ source_id: "s1" }],
      tags: ["trial"],
    },
    {
      id: "claim2",
      type: "claim",
      text: "Caffeine induces a mild, transient diuretic effect in non-habitual users.",
      rationale: "Acute caffeine ingestion can increase urine output in individuals without tolerance.",
      confidence: 0.58,
      citations: [{ source_id: "s2" }],
      tags: ["caffeine"],
    },
    {
      id: "evidence2",
      type: "evidence",
      text: "Educational reviews note caffeine's diuretic effect diminishes with regular exposure.",
      rationale: "Physiological adaptation reduces adenosine receptor sensitivity, lowering diuresis.",
      confidence: 0.62,
      citations: [{ source_id: "s2" }, { source_id: "s4" }],
      tags: ["tolerance"],
    },
    {
      id: "claim3",
      type: "claim",
      text: "Total daily fluid balance matters more than acute urine output spikes.",
      rationale: "Hydration status is determined by 24-hour fluid intake and losses, not short-term changes.",
      confidence: 0.65,
      citations: [{ source_id: "s3" }],
      tags: ["fluid-balance"],
    },
    {
      id: "assumption1",
      type: "assumption",
      text: "Most coffee drinkers consume less than 400 mg caffeine per day.",
      rationale: "Upper safe limits are 400 mg/day for healthy adults.",
      confidence: 0.55,
      citations: [{ source_id: "s4" }],
      tags: ["intake"],
    },
    {
      id: "comp1",
      type: "computation",
      text: "Model compares estimated fluid input from three cups of coffee versus water minus urine output.",
      rationale:
        "Inputs assume 720 ml of coffee, 720 ml of water, and an additional 50 ml urine produced with coffee for non-habitual drinkers.",
      confidence: 0.52,
      citations: [],
      tags: ["estimation"],
    },
    {
      id: "claim4",
      type: "claim",
      text: "Non-habitual drinkers may experience temporary net fluid loss until tolerance develops.",
      rationale:
        "Without tolerance, diuretic effect can slightly exceed fluid delivered, especially in sensitive individuals.",
      confidence: 0.46,
      citations: [{ source_id: "s2" }],
      tags: ["risk"],
    },
    {
      id: "evidence3",
      type: "evidence",
      text: "EFSA review indicates hydration impact remains neutral when total fluid intake is adequate.",
      rationale: "Panel concluded coffee contributes to daily fluid needs as long as caffeine intake stays moderate.",
      confidence: 0.7,
      citations: [{ source_id: "s4" }],
      tags: ["regulatory"],
    },
    {
      id: "claim5",
      type: "claim",
      text: "Individuals with kidney issues or on diuretics should moderate coffee intake.",
      rationale: "Additional diuretic load could compound existing fluid balance challenges.",
      confidence: 0.51,
      citations: [{ source_id: "s3" }],
      tags: ["caution"],
    },
  ],
  edges: [
    { from: "sq1", to: "claim1", relation: "derived_from", weight: 0.6 },
    { from: "claim1", to: "evidence1", relation: "supports", weight: 0.8 },
    { from: "claim1", to: "answer", relation: "supports", weight: 0.7 },
    { from: "claim2", to: "claim1", relation: "depends_on", weight: 0.4 },
    { from: "claim2", to: "evidence2", relation: "supports", weight: 0.6 },
    { from: "claim2", to: "claim4", relation: "supports", weight: 0.5 },
    { from: "claim4", to: "answer", relation: "contradicts", weight: -0.4 },
    { from: "claim3", to: "answer", relation: "supports", weight: 0.5 },
    { from: "claim3", to: "evidence3", relation: "supports", weight: 0.7 },
    { from: "assumption1", to: "claim1", relation: "depends_on", weight: 0.3 },
    { from: "comp1", to: "claim3", relation: "derived_from", weight: 0.45 },
    { from: "claim5", to: "answer", relation: "depends_on", weight: 0.35 },
  ],
  answer: {
    summary:
      "For most healthy, habitual coffee drinkers, moderate coffee intake hydrates comparably to water because tolerance rapidly blunts caffeine's diuretic effect. Net daily fluid balance remains neutral when total intake is sufficient.",
    confidence: 0.74,
    key_drivers: [
      "Controlled crossover trials showing hydration equivalence between coffee and water",
      "Evidence that tolerance reduces caffeine-induced diuresis",
      "Regulatory reviews concluding moderate coffee contributes to fluid intake",
    ],
    weak_links: [
      "Limited data on individuals consuming high caffeine doses over 500 mg/day",
      "Potential variability in response among non-habitual drinkers",
    ],
    what_would_change_my_mind: [
      "Large randomized trial showing sustained negative fluid balance from daily coffee",
      "Evidence that tolerance to caffeine's diuretic effect does not develop",
      "Clinical guidelines advising habitual drinkers to replace coffee with water for hydration",
    ],
  },
};

export const mockChallengePatch = {
  nodes: [
    {
      id: "challenge-claim",
      type: "evidence",
      text: "Small crossover study found increased urine output in participants resuming coffee after a washout period.",
      rationale:
        "Participants abstained for five days, then showed a 1.2x increase in urine volume on the first day coffee resumed.",
      confidence: 0.48,
      citations: [{ source_id: "s2" }],
      tags: ["counterpoint"],
    },
    {
      id: "challenge-claim2",
      type: "claim",
      text: "Tolerance can temporarily reset after multi-day abstinence, reintroducing diuretic effects.",
      rationale: "Without continued exposure, the body loses adaptation, meaning returning drinkers may experience diuresis again.",
      confidence: 0.42,
      citations: [{ source_id: "s2" }],
      tags: ["challenge"],
    },
  ],
  edges: [
    { from: "challenge-claim2", to: "claim1", relation: "contradicts", weight: -0.5 },
    { from: "challenge-claim", to: "challenge-claim2", relation: "supports", weight: 0.5 },
  ],
};
