import React from "react";
import {
  StatusBar,
  BackHeader,
  Card,
  SectionLabel,
  ReadAloudFAB,
} from "../components/ui";
import { RISK_COLOR } from "../types/index";
import type { Screen } from "../types/index";
import { t } from "../i18n/index";

export function AIRiskScreen({
  onBack,
  onNavigate,
  lang,
}: {
  onBack: () => void;
  onNavigate?: (s: Screen) => void;
  lang: string;
}) {
  const forecastDays = [
    { day: t("today", lang), prob: 0.88, label: t("risk_high", lang) },
    { day: "D+1", prob: 0.91, label: t("risk_high", lang) },
    { day: "D+2", prob: 0.93, label: t("risk_high", lang) },
    { day: "D+3", prob: 0.89, label: t("risk_high", lang) },
    { day: "D+7", prob: 0.74, label: t("risk_moderate", lang) },
    { day: "D+14", prob: 0.52, label: t("risk_moderate", lang) },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="ai-risk" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader title={t("ai_risk_title", lang)} onBack={onBack} />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Risk verdict */}
        <div
          style={{
            background: RISK_COLOR.high.bg,
            border: `1.5px solid ${RISK_COLOR.high.border}`,
            borderRadius: 18,
            padding: 20,
            marginBottom: 16,
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: `3px solid ${RISK_COLOR.high.dot}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
            }}
          >
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: "#B83220", lineHeight: 1 }}>
              88%
            </div>
            <div style={{ fontSize: 9, color: "#B83220", fontWeight: 700 }}>{t("risk_score_label", lang)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>!</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#B83220", fontFamily: "'Fraunces', serif" }}>
                {t("risk_high", lang)}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#6B7A5C", lineHeight: 1.4 }}>
              Cow 1 (KA-001) {t("high_risk_alert", lang)}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, background: "#FFFFFF", border: "1px solid #E0DAD0", padding: "2px 8px", borderRadius: 6, color: "#6B7A5C", fontWeight: 600 }}>
                {t("confidence", lang)}
              </span>
              <span style={{ fontSize: 10, background: "#FFFFFF", border: "1px solid #E0DAD0", padding: "2px 8px", borderRadius: 6, color: "#6B7A5C", fontWeight: 600 }}>
                {t("signals_active", lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Forecast */}
        <Card style={{ marginBottom: 12 }}>
          <SectionLabel>{t("forecast_label", lang)}</SectionLabel>
          <div style={{ display: "flex", gap: 6 }}>
            {forecastDays.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 9, color: "#9BA88C", fontWeight: 600 }}>{d.day}</div>
                <div
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 8,
                    background: d.prob > 0.7 ? RISK_COLOR.high.bg : RISK_COLOR.moderate.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${d.prob > 0.7 ? RISK_COLOR.high.border : RISK_COLOR.moderate.border}`,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: d.prob > 0.7 ? "#B83220" : "#C47A10" }}>
                      {Math.round(d.prob * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Why at risk */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>{t("why_risk", lang)}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: lang === "Tamil" ? "எஸ்.சி.சி அதிகரிப்பு" : "SCC Rising Trend", weight: 0.82, detail: "485k cells/mL, ↑31%" },
              { label: lang === "Tamil" ? "பால் கடத்துதிறன் அதிகம்" : "Conductivity Elevated", weight: 0.76, detail: "14.2 mS/cm Front-Right" },
              { label: lang === "Tamil" ? "பால் உற்பத்தி குறைவு" : "Milk Yield Decline", weight: 0.71, detail: "10.2L vs 14.8L baseline (↓31%)" },
              { label: lang === "Tamil" ? "உடல் வெப்பநிலை அதிகம்" : "Body Temperature", weight: 0.68, detail: "39.4°C > 39.0°C" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1C2714", marginBottom: 2 }}>{f.label}</div>
                  <div style={{ height: 5, background: "#F0EDE6", borderRadius: 3, overflow: "hidden", marginBottom: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        background: f.weight > 0.7 ? "#B83220" : "#C47A10",
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
