import type { Animal, RiskLevel } from "../types/index";

export interface SpeciesHerdStats {
  species: "Cow" | "Goat" | "Buffalo";
  count: number;
  high: number;
  moderate: number;
  low: number;
  none: number;
  hri: number;
  status: "LOW" | "MODERATE" | "HIGH";
  avgEC: number;
  avgSCC: number;
  totalMilk: number;
}

export interface HerdRiskAssessment {
  totalAnimals: number;
  counts: {
    high: number;
    moderate: number;
    low: number;
    none: number;
  };
  hri: number;               // Herd Risk Index: 0-100%
  prevHri: number;           // Previous day HRI (for delta display)
  hriDelta: number;          // Change in HRI points
  avgRisk: number;           // Average AI risk % across all animals
  status: "LOW" | "MODERATE" | "HIGH";
  trend: "improving" | "stable" | "worsening";
  highRiskPercentage: number;
  moderateRiskPercentage: number;
  moderateHighPercentage: number;   // MHRP = (moderate+high)/total * 100
  healthyPercentage: number;
  quarantineCount: number;
  watchListCount: number;
  hriHistory: Array<{ day: string; hri: number }>; // 7-day HRI trend
  speciesBreakdown: {
    cows: SpeciesHerdStats;
    goats: SpeciesHerdStats;
    buffaloes: SpeciesHerdStats;
  };
  clinicalAdvisory: string;
}

/** Filter animals by herd ID. Pass "all" to include every animal. */
export function filterAnimalsByHerd(animals: Animal[], herdId: string | "all"): Animal[] {
  if (herdId === "all") return animals;
  return animals.filter((a) => a.herdId === herdId);
}

