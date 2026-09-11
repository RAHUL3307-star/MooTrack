import React, { useState } from "react";
import {
  StatusBar,
  BackHeader,
  Card,
  SectionLabel,
  RiskBadge,
  Sparkline,
  ReadAloudFAB,
} from "../components/ui";
import { ANIMALS, HERDS, RISK_COLOR } from "../types/index";
import type { Screen } from "../types/index";
import { t } from "../i18n/index";
import { useAnimals } from "../context/AnimalsContext";
import { calculateHerdRisk } from "../services/herdService";

export function AnimalProfileScreen({
  onBack,
  onNavigate,
  lang,
}: {
  onBack: () => void;
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { selectedAnimal, animals } = useAnimals();
  const [tab, setTab] = useState<"health" | "udder" | "milk" | "sensors" | "history">("health");
  const [historyTimeRange, setHistoryTimeRange] = useState<"24h" | "7d" | "14d" | "30d">("7d");

  const a = selectedAnimal || animals[0] || ANIMALS[0];
  const species = a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow");
  const speciesIcon = species === "Goat" ? "🐐" : species === "Buffalo" ? "🐃" : "🐄";

  const herdObj = HERDS.find((h) => h.id === a.herdId);
  const herdName = herdObj ? herdObj.name.split("–")[0].trim() : (a.herdId || "Herd A");

  const herd = calculateHerdRisk(animals);
  const herdSpeciesStats =
    species === "Goat"
      ? herd.speciesBreakdown.goats
      : species === "Buffalo"
      ? herd.speciesBreakdown.buffaloes
      : herd.speciesBreakdown.cows;

  // Species-calibrated SCC thresholds
  const normalSccThreshold = species === "Goat" ? 750000 : 200000;
  const criticalSccThreshold = species === "Goat" ? 1500000 : 500000;
  const animalScc = a.scc || (species === "Goat" ? 450000 : 185000);

  // Extended parameters with realistic defaults
  const rumination = a.rumination ?? (a.activity === "low" ? 210 : 360);
  const feeding = a.feeding ?? (a.risk === "high" ? 130 : 205);
  const ambientTemp = a.ambientTemp ?? 28.4;
  const humidity = a.humidity ?? 68;
  const thi = Number((0.8 * ambientTemp + (humidity / 100) * (ambientTemp - 14.4) + 46.4).toFixed(1)); // Temperature-Humidity Index

  // Historical datasets calibrated per time range
  const historyDatasets: Record<"24h" | "7d" | "14d" | "30d", {
    ec: number[];
    ph: number[];
    temp: number[];
    milk: number[];
    rumination: number[];
    labels: string[];
    timeline: Array<{ time: string; event: string; status: string; color: string }>;
  }> = {
    "24h": {
      ec: [5.2, 5.3, 5.4, 5.8, 6.2, a.conductivity || 5.2],
      ph: [6.6, 6.65, 6.62, 6.7, 6.68, a.ph || 6.65],
      temp: [38.6, 38.7, 38.8, 38.9, 39.1, a.temp || 38.8],
      milk: [a.milk ? a.milk * 0.48 : 5.0, a.milk ? a.milk * 0.52 : 5.2],
      rumination: [55, 62, 48, 58, 64, Math.round(rumination / 6)],
      labels: ["04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
      timeline: [
        { time: "Today 06:30 AM", event: `Morning milking: Yield ${(a.milk * 0.52).toFixed(1)}L · EC ${a.conductivity} mS/cm · Temp ${a.temp}°C`, status: "Milking", color: "#2A5C1F" },
        { time: "Today 07:15 AM", event: `Post-dip antiseptic foam applied on ${a.quarter}`, status: "Hygiene", color: "#3B82F6" },
        { time: "Today 09:00 AM", event: `Collar IMU recorded ${Math.round(rumination * 0.35)} min rumination in feed stall`, status: "Biometrics", color: "#6B7A5C" },
      ],
    },
    "7d": {
      ec: [4.8, 5.1, 5.3, 5.8, 6.4, 6.8, a.conductivity || 5.0],
      ph: [6.6, 6.62, 6.65, 6.7, 6.75, 6.8, a.ph || 6.7],
      temp: [38.5, 38.7, 38.9, 39.0, 39.2, 39.3, a.temp || 39.4],
      milk: species === "Goat" ? [3.2, 3.0, 2.8, 2.6, 2.4, 2.3, a.milk || 2.2] : [14.2, 13.6, 12.8, 11.9, 11.2, 10.8, a.milk || 10.2],
      rumination: [380, 360, 340, 310, 280, 240, rumination],
      labels: ["D-6", "D-5", "D-4", "D-3", "D-2", "Yst", "Today"],
      timeline: [
        { time: "Today 06:30 AM", event: `Daily milking yield ${a.milk}L — EC ${a.conductivity} mS/cm (${a.risk.toUpperCase()} risk tier)`, status: "Status", color: RISK_COLOR[a.risk].dot },
        { time: "Yesterday 05:45 PM", event: `Evening yield ${(a.milk * 0.95).toFixed(1)}L · Somatic Cell Count estimated at ${((animalScc) / 1000).toFixed(0)}k`, status: "Sensor", color: "#C47A10" },
        { time: "3 Days Ago", event: `Conductivity increased above 6.0 mS/cm — 7-14 day early warning triggered`, status: "AI Warning", color: "#B83220" },
        { time: "5 Days Ago", event: `Routine herd biosecurity check completed at ${herdName}`, status: "Audit", color: "#2A5C1F" },
      ],
    },
    "14d": {
      ec: [4.6, 4.7, 4.8, 5.0, 5.1, 5.3, 5.5, 5.8, 6.0, 6.2, 6.4, 6.6, 6.8, a.conductivity || 7.0],
      ph: [6.55, 6.58, 6.6, 6.62, 6.65, 6.68, 6.7, 6.72, 6.75, 6.78, 6.8, a.ph || 6.75],
      temp: [38.4, 38.5, 38.5, 38.6, 38.7, 38.8, 38.9, 39.0, 39.1, 39.2, 39.3, a.temp || 39.4],
      milk: species === "Goat" ? [3.5, 3.4, 3.3, 3.2, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, a.milk || 2.2] : [15.5, 15.0, 14.6, 14.2, 13.8, 13.2, 12.6, 12.0, 11.5, 11.0, 10.5, a.milk || 10.2],
      rumination: [420, 410, 400, 380, 370, 350, 340, 320, 300, 280, 260, 240, 220, rumination],
      labels: ["Wk-2", "D-12", "D-10", "D-8", "D-6", "D-4", "D-2", "Today"],
      timeline: [
        { time: "14-Day Overview", event: `Conductivity baseline drifted from 4.6 to ${a.conductivity} mS/cm. Daily milk dropped ~${((1 - (a.milk / (species === "Goat" ? 3.5 : 15.5))) * 100).toFixed(0)}%.`, status: "Biometrics", color: "#B83220" },
        { time: "7 Days Ago", event: `AI Risk elevated from LOW to ${a.risk.toUpperCase()}`, status: "Forecast", color: "#C47A10" },
        { time: "12 Days Ago", event: `Optimal lactation peak baseline confirmed`, status: "Baseline", color: "#2A5C1F" },
      ],
    },
    "30d": {
      ec: [4.5, 4.6, 4.8, 5.2, 5.8, 6.5, a.conductivity || 7.0],
      ph: [6.55, 6.58, 6.62, 6.68, 6.72, 6.78, a.ph || 6.75],
      temp: [38.3, 38.4, 38.6, 38.8, 39.0, 39.2, a.temp || 39.4],
      milk: species === "Goat" ? [3.6, 3.4, 3.2, 2.9, 2.6, 2.4, a.milk || 2.2] : [16.0, 15.2, 14.4, 13.5, 12.2, 11.0, a.milk || 10.2],
      rumination: [440, 420, 390, 350, 310, 270, rumination],
      labels: ["Month-1", "Wk-3", "Wk-2", "Wk-1", "D-3", "Today"],
      timeline: [
        { time: "30-Day Epidemiology Summary", event: `Lactation cycle month: Overall stability until mid-cycle subclinical mastitis event. Early detection prevented clinical progression in 3 quarters.`, status: "Report", color: "#2A5C1F" },
        { time: "22 Days Ago", event: `Monthly veterinary ultrasound & somatic cell benchmark completed`, status: "Vet Exam", color: "#3B82F6" },
      ],
    },
  };

  const currentDataset = historyDatasets[historyTimeRange];

  const tabLabels = {
    health: lang === "Tamil" ? "ஆரோக்கியம்" : lang === "Hindi" ? "स्वास्थ्य" : "Health",
    udder: lang === "Tamil" ? "மடிப் பகுப்பாய்வு" : lang === "Hindi" ? "अयन विश्लेषण" : species === "Goat" ? "2-Halves Udder" : "4-Quarters Udder",
    milk: lang === "Tamil" ? "பால்" : lang === "Hindi" ? "दूध" : "Milk",
    sensors: lang === "Tamil" ? "சென்சார்கள்" : lang === "Hindi" ? "सेंसर" : "Sensors",
    history: lang === "Tamil" ? "வரலாறு" : lang === "Hindi" ? "इतिहास" : "History",
  };

  // Quarter / Half telemetry simulation based on animal risk and quarter tag
  const isRightAffected = a.quarter.toLowerCase().includes("right");
  const isLeftAffected = a.quarter.toLowerCase().includes("left");
  const isRearAffected = a.quarter.toLowerCase().includes("rear");
  const isFrontAffected = a.quarter.toLowerCase().includes("front");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="animal-profile" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader
          title={t("animal_profile", lang)}
          onBack={onBack}
          action={
            <button
              onClick={() => onNavigate("ai-risk")}
              style={{
                background: "#E6F0E2",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#2A5C1F",
                cursor: "pointer",
              }}
            >
              {t("ai_risk_btn", lang)}
            </button>
          }
        />
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: RISK_COLOR[a.risk].bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                border: `2px solid ${RISK_COLOR[a.risk].border}`,
              }}
            >
              {speciesIcon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#1C2714",
                  }}
                >
                  {a.name}
                </span>
                <RiskBadge level={a.risk} lang={lang} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#9BA88C", marginTop: 2 }}>
                {a.id}
                {a.rfidTag && (
                  <span style={{ marginLeft: 8, color: "#4F8823" }}>· 📡 {a.rfidTag}</span>
                )}
              </div>
              {/* Badges row with Herd Name */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                <span style={{
                  background: "#1C3814", color: "#FFFFFF",
                  fontSize: 11.5, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 20,
                  boxShadow: "0 2px 6px rgba(28,56,20,0.2)",
                }}>
                  🏡 {herdName}
                </span>
                <span style={{
                  background: "#EEF6E4", color: "#2A5C1F",
                  fontSize: 11.5, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1.5px solid #C4DDA0",
                }}>
                  {speciesIcon} {species}
                </span>
                <span style={{
                  background: "#EEF6E4", color: "#2A5C1F",
                  fontSize: 11.5, fontWeight: 700,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1.5px solid #C4DDA0",
                }}>
                  🎂 Age: {a.age}
                </span>
                <span style={{
                  background: "#F0EDE6", color: "#6B7A5C",
                  fontSize: 11.5, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1px solid #E0DAD0",
                }}>
                  🐾 {a.breed}
                </span>
                <span style={{
                  background: "#F0EDE6", color: "#6B7A5C",
                  fontSize: 11.5, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1px solid #E0DAD0",
                }}>
                  🥛 Lac {a.lactation}
                </span>
                <span style={{
                  background: "#F0EDE6", color: "#6B7A5C",
                  fontSize: 11.5, fontWeight: 600,
                  padding: "4px 10px", borderRadius: 20,
                  border: "1px solid #E0DAD0",
                }}>
                  📍 {a.quarter}
                </span>
              </div>
            </div>
          </div>

          {/* ── Dual Risk Assessment Comparison Banner ───────────────────────── */}
          <div
            style={{
              marginTop: 12,
              background: "#F8FAFC",
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              padding: "10px 12px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            <div style={{ borderRight: "1px solid #E2E8F0", paddingRight: 8 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                LEVEL 1: ANIMAL RISK
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: RISK_COLOR[a.risk].text }}>
                  {a.risk.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  (Score {a.risk === "high" ? "88%" : a.risk === "moderate" ? "64%" : "12%"})
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                📍 Affected: {a.quarter}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                LEVEL 2: HERD CONDITION ({herdName})
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, color: herd.status === "HIGH" ? "#B83220" : herd.status === "MODERATE" ? "#C47A10" : "#2A5C1F" }}>
                  HRI {herdSpeciesStats.hri}%
                </span>
                <span style={{ fontSize: 11, color: "#64748B" }}>
                  ({herdSpeciesStats.status})
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                {herdSpeciesStats.count} {species}s in herd baseline
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 0, marginTop: 12, borderBottom: "1px solid #E0DAD0", overflowX: "auto" }}>
            {(["health", "udder", "milk", "sensors", "history"] as const).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTab(tKey)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${tab === tKey ? "#2A5C1F" : "transparent"}`,
                  padding: "10px 4px",
                  fontSize: 11.5,
                  fontWeight: tab === tKey ? 700 : 500,
                  color: tab === tKey ? "#2A5C1F" : "#9BA88C",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {tabLabels[tKey]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {tab === "health" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: t("body_temp", lang), value: `${a.temp}°C`, sub: a.temp > 39.2 ? "Elevated Fever" : "Normal", color: a.temp > 39.2 ? "#B83220" : "#2A5C1F", icon: "🌡" },
                { label: t("activity_idx", lang), value: a.activity === "low" ? "32%" : "78%", sub: a.activity === "low" ? "Lethargic" : "Normal active", color: a.activity === "low" ? "#C47A10" : "#2A5C1F", icon: "🏃" },
                { label: "Rumination (Collar)", value: `${rumination} min/d`, sub: rumination < 250 ? "Reduced chewing" : "Optimal rumen flora", color: rumination < 250 ? "#B83220" : "#2A5C1F", icon: "🔄" },
                { label: "Feeding Duration", value: `${feeding} min/d`, sub: feeding < 150 ? "Low DMI intake" : "Healthy appetite", color: feeding < 150 ? "#C47A10" : "#2A5C1F", icon: "🌾" },
              ].map((s, i) => (
                <Card key={i}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, color: "#9BA88C", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#6B7A5C" }}>{s.sub}</div>
                </Card>
              ))}
            </div>

            {/* Environmental Health & Stress Card */}
            <Card>
              <SectionLabel>Barn Climate & Heat Stress (THI)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 4 }}>
                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>AMBIENT TEMP</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>{ambientTemp}°C</div>
                  <div style={{ fontSize: 9.5, color: "#64748B" }}>Shed DHT22</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>HUMIDITY</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>{humidity}%</div>
                  <div style={{ fontSize: 9.5, color: humidity > 75 ? "#B83220" : "#64748B" }}>{humidity > 75 ? "Humid" : "Normal"}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700 }}>THI INDEX</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: thi >= 78 ? "#B83220" : thi >= 72 ? "#C47A10" : "#2A5C1F", marginTop: 2 }}>{thi}</div>
                  <div style={{ fontSize: 9.5, color: thi >= 78 ? "#B83220" : thi >= 72 ? "#C47A10" : "#2A5C1F" }}>{thi >= 78 ? "High Stress" : thi >= 72 ? "Mild Stress" : "Comfort Zone"}</div>
                </div>
              </div>
            </Card>

            {/* Somatic Cell Count Card */}
            <Card>
              <SectionLabel>{lang === "Tamil" ? "சோமாடிக் செல் எண்ணிக்கை (SCC)" : lang === "Hindi" ? "सोमैटिक सेल काउंट (SCC)" : "Somatic Cell Count (SCC)"}</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: animalScc > criticalSccThreshold ? "#B83220" : animalScc > normalSccThreshold ? "#C47A10" : "#2A5C1F" }}>
                    {(animalScc / 1000).toFixed(0)}k <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "sans-serif" }}>cells/mL</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>
                    SCS Score: <strong>{(a.scs || (animalScc > criticalSccThreshold ? 7.2 : 3.2)).toFixed(1)}</strong> · <span style={{ color: animalScc > criticalSccThreshold ? "#B83220" : animalScc > normalSccThreshold ? "#C47A10" : "#2A5C1F", fontWeight: 700 }}>
                      {animalScc > criticalSccThreshold
                        ? `🚨 Acute Mastitis (>${(criticalSccThreshold / 1000).toFixed(0)}k)`
                        : animalScc > normalSccThreshold
                        ? `⚠️ Subclinical (${(normalSccThreshold / 1000).toFixed(0)}k–${(criticalSccThreshold / 1000).toFixed(0)}k)`
                        : `✅ Healthy Baseline (<${(normalSccThreshold / 1000).toFixed(0)}k)`}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                    {species === "Goat" ? "ℹ️ Caprine apocrine baseline: up to 750k cells/mL is normal physiological secretion." : "ℹ️ Bovine healthy threshold: <200k cells/mL."}
                  </div>
                </div>
                <div style={{ fontSize: 28 }}>🔬</div>
              </div>
            </Card>

            <Card>
              <SectionLabel>{t("scc_trend", lang)} (EC Telemetry)</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: (a.conductivity || 5.0) > 6.5 ? "#B83220" : "#2A5C1F" }}>
                    {a.conductivity || 5.2} <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "sans-serif" }}>mS/cm</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#6B7A5C" }}>
                    pH {a.ph || 6.6} · <span style={{ color: (a.conductivity || 5.0) > 6.5 ? "#B83220" : "#2A5C1F", fontWeight: 700 }}>
                      {(a.conductivity || 5.0) > 6.5 ? `↑ ${(a.conductivity || 5.0) > 8.5 ? "Critical" : "Elevated (7-14d Risk)"}` : "Normal Range (4.0 - 6.5)"}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <Sparkline data={currentDataset.ec} color={(a.conductivity || 5.0) > 6.5 ? "#B83220" : "#2A5C1F"} width={110} height={44} />
                </div>
              </div>
            </Card>

            <Card>
              <SectionLabel>{t("temp_trend", lang)}</SectionLabel>
              <Sparkline data={currentDataset.temp} color="#C47A10" width={280} height={44} />
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => onNavigate("visual-ai")}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #1C2714, #2A5C1F)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(42,92,31,0.25)",
                }}
              >
                📸 {lang === "Hindi" ? "अयन फोटो एआई जांच" : lang === "Tamil" ? "மடி புகைப்பட ஏஐ ஆய்வு" : "Scan Udder Photo with AI"}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onNavigate("ai-risk")} style={{ flex: 1, background: "#2A5C1F", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {t("view_ai_risk", lang)}
                </button>
                <button onClick={() => onNavigate("interventions")} style={{ flex: 1, background: "#FFFFFF", color: "#2A5C1F", border: "1.5px solid #2A5C1F", borderRadius: 12, padding: "14px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {t("log_intervention", lang)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Udder Symmetry / Anatomical Quarters/Halves Tab ──────────────── */}
        {tab === "udder" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <SectionLabel>
                {species === "Goat" ? "🐐 Caprine 2-Halves Udder Symmetry" : "🐄 Bovine 4-Quarters Udder Symmetry"}
              </SectionLabel>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                {species === "Goat"
                  ? "Caprine anatomy consists of 2 gland cistern halves (Left & Right). Differential EC > 1.2 mS/cm indicates unilateral mastitis."
                  : "Bovine anatomy consists of 4 distinct quarters. Inter-quarter EC ratio > 1.15x indicates subclinical infection in the elevated quarter."}
              </div>

              {species === "Goat" ? (
                /* Goat: 2 Halves Grid */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  {[
                    { name: "Left Half (LH)", affected: isLeftAffected && a.risk !== "none" && a.risk !== "low", ec: isLeftAffected ? a.conductivity : 5.1, temp: isLeftAffected ? a.temp : 38.6 },
                    { name: "Right Half (RH)", affected: isRightAffected && a.risk !== "none" && a.risk !== "low", ec: isRightAffected ? a.conductivity : 5.2, temp: isRightAffected ? a.temp : 38.6 },
                  ].map((half) => (
                    <div
                      key={half.name}
                      style={{
                        background: half.affected ? "#FEE2E2" : "#F0FDF4",
                        border: `2px solid ${half.affected ? "#EF4444" : "#86EFAC"}`,
                        borderRadius: 14,
                        padding: "16px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{half.affected ? "🚨" : "✅"}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: half.affected ? "#991B1B" : "#166534" }}>{half.name}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: half.affected ? "#DC2626" : "#15803D", marginTop: 4 }}>
                        {half.affected ? "INFECTED / WATCH" : "CLEAR & HEALTHY"}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
                        EC: <strong>{half.ec} mS/cm</strong> · 🌡 <strong>{half.temp}°C</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Cow / Buffalo: 4 Quarters Grid */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[
                    { name: "Front-Left (FL)", affected: isFrontAffected && isLeftAffected, ec: isFrontAffected && isLeftAffected ? a.conductivity : 5.1 },
                    { name: "Front-Right (FR)", affected: (isFrontAffected && isRightAffected) || (a.quarter === "Front-Right"), ec: (isFrontAffected && isRightAffected) || (a.quarter === "Front-Right") ? a.conductivity : 5.0 },
                    { name: "Rear-Left (RL)", affected: (isRearAffected && isLeftAffected) || (a.quarter === "Rear-Left"), ec: (isRearAffected && isLeftAffected) || (a.quarter === "Rear-Left") ? a.conductivity : 5.2 },
                    { name: "Rear-Right (RR)", affected: (isRearAffected && isRightAffected) || (a.quarter === "Rear-Right"), ec: (isRearAffected && isRightAffected) || (a.quarter === "Rear-Right") ? a.conductivity : 5.1 },
                  ].map((q) => (
                    <div
                      key={q.name}
                      style={{
                        background: q.affected && a.risk !== "none" && a.risk !== "low" ? "#FEE2E2" : "#F0FDF4",
                        border: `2px solid ${q.affected && a.risk !== "none" && a.risk !== "low" ? "#EF4444" : "#86EFAC"}`,
                        borderRadius: 12,
                        padding: "12px 10px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 18 }}>{q.affected && a.risk !== "none" && a.risk !== "low" ? "🚨" : "✅"}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: q.affected && a.risk !== "none" && a.risk !== "low" ? "#991B1B" : "#166534" }}>{q.name}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: q.affected && a.risk !== "none" && a.risk !== "low" ? "#DC2626" : "#15803D" }}>
                        {q.affected && a.risk !== "none" && a.risk !== "low" ? "Elevated EC" : "Normal"}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                        EC: <strong>{q.ec} mS/cm</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", border: "1px solid #E2E8F0", fontSize: 11, color: "#475569" }}>
                <strong>Clinical Action Protocol:</strong> Apply teat antiseptic dipping targeted at the affected quarter/half. Discard milk from abnormal quarter/half to avoid tank bulk contamination.
              </div>
            </Card>
          </div>
        )}

        {tab === "milk" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <SectionLabel>{t("milk_yield", lang)} (L/day)</SectionLabel>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "#2A5C1F" }}>{a.milk} L</div>
              <div style={{ fontSize: 11, color: a.risk === "high" ? "#B83220" : "#2A5C1F" }}>
                {a.risk === "high" ? "↓ 28% vs healthy peak baseline" : "✓ Normal daily yield for species"}
              </div>
              <div style={{ marginTop: 8 }}>
                <Sparkline data={currentDataset.milk} color="#2A5C1F" width={280} height={48} />
              </div>
            </Card>
          </div>
        )}

        {tab === "sensors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Conductivity (EC Probe GPIO 35)", value: `${a.conductivity} mS/cm`, status: a.conductivity > 8 ? "Elevated" : "Normal", color: a.conductivity > 8 ? "#B83220" : "#2A5C1F", icon: "⚡" },
              { label: "Milk pH (Electrode GPIO 34)", value: `${a.ph || 6.6}`, status: (a.ph || 6.6) > 7.0 || (a.ph || 6.6) < 6.4 ? "Borderline" : "Normal", color: (a.ph || 6.6) > 7.0 || (a.ph || 6.6) < 6.4 ? "#C47A10" : "#2A5C1F", icon: "🧪" },
              { label: "Milk Temperature (DS18B20 GPIO 4)", value: `${a.temp}°C`, status: a.temp > 39.2 ? "Fever" : "Normal", color: a.temp > 39.2 ? "#B83220" : "#2A5C1F", icon: "🌡" },
              { label: "Somatic Cell Count (SCC)", value: `${((animalScc) / 1000).toFixed(0)}k/mL`, status: animalScc > criticalSccThreshold ? "Critical" : animalScc > normalSccThreshold ? "Watch" : "Normal", color: animalScc > criticalSccThreshold ? "#B83220" : "#2A5C1F", icon: "🔬" },
              { label: "Rumination Duration (IMU Collar)", value: `${rumination} min/day`, status: rumination < 250 ? "Reduced" : "Optimal", color: rumination < 250 ? "#B83220" : "#2A5C1F", icon: "🔄" },
              { label: "Feeding Duration (IMU Collar)", value: `${feeding} min/day`, status: feeding < 150 ? "Reduced" : "Normal", color: feeding < 150 ? "#C47A10" : "#2A5C1F", icon: "🌾" },
              { label: "Ambient Barn Temp (DHT22 GPIO 27)", value: `${ambientTemp}°C`, status: ambientTemp > 32 ? "High Heat" : "Optimal", color: ambientTemp > 32 ? "#C47A10" : "#2A5C1F", icon: "🌤" },
              { label: "Barn Relative Humidity (DHT22)", value: `${humidity}%`, status: humidity > 75 ? "Humid" : "Normal", color: humidity > 75 ? "#C47A10" : "#2A5C1F", icon: "💧" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFFFFF", borderRadius: 12, padding: "12px 14px", border: "1px solid #E0DAD0" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1C2714" }}>{s.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.color + "18", padding: "3px 10px", borderRadius: 8 }}>{s.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Time Range Selector */}
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: 14, border: "1px solid #E0DAD0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C" }}>Time Range:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {(["24h", "7d", "14d", "30d"] as const).map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setHistoryTimeRange(tr)}
                    style={{
                      background: historyTimeRange === tr ? "#2A5C1F" : "#F0EDE6",
                      color: historyTimeRange === tr ? "#FFFFFF" : "#6B7A5C",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {tr === "24h" ? "24 Hours" : tr === "7d" ? "7 Days" : tr === "14d" ? "14 Days" : "30 Days"}
                  </button>
                ))}
              </div>
            </div>

            {/* Historical Charts for Selected Time Range */}
            <Card>
              <SectionLabel>Historical Conductivity EC ({historyTimeRange.toUpperCase()})</SectionLabel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: (a.conductivity || 5.0) > 6.5 ? "#B83220" : "#2A5C1F" }}>
                  {a.conductivity || 5.2} mS/cm
                </div>
                <div style={{ fontSize: 10, color: "#64748B" }}>Range: {currentDataset.labels[0]} → {currentDataset.labels[currentDataset.labels.length - 1]}</div>
              </div>
              <Sparkline data={currentDataset.ec} color={(a.conductivity || 5.0) > 6.5 ? "#B83220" : "#2A5C1F"} width={280} height={48} />
            </Card>

            <Card>
              <SectionLabel>Historical Rumination Trend (min/day)</SectionLabel>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: rumination < 250 ? "#B83220" : "#2A5C1F" }}>
                  {rumination} min/d
                </div>
                <div style={{ fontSize: 10, color: "#64748B" }}>Baseline: 350-500 min/d</div>
              </div>
              <Sparkline data={currentDataset.rumination} color={rumination < 250 ? "#B83220" : "#2A5C1F"} width={280} height={48} />
            </Card>

            {/* Chronological Event Timeline for selected time range */}
            <Card>
              <SectionLabel>Chronological Milking & Biosecurity Log</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
                {currentDataset.timeline.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 10px",
                      background: "#F8FAFC",
                      borderRadius: 10,
                      borderLeft: `3px solid ${item.color}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#1C2714" }}>{item.time}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: item.color, background: item.color + "18", padding: "1px 6px", borderRadius: 4 }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.4 }}>{item.event}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}



