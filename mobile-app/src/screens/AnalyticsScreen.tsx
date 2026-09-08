import React, { useState } from "react";
import { BackHeader, Card, SectionLabel, ReadAloudFAB, RiskBadge } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { t } from "../i18n/index";
import type { Animal } from "../types/index";

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
  const [filter, setFilter] = useState<"all" | "high" | "moderate" | "healthy">("all");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // Dynamic calculations from context
  const totalCows = animals.length;
  const highRiskCount = animals.filter((a) => a.risk === "high").length;
  const modRiskCount = animals.filter((a) => a.risk === "moderate").length;
  const healthyCount = animals.filter((a) => a.risk === "none" || a.risk === "low").length;

  const avgSCC = Math.round(
    animals.reduce((acc, a) => acc + (a.scc || 0), 0) / (totalCows || 1)
  );

  const totalMilkYield = animals
    .reduce((acc, a) => acc + (a.milk || 0), 0)
    .toFixed(1);

  // Herd Health Resilience Index (0 - 100)
  const healthIndex = Math.round(
    ((healthyCount * 1.0 + modRiskCount * 0.5) / (totalCows || 1)) * 100
  );

  // Economic loss calculation (assuming ₹42/L milk and 3.5L/day loss per clinical case + ₹650 vet fee)
  const dailyLossPrevented = (modRiskCount * 3.5 * 42 + highRiskCount * 650).toFixed(0);

  // 7-day trend mock data
  const sccHistory = [310, 295, 280, 265, 255, 248, avgSCC];
  const yieldHistory = [395, 402, 410, 415, 418, 421, parseFloat(totalMilkYield) || 424];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

  const filteredAnimals = animals.filter((a) => {
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
        {/* Herd Resilience Score Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1C3814 0%, #2A5C1F 100%)",
            borderRadius: 18,
            padding: "16px 18px",
            color: "#FFFFFF",
            marginBottom: 16,
            boxShadow: "0 6px 20px rgba(42,92,31,0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#A8D59D", textTransform: "uppercase" }}>
                {lang === "Tamil" ? "பண்ணை சுகாதார குறியீடு" : lang === "Hindi" ? "हर्ड हेल्थ इंडेक्स" : "Herd Health & Biosecurity Score"}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
                  {healthIndex}
                </span>
                <span style={{ fontSize: 16, color: "#A8D59D", fontWeight: 600 }}>/ 100</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: healthIndex >= 75 ? "#4ADE80" : "#FBBF24",
                    color: "#0F2912",
                    padding: "3px 8px",
                    borderRadius: 12,
                    marginLeft: 6,
                  }}
                >
                  {healthIndex >= 75 ? "Optimal" : "Attention Needed"}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 34, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" }}>🛡️</div>
          </div>

          <div style={{ marginTop: 12, background: "rgba(255,255,255,0.12)", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <div
              style={{
                width: `${healthIndex}%`,
                height: "100%",
                background: "linear-gradient(90deg, #FBBF24 0%, #4ADE80 100%)",
                borderRadius: 8,
                transition: "width 0.6s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#D1E7CC", marginTop: 8 }}>
            <span>{healthyCount} Healthy Cows</span>
            <span>{modRiskCount} Intermediate (70-80%)</span>
            <span>{highRiskCount} Critical</span>
          </div>
        </div>

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
              <span style={{ fontSize: 11, color: "#9E8B75" }}>/ {totalCows} cows</span>
            </div>
            <div style={{ fontSize: 10.5, color: "#B83220", fontWeight: 600, marginTop: 4 }}>
              {highRiskCount} critical isolation
            </div>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid #E8E3DA", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A7356", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("avg_scc", lang)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: avgSCC > 300 ? "#C47A10" : "#2A5C1F" }}>
                {avgSCC}k
              </span>
              <span style={{ fontSize: 11, color: "#9E8B75" }}>cells/mL</span>
            </div>
            <div style={{ fontSize: 10.5, color: "#2A5C1F", fontWeight: 600, marginTop: 4 }}>
              ↓ 18% vs last week
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
              +4.2% daily target
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

        {/* SCC & Yield Correlation Trends */}
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

              {/* SCC Line (Amber / Red) */}
              <polyline
                fill="none"
                stroke="#C47A10"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sccHistory
                  .map((val, idx) => {
                    const x = 25 + idx * 47;
                    const y = 110 - ((val - 150) / 200) * 80;
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
                    const x = 25 + idx * 47;
                    const y = 115 - ((val - 380) / 60) * 80;
                    return `${x},${Math.max(20, Math.min(115, y))}`;
                  })
                  .join(" ")}
              />

              {/* Data points */}
              {sccHistory.map((val, idx) => {
                const x = 25 + idx * 47;
                const y = 110 - ((val - 150) / 200) * 80;
                return (
                  <circle
                    key={`scc-${idx}`}
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
              {days.map((d, idx) => (
                <text
                  key={d}
                  x={25 + idx * 47}
                  y="130"
                  textAnchor="middle"
                  fontSize="9"
                  fill="#8A7356"
                  fontWeight="600"
                >
                  {d}
                </text>
              ))}
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 11 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, background: "#C47A10", borderRadius: 2 }} />
              <span style={{ color: "#544634", fontWeight: 600 }}>Avg SCC (cells/mL)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 3, background: "#2A5C1F", borderRadius: 2 }} />
              <span style={{ color: "#544634", fontWeight: 600 }}>Milk Yield (L)</span>
            </div>
          </div>
        </Card>

        {/* Somatic Cell Count Herd Spectrum */}
        <Card style={{ marginBottom: 16 }}>
          <SectionLabel>Herd Somatic Cell Spectrum</SectionLabel>
          <div style={{ fontSize: 11.5, color: "#6B7A5C", marginBottom: 10 }}>
            ICAR-NRC / NMC benchmark: &lt;200k = Healthy, 200k–400k = Subclinical (High Risk in 7–14d), &gt;400k = Clinical
          </div>

          {/* Stacked distribution bar */}
          <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
            <div
              style={{
                width: `${(healthyCount / totalCows) * 100}%`,
                background: "#2E7D32",
                transition: "width 0.4s",
              }}
              title={`Healthy: ${healthyCount}`}
            />
            <div
              style={{
                width: `${(modRiskCount / totalCows) * 100}%`,
                background: "#F59E0B",
                transition: "width 0.4s",
              }}
              title={`Intermediate: ${modRiskCount}`}
            />
            <div
              style={{
                width: `${(highRiskCount / totalCows) * 100}%`,
                background: "#DC2626",
                transition: "width 0.4s",
              }}
              title={`Clinical: ${highRiskCount}`}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
            <div style={{ background: "#E8F5E9", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid #2E7D32" }}>
              <div style={{ color: "#2E7D32", fontWeight: 700 }}>&lt;200k Healthy</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1B5E20", marginTop: 2 }}>
                {healthyCount} cows ({Math.round((healthyCount / totalCows) * 100)}%)
              </div>
            </div>
            <div style={{ background: "#FEF3C7", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid #F59E0B" }}>
              <div style={{ color: "#B45309", fontWeight: 700 }}>200–400k Warning</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E", marginTop: 2 }}>
                {modRiskCount} cows ({Math.round((modRiskCount / totalCows) * 100)}%)
              </div>
            </div>
            <div style={{ background: "#FEE2E2", padding: "8px 10px", borderRadius: 8, borderLeft: "3px solid #DC2626" }}>
              <div style={{ color: "#B91C1C", fontWeight: 700 }}>&gt;400k Critical</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#991B1B", marginTop: 2 }}>
                {highRiskCount} cows ({Math.round((highRiskCount / totalCows) * 100)}%)
              </div>
            </div>
          </div>
        </Card>

        {/* Cow-by-Cow Health Breakdown Matrix */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <SectionLabel>Herd Health Breakdown</SectionLabel>
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
            {filteredAnimals.map((animal) => (
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
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1C2714" }}>{animal.name}</span>
                    <span style={{ fontSize: 11, color: "#7B6F5D" }}>({animal.id})</span>
                    {animal.age && (
                      <span style={{ fontSize: 9.5, background: "#E8E3DA", color: "#544634", padding: "1px 5px", borderRadius: 4 }}>
                        {animal.age}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>
                    {animal.breed} · Lactation #{animal.lactation} · {animal.milk}L/day
                  </div>
                </div>

                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <RiskBadge risk={animal.risk} lang={lang} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: animal.scc > 300 ? "#B83220" : "#2A5C1F" }}>
                    {animal.scc}k SCC
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
