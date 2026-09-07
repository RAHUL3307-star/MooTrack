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
import { ANIMALS, RISK_COLOR } from "../types/index";
import type { Screen } from "../types/index";
import { t } from "../i18n/index";

export function AnimalProfileScreen({
  onBack,
  onNavigate,
  lang,
}: {
  onBack: () => void;
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const a = ANIMALS[0];
  const [tab, setTab] = useState<"health" | "milk" | "sensors" | "history">("health");
  const sccHistory = [320, 380, 410, 445, 468, 485];
  const milkHistory = [14.2, 13.6, 12.8, 11.9, 11.2, 10.2];
  const tempHistory = [38.5, 38.7, 38.9, 39.1, 39.3, 39.4];

  const tabLabels = {
    health: lang === "Tamil" ? "ஆரோக்கியம்" : lang === "Hindi" ? "स्वास्थ्य" : "Health",
    milk: lang === "Tamil" ? "பால்" : lang === "Hindi" ? "दूध" : "Milk",
    sensors: lang === "Tamil" ? "சென்சார்கள்" : lang === "Hindi" ? "सेंसर" : "Sensors",
    history: lang === "Tamil" ? "வரலாறு" : lang === "Hindi" ? "इतिहास" : "History",
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="animal-profile" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <StatusBar />
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
              🐄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              </div>
              <div style={{ fontSize: 12, color: "#6B7A5C", marginTop: 4 }}>
                {a.breed} · {a.age} · Lactation {a.lactation} · {a.quarter}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 16, borderBottom: "1px solid #E0DAD0" }}>
            {(["health", "milk", "sensors", "history"] as const).map((tKey) => (
              <button
                key={tKey}
                onClick={() => setTab(tKey)}
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${tab === tKey ? "#2A5C1F" : "transparent"}`,
                  padding: "10px 0",
                  fontSize: 12,
                  fontWeight: tab === tKey ? 700 : 500,
                  color: tab === tKey ? "#2A5C1F" : "#9BA88C",
                  cursor: "pointer",
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
                { label: t("body_temp", lang), value: `${a.temp}°C`, sub: lang === "Tamil" ? "அதிகம்" : "Elevated", color: "#B83220", icon: "🌡" },
                { label: t("activity_idx", lang), value: "42%", sub: lang === "Tamil" ? "குறைவு" : "Below normal", color: "#C47A10", icon: "🏃" },
                { label: t("rumination", lang), value: "5.2 h", sub: lang === "Tamil" ? "இயல்பு" : "Normal range", color: "#2A5C1F", icon: "🔄" },
                { label: t("feeding_score", lang), value: "3/5", sub: lang === "Tamil" ? "குறைந்தது" : "Reduced intake", color: "#C47A10", icon: "🌾" },
              ].map((s, i) => (
                <Card key={i}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 10, color: "#9BA88C", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#6B7A5C" }}>{s.sub}</div>
                </Card>
              ))}
            </div>
            <Card>
              <SectionLabel>{t("scc_trend", lang)}</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: "#B83220" }}>{a.scc}k</div>
                  <div style={{ fontSize: 10, color: "#6B7A5C" }}>cells/mL · <span style={{ color: "#B83220", fontWeight: 700 }}>↑ 51% {t("this_week", lang)}</span></div>
                </div>
                <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                  <Sparkline data={sccHistory} color="#B83220" width={110} height={44} />
                </div>
              </div>
            </Card>
            <Card>
              <SectionLabel>{t("temp_trend", lang)}</SectionLabel>
              <Sparkline data={tempHistory} color="#C47A10" width={280} height={44} />
            </Card>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onNavigate("ai-risk")} style={{ flex: 1, background: "#2A5C1F", color: "#FFFFFF", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {t("view_ai_risk", lang)}
              </button>
              <button onClick={() => onNavigate("interventions")} style={{ flex: 1, background: "#FFFFFF", color: "#2A5C1F", border: "1.5px solid #2A5C1F", borderRadius: 12, padding: "14px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {t("log_intervention", lang)}
              </button>
            </div>
          </div>
        )}
        {tab === "milk" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Card>
              <SectionLabel>{t("milk_yield", lang)} (L)</SectionLabel>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "#2A5C1F" }}>{a.milk} L</div>
              <div style={{ fontSize: 11, color: "#B83220" }}>↓ 28% vs peak</div>
              <div style={{ marginTop: 8 }}>
                <Sparkline data={milkHistory} color="#2A5C1F" width={280} height={48} />
              </div>
            </Card>
          </div>
        )}
        {tab === "sensors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: lang === "Tamil" ? "பால் கடத்துதிறன்" : "Conductivity", value: "14.2 mS/cm", status: "Elevated", color: "#B83220", icon: "⚡" },
              { label: lang === "Tamil" ? "பால் pH அளவு" : "Milk pH", value: "6.5", status: "Borderline", color: "#C47A10", icon: "🧪" },
              { label: lang === "Tamil" ? "மடி வெப்பநிலை" : "Milk Temperature", value: "37.8°C", status: "Normal", color: "#2A5C1F", icon: "🌡" },
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
      </div>
    </div>
  );
}
