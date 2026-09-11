import React, { useState } from "react";
import {
  StatusBar,
  BackHeader,
  Card,
  SectionLabel,
  ReadAloudFAB,
} from "../components/ui";
import { ANIMALS, RISK_COLOR } from "../types/index";
import type { Screen, RiskLevel } from "../types/index";
import { t } from "../i18n/index";
import { useAnimals } from "../context/AnimalsContext";
import { calculateHerdRisk } from "../services/herdService";

export function AIRiskScreen({
  onBack,
  onNavigate,
  lang,
}: {
  onBack: () => void;
  onNavigate?: (s: Screen) => void;
  lang: string;
}) {
  const { animals, selectedAnimal, setSelectedAnimal } = useAnimals();
  const [activeAnimalId, setActiveAnimalId] = useState<string>(
    selectedAnimal?.id || (animals[0] ? animals[0].id : "KA-001")
  );

  const animal = animals.find((a) => a.id === activeAnimalId) || animals[0] || ANIMALS[0];
  const species = animal.species || (animal.id.startsWith("GT") ? "Goat" : animal.id.startsWith("BF") ? "Buffalo" : "Cow");
  const speciesIcon = species === "Goat" ? "🐐" : species === "Buffalo" ? "🐃" : "🐄";

  const herd = calculateHerdRisk(animals);

  // Individual risk calculation
  const riskScore = animal.risk === "high" ? 88 : animal.risk === "moderate" ? 64 : animal.risk === "low" ? 22 : 8;

  const forecastDays = [
    { day: t("today", lang), prob: animal.risk === "high" ? 0.88 : animal.risk === "moderate" ? 0.64 : 0.18 },
    { day: "D+1", prob: animal.risk === "high" ? 0.91 : animal.risk === "moderate" ? 0.71 : 0.20 },
    { day: "D+2", prob: animal.risk === "high" ? 0.93 : animal.risk === "moderate" ? 0.78 : 0.22 },
    { day: "D+3", prob: animal.risk === "high" ? 0.89 : animal.risk === "moderate" ? 0.82 : 0.19 },
    { day: "D+7", prob: animal.risk === "high" ? 0.74 : animal.risk === "moderate" ? 0.75 : 0.15 },
    { day: "D+14", prob: animal.risk === "high" ? 0.52 : animal.risk === "moderate" ? 0.60 : 0.12 },
  ];

  const handleAnimalChange = (id: string) => {
    setActiveAnimalId(id);
    const found = animals.find((a) => a.id === id);
    if (found) setSelectedAnimal(found);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="ai-risk" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0" }}>
        <BackHeader title={t("ai_risk_title", lang)} onBack={onBack} />
        {/* Animal Selector Dropdown Bar */}
        <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C", whiteSpace: "nowrap" }}>
            Select Animal:
          </span>
          <select
            value={animal.id}
            onChange={(e) => handleAnimalChange(e.target.value)}
            style={{
              flex: 1,
              background: "#F7F4EE",
              border: "1.5px solid #D0CCC4",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 13,
              fontWeight: 700,
              color: "#1C2714",
              outline: "none",
            }}
          >
            {animals.map((a) => {
              const sp = a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow");
              const icon = sp === "Goat" ? "🐐" : sp === "Buffalo" ? "🐃" : "🐄";
              return (
                <option key={a.id} value={a.id}>
                  {icon} {a.name} ({a.id}) — {a.risk.toUpperCase()}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* ── LEVEL 1: Individual Animal AI Risk Assessment ────────────────── */}
        <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, background: "#1C2714", color: "#FFFFFF", padding: "2px 6px", borderRadius: 6 }}>
            LEVEL 1
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
            Individual Animal Predictive Risk
          </span>
        </div>

        <div
          style={{
            background: RISK_COLOR[animal.risk].bg,
            border: `1.5px solid ${RISK_COLOR[animal.risk].border}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 16,
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: `3px solid ${RISK_COLOR[animal.risk].dot}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: RISK_COLOR[animal.risk].text, lineHeight: 1 }}>
              {riskScore}%
            </div>
            <div style={{ fontSize: 8.5, color: RISK_COLOR[animal.risk].text, fontWeight: 700 }}>RISK SCORE</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 18 }}>{speciesIcon}</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: RISK_COLOR[animal.risk].text, fontFamily: "'Fraunces', serif" }}>
                {animal.risk.toUpperCase()} RISK
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#1C2714", fontWeight: 700 }}>
              {animal.name} ({animal.id}) · {species} ({animal.breed})
            </div>
            <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>
              Affected: <strong>{animal.quarter}</strong> · Lactation {animal.lactation}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 9.5, background: "#FFFFFF", border: "1px solid #E0DAD0", padding: "2px 6px", borderRadius: 6, color: "#6B7A5C", fontWeight: 600 }}>
                94.8% ML Confidence
              </span>
              <span style={{ fontSize: 9.5, background: "#FFFFFF", border: "1px solid #E0DAD0", padding: "2px 6px", borderRadius: 6, color: "#6B7A5C", fontWeight: 600 }}>
                {species === "Goat" ? "2-Halves Telemetry" : "4-Quarters Telemetry"}
              </span>
            </div>
          </div>
        </div>

        {/* ── LEVEL 2: Herd-Level Epidemiological Context ─────────────────── */}
        <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, background: "#0F766E", color: "#FFFFFF", padding: "2px 6px", borderRadius: 6 }}>
            LEVEL 2
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
            Herd-Level Epidemiological Baseline
          </span>
        </div>

        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2714" }}>
                Herd Risk Index (HRI): <strong style={{ color: herd.status === "HIGH" ? "#B83220" : herd.status === "MODERATE" ? "#C47A10" : "#2A5C1F" }}>{herd.hri}% ({herd.status})</strong>
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>
                {herd.quarantineCount} animals in quarantine · {herd.watchListCount} on subclinical watchlist
              </div>
            </div>
            <div style={{ fontSize: 24 }}>🛡️</div>
          </div>
          <div style={{ fontSize: 11, color: "#475569", background: "#F8FAFC", padding: "8px 10px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <strong>Herd Impact:</strong> This {species.toLowerCase()}'s risk level of <strong>{animal.risk.toUpperCase()}</strong> contributes to the herd's biosecurity score. {herd.status === "HIGH" ? "Immediate herd isolation protocols in effect." : "Routine herd biosecurity adequate."}
          </div>
        </Card>

        {/* 14-Day Early Forecast Trajectory */}
        <Card style={{ marginBottom: 12 }}>
          <SectionLabel>14-Day Early Forecast Trajectory ({animal.name})</SectionLabel>
          <div style={{ display: "flex", gap: 6 }}>
            {forecastDays.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 9, color: "#9BA88C", fontWeight: 600 }}>{d.day}</div>
                <div
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 8,
                    background: d.prob > 0.7 ? RISK_COLOR.high.bg : d.prob > 0.35 ? RISK_COLOR.moderate.bg : RISK_COLOR.low.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${d.prob > 0.7 ? RISK_COLOR.high.border : d.prob > 0.35 ? RISK_COLOR.moderate.border : RISK_COLOR.low.border}`,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: d.prob > 0.7 ? "#B83220" : d.prob > 0.35 ? "#C47A10" : "#2D7A26" }}>
                      {Math.round(d.prob * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Why at risk (Explainability) */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>{t("why_risk", lang)} (Species-Calibrated Signals)</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                label: "Milk Electrical Conductivity (EC)",
                weight: animal.conductivity > 8 ? 0.84 : 0.25,
                detail: `${animal.conductivity} mS/cm (${animal.quarter} asymmetric shift)`,
              },
              {
                label: "Somatic Cell Count (SCC)",
                weight: (animal.scc || 185000) > (species === "Goat" ? 1200000 : 500000) ? 0.88 : (animal.scc || 185000) > (species === "Goat" ? 750000 : 200000) ? 0.62 : 0.15,
                detail: `${(((animal.scc || (species === "Goat" ? 450000 : 185000))) / 1000).toFixed(0)}k cells/mL (SCS ${(animal.scs || 3.2).toFixed(1)})`,
              },
              {
                label: "Milk pH Shift",
                weight: (animal.ph || 6.6) > 7.0 || (animal.ph || 6.6) < 6.4 ? 0.76 : 0.20,
                detail: `pH ${animal.ph || 6.6} ${(animal.ph || 6.6) > 7.0 ? "(Alkaline shift ↑)" : "(Normal physiological range)"}`,
              },
              {
                label: "Milk Yield Loss vs Expected",
                weight: animal.risk === "high" ? 0.72 : animal.risk === "moderate" ? 0.45 : 0.10,
                detail: `${animal.milk}L daily yield (${species} expected: ${species === "Goat" ? "2.5–3.5L" : "14–18L"})`,
              },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1C2714", marginBottom: 2 }}>{f.label}</div>
                  <div style={{ height: 5, background: "#F0EDE6", borderRadius: 3, overflow: "hidden", marginBottom: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        background: f.weight > 0.7 ? "#B83220" : f.weight > 0.4 ? "#C47A10" : "#2A5C1F",
                        borderRadius: 3,
                        width: `${f.weight * 100}%`,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, color: "#9BA88C" }}>{f.detail}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1C2714", width: 36, textAlign: "right" }}>
                  {Math.round(f.weight * 100)}%
                </div>
              </div>
            ))}
          </div>
        </Card>

        {onNavigate && (
          <button
            onClick={() => onNavigate("ml-lab")}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #1C3E26, #0D2013)",
              color: "#FFFFFF",
              border: "1px solid #366B38",
              borderRadius: 12,
              padding: "13px 0",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(28,62,38,0.25)",
            }}
          >
            <span>🔬</span>
            <span>
              {lang === "Tamil"
                ? "முழு கணிப்பு & சிகிச்சை ஆய்வகம் திறக்க →"
                : lang === "Hindi"
                ? "संपूर्ण प्रेडिक्शन व उपचार लैब खोलें →"
                : "Open Full ML Predictive & Treatment Lab →"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

