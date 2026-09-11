import React, { useState } from "react";
import { BackHeader, Card, SectionLabel, ReadAloudFAB, RiskBadge } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { useHerd } from "../context/HerdContext";
import { HERDS, type Animal } from "../types/index";
import { calculateHerdRisk, filterAnimalsByHerd } from "../services/herdService";
import { t } from "../i18n/index";

export function AnalyticsScreen({
  onBack,
  lang,
  onSelectAnimal,
}: {
  onBack: () => void;
  lang: string;
  onSelectAnimal?: (animal: Animal) => void;
}) {
  const { animals } = useAnimals();
  const { selectedHerdId, setSelectedHerdId } = useHerd();
  const [filter, setFilter] = useState<"all" | "high" | "moderate" | "healthy">("all");
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "Cow" | "Goat" | "Buffalo">("all");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Get current active herd animals
  const activeAnimals = filterAnimalsByHerd(animals, selectedHerdId);
  const herdAssessment = calculateHerdRisk(activeAnimals);

  // Dynamic calculations from context
  const totalAnimalsCount = Math.max(1, activeAnimals?.length || 0);
  const highRiskCount = activeAnimals.filter((a) => a.risk === "high").length;
  const modRiskCount = activeAnimals.filter((a) => a.risk === "moderate").length;
  const healthyCount = activeAnimals.filter((a) => a.risk === "none" || a.risk === "low").length;

  const avgEC = Number(
    (
      activeAnimals.reduce((acc, a) => acc + (a.conductivity || 5.2), 0) / (activeAnimals.length || 1)
    ).toFixed(2)
  );

  const totalMilkYield = activeAnimals
    .reduce((acc, a) => acc + (a.milk || 0), 0)
    .toFixed(1);

  // Economic loss calculation (assuming ₹42/L milk and 3.5L/day loss per clinical case + ₹650 vet fee)
  const dailyLossPrevented = (modRiskCount * 3.5 * 42 + highRiskCount * 650).toFixed(0);

  // Side-by-side comparison for all individual herds
  const herdComparisons = HERDS.map((h) => {
    const herdAnimals = animals.filter((a) => a.herdId === h.id);
    const assessment = calculateHerdRisk(herdAnimals);
    const cows = herdAnimals.filter((a) => a.species === "Cow").length;
    const goats = herdAnimals.filter((a) => a.species === "Goat").length;
    const buffalos = herdAnimals.filter((a) => a.species === "Buffalo").length;
    const avgHerdEC = Number(
      (
        herdAnimals.reduce((acc, a) => acc + (a.conductivity || 5.2), 0) / (herdAnimals.length || 1)
      ).toFixed(2)
    );
    const herdYield = herdAnimals.reduce((acc, a) => acc + (a.milk || 0), 0).toFixed(1);

    return {
      herd: h,
      animals: herdAnimals,
      assessment,
      cows,
      goats,
      buffalos,
      avgEC: avgHerdEC,
      totalYield: herdYield,
    };
  });

  // Dynamic trend data based on selected timeRange (Milk EC in mS/cm and Milk Yield in L)
  const trendData: Record<"7d" | "30d" | "90d", { ec: number[]; yield: number[]; labels: string[] }> = {
    "7d": {
      ec: [5.2, 5.3, 5.1, 5.4, 5.6, 5.5, avgEC || 5.4],
      yield: [395, 402, 410, 415, 418, 421, parseFloat(totalMilkYield) || 424],
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"],
    },
    "30d": {
      ec: [5.8, 5.6, 5.5, 5.4, 5.3, 5.4, avgEC || 5.4],
      yield: [360, 375, 390, 405, 415, 420, parseFloat(totalMilkYield) || 424],
      labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Today"],
    },
    "90d": {
      ec: [6.4, 6.1, 5.9, 5.7, 5.5, 5.4, avgEC || 5.4],
      yield: [330, 350, 375, 395, 410, 420, parseFloat(totalMilkYield) || 424],
      labels: ["M-3", "M-2.5", "M-2", "M-1.5", "M-1", "M-0.5", "Today"],
    },
  };

  const currentTrend = trendData[timeRange] || trendData["7d"];
  const ecHistory = currentTrend.ec;
  const yieldHistory = currentTrend.yield;
  const days = currentTrend.labels;

  const filteredAnimals = activeAnimals.filter((a) => {
    if (speciesFilter !== "all" && a.species !== speciesFilter) return false;
    if (filter === "high") return a.risk === "high";
    if (filter === "moderate") return a.risk === "moderate";
    if (filter === "healthy") return a.risk === "none" || a.risk === "low";
    return true;
  });

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#F7F4EE",
        position: "relative",
      }}
    >
      <ReadAloudFAB screen="analytics" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E0D8" }}>
        <BackHeader title={t("analytics_title", lang)} onBack={onBack} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 80px" }}>
        {/* Herd Filter Selector Pill Bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          <button
            onClick={() => setSelectedHerdId("all")}
            style={{
              background: selectedHerdId === "all" ? "#2A5C1F" : "#FFFFFF",
              color: selectedHerdId === "all" ? "#FFFFFF" : "#4A5A38",
              border: `1px solid ${selectedHerdId === "all" ? "#2A5C1F" : "#D8D2C6"}`,
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              boxShadow: selectedHerdId === "all" ? "0 2px 6px rgba(42,92,31,0.25)" : "none",
            }}
          >
            🌐 All Herds ({animals.length})
          </button>
          {HERDS.map((h) => {
            const isSel = selectedHerdId === h.id;
            const hAnimals = animals.filter((a) => a.herdId === h.id);
            const highCount = hAnimals.filter((a) => a.risk === "high").length;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHerdId(h.id)}
                style={{
                  background: isSel ? "#2A5C1F" : "#FFFFFF",
                  color: isSel ? "#FFFFFF" : "#4A5A38",
                  border: `1px solid ${isSel ? "#2A5C1F" : "#D8D2C6"}`,
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: isSel ? "0 2px 6px rgba(42,92,31,0.25)" : "none",
                }}
              >
                <span>🏡 {h.name.split(" ")[0]} {h.name.split(" ")[1]}</span>
                {highCount > 0 && (
                  <span
                    style={{
                      background: isSel ? "#EF4444" : "#FEE2E2",
                      color: isSel ? "#FFFFFF" : "#B91C1C",
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: "1px 5px",
                      borderRadius: 10,
                    }}
                  >
                    {highCount} High
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Herd Level 2 Risk Condition Card */}
        <div
          style={{
            background: herdAssessment.status === "HIGH"
              ? "linear-gradient(135deg, #3B120D 0%, #6B1D12 100%)"
              : herdAssessment.status === "MODERATE"
              ? "linear-gradient(135deg, #3A2608 0%, #6B450E 100%)"
              : "linear-gradient(135deg, #1C3814 0%, #2A5C1F 100%)",
            borderRadius: 18,
            padding: "16px 18px",
            color: "#FFFFFF",
            marginBottom: 16,
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    background: "rgba(255,255,255,0.18)",
                    color: "#FFFFFF",
                    padding: "2px 7px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Level 2 · Herd Risk Index (HRI)
                </span>
                <span style={{ fontSize: 11, color: "#E2E8F0" }}>
                  {selectedHerdId === "all" ? "Whole Farm" : HERDS.find(h => h.id === selectedHerdId)?.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
                  {herdAssessment.hri}%
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background: herdAssessment.status === "HIGH" ? "#EF4444" : herdAssessment.status === "MODERATE" ? "#F59E0B" : "#22C55E",
                    color: "#FFFFFF",
                    padding: "3px 8px",
                    borderRadius: 12,
                  }}
                >
                  {herdAssessment.status} RISK HERD
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                  (Avg Risk: {herdAssessment.avgRisk}%)
                </span>
              </div>
            </div>
            <div style={{ fontSize: 32 }}>
              {herdAssessment.status === "HIGH" ? "🚨" : herdAssessment.status === "MODERATE" ? "⚠️" : "🛡️"}
            </div>
          </div>

          {/* HRI Progress Bar */}
          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.15)", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${herdAssessment.hri}%`,
                height: "100%",
                background: herdAssessment.status === "HIGH"
                  ? "linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)"
                  : herdAssessment.status === "MODERATE"
                  ? "linear-gradient(90deg, #22C55E 0%, #F59E0B 100%)"
                  : "linear-gradient(90deg, #4ADE80 0%, #22C55E 100%)",
                borderRadius: 8,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 8 }}>
            <span>{healthyCount} Low Risk ({herdAssessment.healthyPercentage}%)</span>
            <span>{modRiskCount} Mod ({herdAssessment.moderateRiskPercentage}%)</span>
            <span style={{ fontWeight: 700, color: highRiskCount > 0 ? "#FCA5A5" : "#E2E8F0" }}>
              {highRiskCount} High ({herdAssessment.highRiskPercentage}%)
            </span>
          </div>

          {/* Clinical Advisory Snippet */}
          <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(0,0,0,0.22)", borderRadius: 8, fontSize: 10.5, lineHeight: 1.35, color: "#F1F5F9" }}>
            📋 <strong>Biosecurity Protocol:</strong> {herdAssessment.clinicalAdvisory}
          </div>
        </div>

        {/* ── MULTI-HERD SIDE-BY-SIDE COMPARISON MATRIX TABLE ── */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <SectionLabel>Multi-Herd Side-by-Side HRI Comparison</SectionLabel>
              <div style={{ fontSize: 11, color: "#7B6F5D", marginTop: 2 }}>
                Comparative risk matrix across all farm barns &amp; species cohorts
              </div>
            </div>
            <span
              style={{
                fontSize: 10,
                background: "#E8E3DA",
                color: "#544634",
                padding: "2px 8px",
                borderRadius: 10,
                fontWeight: 700,
              }}
            >
              Formula: HRI = [(0·L + 1·M + 2·H) / 2T] × 100
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 440 }}>
              <thead>
                <tr style={{ background: "#F2EDE4", borderBottom: "1.5px solid #DDD6C8", textAlign: "left" }}>
                  <th style={{ padding: "8px 6px", fontWeight: 800, color: "#4A3D2A" }}>Herd / Barn</th>
                  <th style={{ padding: "8px 6px", fontWeight: 800, color: "#4A3D2A" }}>Animals &amp; Mix</th>
                  <th style={{ padding: "8px 6px", fontWeight: 800, color: "#4A3D2A", textAlign: "center" }}>HRI Index</th>
                  <th style={{ padding: "8px 6px", fontWeight: 800, color: "#4A3D2A", textAlign: "center" }}>Risk Status</th>
                  <th style={{ padding: "8px 6px", fontWeight: 800, color: "#4A3D2A", textAlign: "right" }}>Avg EC / Yield</th>
                </tr>
              </thead>
              <tbody>
                {herdComparisons.map(({ herd, assessment, cows, goats, buffalos, avgEC: hAvgEC, totalYield: hYield }) => {
                  const isSelected = selectedHerdId === herd.id;
                  const statusBg = assessment.status === "HIGH" ? "#FEE2E2" : assessment.status === "MODERATE" ? "#FEF3C7" : "#E8F5E9";
                  const statusColor = assessment.status === "HIGH" ? "#B91C1C" : assessment.status === "MODERATE" ? "#B45309" : "#1B5E20";

                  return (
                    <tr
                      key={herd.id}
                      onClick={() => setSelectedHerdId(herd.id)}
                      style={{
                        borderBottom: "1px solid #ECE7DE",
                        background: isSelected ? "#F0F7EE" : "#FFFFFF",
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                    >
                      <td style={{ padding: "10px 6px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 800, color: "#1C2714", display: "flex", alignItems: "center", gap: 4 }}>
                          <span>🏡</span>
                          <span>{herd.name}</span>
                        </div>
                        <div style={{ fontSize: 9.5, color: "#8A7356" }}>{herd.location}</div>
                      </td>

                      <td style={{ padding: "10px 6px", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, color: "#2B3A1E" }}>{herd.animalCount} Animals</div>
                        <div style={{ fontSize: 9.5, color: "#6B7A5C" }}>
                          {cows > 0 && `🐄 ${cows}c `}
                          {goats > 0 && `🐐 ${goats}g `}
                          {buffalos > 0 && `🐃 ${buffalos}b`}
                        </div>
                      </td>

                      <td style={{ padding: "10px 6px", textAlign: "center", verticalAlign: "middle" }}>
                        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: statusColor }}>
                          {assessment.hri}%
                        </span>
                        <div style={{ fontSize: 9, color: "#8A7356" }}>Avg {assessment.avgRisk}%</div>
                      </td>

                      <td style={{ padding: "10px 6px", textAlign: "center", verticalAlign: "middle" }}>
                        <span
                          style={{
                            background: statusBg,
                            color: statusColor,
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: "3px 7px",
                            borderRadius: 10,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {assessment.status}
                        </span>
                        <div style={{ fontSize: 8.5, color: "#8A7356", marginTop: 2 }}>
                          {assessment.counts.high}H · {assessment.counts.moderate}M · {assessment.counts.low + assessment.counts.none}L
                        </div>
                      </td>

                      <td style={{ padding: "10px 6px", textAlign: "right", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, color: hAvgEC > 6.5 ? "#B83220" : "#2A5C1F" }}>
                          {hAvgEC} mS/cm
                        </div>
                        <div style={{ fontSize: 9.5, color: "#544634" }}>{hYield} L/day</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 4 Core KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid #E8E3DA", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A7356", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("at_risk", lang)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: highRiskCount > 0 ? "#B83220" : "#2A5C1F" }}>
                {highRiskCount + modRiskCount}
              </span>
              <span style={{ fontSize: 11, color: "#9E8B75" }}>/ {totalAnimalsCount} animals</span>
            </div>
            <div style={{ fontSize: 10.5, color: "#B83220", fontWeight: 600, marginTop: 4 }}>
              {highRiskCount} critical isolation ({herdAssessment.highRiskPercentage}%)
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid #E8E3DA", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A7356", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("avg_scc", lang)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: avgEC > 6.5 ? "#C47A10" : "#2A5C1F" }}>
                {avgEC}
              </span>
              <span style={{ fontSize: 11, color: "#9E8B75" }}>mS/cm</span>
            </div>
            <div style={{ fontSize: 10.5, color: avgEC > 6.5 ? "#C47A10" : "#2A5C1F", fontWeight: 600, marginTop: 4 }}>
              {avgEC > 6.5 ? "↑ Elevated (Risk)" : "✓ Normal (4.0–6.5)"}
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid #E8E3DA", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A7356", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("milk_yield", lang)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: "#2A5C1F" }}>
                {totalMilkYield}L
              </span>
              <span style={{ fontSize: 11, color: "#9E8B75" }}>/ day</span>
            </div>
            <div style={{ fontSize: 10.5, color: "#2A5C1F", fontWeight: 600, marginTop: 4 }}>
              {selectedHerdId === "all" ? "All 3 Herds Combined" : `${HERDS.find(h => h.id === selectedHerdId)?.name}`}
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid #E8E3DA", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A7356", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {lang === "Tamil" ? "சேமிக்கப்பட்ட இழப்பு" : lang === "Hindi" ? "बचाया गया नुकसान" : "Loss Prevented"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: "#1E5C28" }}>
                ₹{dailyLossPrevented}
              </span>
              <span style={{ fontSize: 11, color: "#9E8B75" }}>/ day</span>
            </div>
            <div style={{ fontSize: 10.5, color: "#1E5C28", fontWeight: 600, marginTop: 4 }}>
              via 7–14d early AI alert
            </div>
          </div>
        </div>

        {/* ── MULTI-SPECIES RISK & SCC COMPARISON CARDS ── */}
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel>Species-Calibrated Risk &amp; SCC Thresholds</SectionLabel>
          <div style={{ fontSize: 11, color: "#6B7A5C", marginBottom: 10 }}>
            Caprine milk (Goat) naturally has higher SCC (apocrine secretion); Bovine (Cow/Buffalo) uses standard thresholds.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {/* Cow Card */}
            <div
              onClick={() => setSpeciesFilter(speciesFilter === "Cow" ? "all" : "Cow")}
              style={{
                background: speciesFilter === "Cow" ? "#E8F5E9" : "#FBF9F5",
                borderRadius: 10,
                padding: "10px 8px",
                border: `1.5px solid ${speciesFilter === "Cow" ? "#2E7D32" : "#E8E3DA"}`,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20 }}>🐄</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>Cows (4-Qtr)</div>
              <div style={{ fontSize: 9.5, color: "#7A6B58" }}>Normal SCC &lt;200k</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: herdAssessment.speciesBreakdown.cows.high > 0 ? "#B91C1C" : "#2E7D32", marginTop: 4 }}>
                {herdAssessment.speciesBreakdown.cows.high} High / {herdAssessment.speciesBreakdown.cows.count} Total
              </div>
            </div>

            {/* Goat Card */}
            <div
              onClick={() => setSpeciesFilter(speciesFilter === "Goat" ? "all" : "Goat")}
              style={{
                background: speciesFilter === "Goat" ? "#E8F5E9" : "#FBF9F5",
                borderRadius: 10,
                padding: "10px 8px",
                border: `1.5px solid ${speciesFilter === "Goat" ? "#2E7D32" : "#E8E3DA"}`,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20 }}>🐐</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>Goats (2-Half)</div>
              <div style={{ fontSize: 9.5, color: "#7A6B58" }}>Normal SCC &lt;750k</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: herdAssessment.speciesBreakdown.goats.high > 0 ? "#B91C1C" : "#2E7D32", marginTop: 4 }}>
                {herdAssessment.speciesBreakdown.goats.high} High / {herdAssessment.speciesBreakdown.goats.count} Total
              </div>
            </div>

            {/* Buffalo Card */}
            <div
              onClick={() => setSpeciesFilter(speciesFilter === "Buffalo" ? "all" : "Buffalo")}
              style={{
                background: speciesFilter === "Buffalo" ? "#E8F5E9" : "#FBF9F5",
                borderRadius: 10,
                padding: "10px 8px",
                border: `1.5px solid ${speciesFilter === "Buffalo" ? "#2E7D32" : "#E8E3DA"}`,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20 }}>🐃</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>Buffalo (4-Qtr)</div>
              <div style={{ fontSize: 9.5, color: "#7A6B58" }}>Normal SCC &lt;200k</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: herdAssessment.speciesBreakdown.buffaloes.high > 0 ? "#B91C1C" : "#2E7D32", marginTop: 4 }}>
                {herdAssessment.speciesBreakdown.buffaloes.high} High / {herdAssessment.speciesBreakdown.buffaloes.count} Total
              </div>
            </div>
          </div>
        </Card>

        {/* EC & Yield Correlation Trends */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionLabel>{t("scc_trend", lang)} vs {t("milk_yield", lang)}</SectionLabel>
            <div style={{ display: "flex", gap: 4, background: "#F0EBE1", padding: 2, borderRadius: 8 }}>
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  style={{
                    border: "none",
                    background: timeRange === r ? "#2A5C1F" : "transparent",
                    color: timeRange === r ? "#FFFFFF" : "#6B7A5C",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Multi-axis Chart */}
          <div style={{ width: "100%", height: 160, position: "relative" }}>
            <svg viewBox="0 0 340 140" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="320" y2="20" stroke="#EBE6DE" strokeDasharray="3,3" />
              <line x1="20" y1="60" x2="320" y2="60" stroke="#EBE6DE" strokeDasharray="3,3" />
              <line x1="20" y1="100" x2="320" y2="100" stroke="#EBE6DE" strokeDasharray="3,3" />

              {/* EC Line (Conductivity) */}
              <polyline
                fill="none"
                stroke="#C47A10"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={ecHistory
                  .map((val, idx) => {
                    const step = days.length > 1 ? 280 / (days.length - 1) : 280;
                    const x = 25 + idx * step;
                    const y = 110 - ((val - 3.5) / 5.0) * 80;
                    return `${x},${Math.max(20, Math.min(115, y))}`;
                  })
                  .join(" ")}
              />

              {/* Milk Yield Line (Green) */}
              <polyline
                fill="none"
                stroke="#2A5C1F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4,2"
                points={yieldHistory
                  .map((val, idx) => {
                    const step = days.length > 1 ? 280 / (days.length - 1) : 280;
                    const x = 25 + idx * step;
                    const y = 115 - ((val - 300) / 150) * 80;
                    return `${x},${Math.max(20, Math.min(115, y))}`;
                  })
                  .join(" ")}
              />

              {/* Data points */}
              {ecHistory.map((val, idx) => {
                const step = days.length > 1 ? 280 / (days.length - 1) : 280;
                const x = 25 + idx * step;
                const y = 110 - ((val - 3.5) / 5.0) * 80;
                return (
                  <circle
                    key={`ec-${idx}`}
                    cx={x}
                    cy={Math.max(20, Math.min(115, y))}
                    r="3.5"
                    fill="#C47A10"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Day Labels */}
              {days.map((d, idx) => {
                const step = days.length > 1 ? 280 / (days.length - 1) : 280;
                return (
                  <text
                    key={`${d}-${idx}`}
                    x={25 + idx * step}
                    y="130"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#8A7356"
                    fontWeight="600"
                  >
                    {d}
                  </text>
                );
              })}
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, background: "#C47A10", borderRadius: 2 }} />
              <span style={{ color: "#544634", fontWeight: 600 }}>Avg EC (mS/cm)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, background: "#2A5C1F", borderRadius: 2 }} />
              <span style={{ color: "#544634", fontWeight: 600 }}>Milk Yield (L)</span>
            </div>
          </div>
        </Card>

        {/* Herd Mastitis Risk Spectrum (Milk Sensors) */}
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel>Herd Mastitis Risk Spectrum (Milk IoT Sensors)</SectionLabel>
          <div style={{ fontSize: 11.5, color: "#6B7A5C", marginBottom: 10 }}>
            Evaluated via live Milk pH (6.4–6.8), EC (4.0–6.5 mS/cm) &amp; Teat Temp (36.5–38.5°C)
          </div>

          {/* Stacked distribution bar */}
          <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
            <div
              style={{
                width: `${Math.max(0, (healthyCount / totalAnimalsCount) * 100)}%`,
                background: "#2E7D32",
                transition: "width 0.4s",
              }}
              title={`Healthy: ${healthyCount}`}
            />
            <div
              style={{
                width: `${Math.max(0, (modRiskCount / totalAnimalsCount) * 100)}%`,
                background: "#F59E0B",
                transition: "width 0.4s",
              }}
              title={`Intermediate: ${modRiskCount}`}
            />
            <div
              style={{
                width: `${Math.max(0, (highRiskCount / totalAnimalsCount) * 100)}%`,
                background: "#DC2626",
                transition: "width 0.4s",
              }}
              title={`Clinical: ${highRiskCount}`}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
            <div style={{ background: "#E8F5E9", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid #2E7D32" }}>
              <div style={{ color: "#2E7D32", fontWeight: 700 }}>Normal &amp; Healthy</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1B5E20", marginTop: 2 }}>
                {healthyCount} ({Math.round((healthyCount / totalAnimalsCount) * 100)}%)
              </div>
            </div>
            <div style={{ background: "#FEF3C7", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid #F59E0B" }}>
              <div style={{ color: "#B45309", fontWeight: 700 }}>Chance (7–14d)</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E", marginTop: 2 }}>
                {modRiskCount} ({Math.round((modRiskCount / totalAnimalsCount) * 100)}%)
              </div>
            </div>
            <div style={{ background: "#FEE2E2", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid #DC2626" }}>
              <div style={{ color: "#B91C1C", fontWeight: 700 }}>Already Affected</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#991B1B", marginTop: 2 }}>
                {highRiskCount} ({Math.round((highRiskCount / totalAnimalsCount) * 100)}%)
              </div>
            </div>
          </div>
        </Card>

        {/* Animal-by-Animal Health Breakdown Matrix (Level 1) */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <SectionLabel>Individual Animal Breakdown (Level 1)</SectionLabel>
              <div style={{ fontSize: 11, color: "#7B6F5D", marginTop: 2 }}>
                Showing {filteredAnimals.length} animal{filteredAnimals.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "high", "moderate", "healthy"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    border: "none",
                    background: filter === f ? "#2A5C1F" : "#EFEAE0",
                    color: filter === f ? "#FFFFFF" : "#594F40",
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    cursor: "pointer",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredAnimals.map((animal) => {
              const spIcon = animal.species === "Goat" ? "🐐" : animal.species === "Buffalo" ? "🐃" : "🐄";
              const herd = HERDS.find(h => h.id === animal.herdId);
              const riskPct = animal.risk === "high" ? 88 : animal.risk === "moderate" ? 62 : animal.risk === "low" ? 22 : 8;

              return (
                <div
                  key={animal.id}
                  onClick={() => onSelectAnimal && onSelectAnimal(animal)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#FBF9F4",
                    borderRadius: 10,
                    border: "1px solid #ECE7DE",
                    cursor: onSelectAnimal ? "pointer" : "default",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{spIcon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1C2714" }}>{animal.name}</span>
                      <span style={{ fontSize: 11, color: "#7B6F5D" }}>({animal.id})</span>
                      {herd && (
                        <span style={{ fontSize: 9.5, background: "#E8E3DA", color: "#544634", padding: "1px 5px", borderRadius: 4 }}>
                          {herd.name.split(" ")[0]} {herd.name.split(" ")[1]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>
                      {animal.breed} · Lactation #{animal.lactation} · {animal.milk}L/day · Rumination {animal.rumination || 420}m
                    </div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 6,
                          background: animal.risk === "high" ? "#FEE2E2" : animal.risk === "moderate" ? "#FEF3C7" : "#DCFCE7",
                          color: animal.risk === "high" ? "#991B1B" : animal.risk === "moderate" ? "#92400E" : "#166534",
                        }}
                      >
                        {riskPct}% Risk
                      </span>
                      <RiskBadge level={animal.risk} risk={animal.risk} lang={lang} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: (animal.conductivity || 5.0) > 6.5 ? "#B83220" : "#2A5C1F" }}>
                      EC {animal.conductivity || 5.2} mS/cm · pH {animal.ph || 6.6}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