export function calculateHerdRisk(animals: Animal[]): HerdRiskAssessment {
  const total = animals.length;

  const emptyStats = (sp: "Cow" | "Goat" | "Buffalo"): SpeciesHerdStats => ({
    species: sp, count: 0, high: 0, moderate: 0, low: 0, none: 0,
    hri: 0, status: "LOW", avgEC: 0, avgSCC: 0, totalMilk: 0,
  });

  if (total === 0) {
    return {
      totalAnimals: 0,
      counts: { high: 0, moderate: 0, low: 0, none: 0 },
      hri: 0, prevHri: 0, hriDelta: 0, avgRisk: 0,
      status: "LOW", trend: "stable",
      highRiskPercentage: 0, moderateRiskPercentage: 0,
      moderateHighPercentage: 0, healthyPercentage: 100,
      quarantineCount: 0, watchListCount: 0,
      hriHistory: [],
      speciesBreakdown: {
        cows: emptyStats("Cow"),
        goats: emptyStats("Goat"),
        buffaloes: emptyStats("Buffalo"),
      },
      clinicalAdvisory: "No animals currently registered in herd monitoring.",
    };
  }

  const high     = animals.filter((a) => a.risk === "high").length;
  const moderate = animals.filter((a) => a.risk === "moderate").length;
  const low      = animals.filter((a) => a.risk === "low").length;
  const none     = animals.filter((a) => a.risk === "none").length;

  // HRI Formula: [(Low*0 + Mod*1 + High*2) / (Total*2)] * 100
  const hri = Math.round(((low * 0 + moderate * 1 + high * 2) / (total * 2)) * 100);

  // Simulated previous day HRI for delta display
  const prevHri = Math.max(0, hri - Math.round(hri * 0.12 + 3));
  const hriDelta = hri - prevHri;

  // Average AI Risk %: HIGH=88, MODERATE=62, LOW=22, NONE=8
  const riskScoreMap: Record<RiskLevel, number> = { high: 88, moderate: 62, low: 22, none: 8 };
  const avgRisk = Math.round(
    animals.reduce((sum, a) => sum + riskScoreMap[a.risk], 0) / total
  );

  let status: "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (hri >= 70) status = "HIGH";
  else if (hri >= 40) status = "MODERATE";

  const upTrends   = animals.filter((a) => a.trend === "up").length;
  const downTrends = animals.filter((a) => a.trend === "down").length;
  let trend: "improving" | "stable" | "worsening" = "stable";
  if (upTrends > downTrends && upTrends >= Math.ceil(total * 0.3)) trend = "worsening";
  else if (downTrends > upTrends) trend = "improving";

  // 7-day HRI history — simulated realistic escalating trend
  const dayLabels = ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Yesterday", "Today"];
  const hriHistory = dayLabels.map((day, i) => ({
    day,
    hri: i === dayLabels.length - 1
      ? hri
      : Math.max(0, Math.round(hri * (0.5 + (i / (dayLabels.length - 1)) * 0.45))),
  }));

  const getSpeciesStats = (sp: "Cow" | "Goat" | "Buffalo"): SpeciesHerdStats => {
    const subset = animals.filter(
      (a) => (a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow")) === sp
    );
    const subTotal = subset.length;
    if (subTotal === 0) return emptyStats(sp);
    const sHigh = subset.filter((a) => a.risk === "high").length;
    const sMod  = subset.filter((a) => a.risk === "moderate").length;
    const sLow  = subset.filter((a) => a.risk === "low").length;
    const sNone = subset.filter((a) => a.risk === "none").length;
    const sHri  = Math.round(((sLow * 0 + sMod * 1 + sHigh * 2) / (subTotal * 2)) * 100);
    const sAvgEc  = Number((subset.reduce((acc, a) => acc + (a.conductivity || 5.0), 0) / subTotal).toFixed(1));
    const sAvgScc = Math.round(subset.reduce((acc, a) => acc + (a.scc || (sp === "Goat" ? 450000 : 150000)), 0) / subTotal);
    const sTotalMilk = Number(subset.reduce((acc, a) => acc + (a.milk || 0), 0).toFixed(1));
    let sStatus: "LOW" | "MODERATE" | "HIGH" = "LOW";
    if (sHri >= 70) sStatus = "HIGH";
    else if (sHri >= 40) sStatus = "MODERATE";
    return {
      species: sp, count: subTotal, high: sHigh, moderate: sMod, low: sLow, none: sNone,
      hri: sHri, status: sStatus, avgEC: sAvgEc, avgSCC: sAvgScc, totalMilk: sTotalMilk,
    };
  };

  const speciesBreakdown = {
    cows:      getSpeciesStats("Cow"),
    goats:     getSpeciesStats("Goat"),
    buffaloes: getSpeciesStats("Buffalo"),
  };

  let clinicalAdvisory = "";
  if (status === "HIGH") {
    clinicalAdvisory = `\uD83D\uDEA8 Immediate Herd Outbreak Protocol: ${high} animals show clinical signs. Enforce strict isolation, sanitize milking equipment between animals, and administer vet-directed antibiotic / herbal dip.`;
  } else if (status === "MODERATE") {
    clinicalAdvisory = `\u26A0\uFE0F Elevated Subclinical Transmission: ${moderate} animals in incubation (70-80% risk). Apply post-milking 0.5% iodine teat barrier across all cows and 2-half barrier for goats.`;
  } else {
    clinicalAdvisory = `\u2705 Biosecure Herd Condition: Overall mastitis transmission rate is minimal. Continue standard teat hygiene and daily IoT conductivity screening.`;
  }

  return {
    totalAnimals: total,
    counts: { high, moderate, low, none },
    hri, prevHri, hriDelta, avgRisk,
    status, trend,
    highRiskPercentage:     Math.round((high / total) * 100),
    moderateRiskPercentage: Math.round((moderate / total) * 100),
    moderateHighPercentage: Math.round(((moderate + high) / total) * 100),
    healthyPercentage:      Math.round(((low + none) / total) * 100),
    quarantineCount: high,
    watchListCount:  moderate,
    hriHistory,
    speciesBreakdown,
    clinicalAdvisory,
  };
}
