import React, { useState } from "react";
import {
  StatusBar,
  Card,
  RiskBadge,
  ReadAloudFAB,
} from "../components/ui";
import { RISK_COLOR } from "../types/index";
import type { Screen, RiskLevel } from "../types/index";
import { t, sendWhatsAppAlert } from "../i18n/index";

export function AlertsScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const [filterType, setFilterType] = useState<"all" | "herd" | "animal">("all");

  const alerts = [
    // ── LEVEL 2: HERD-LEVEL EPIDEMIOLOGY ALERTS ──
    {
      id: "herd-1",
      type: "herd" as const,
      level: "Level 2 — Herd Assessment",
      target: "Herd A (Main Barn – Anand, Gujarat)",
      risk: "high" as RiskLevel,
      hriDelta: "+29 pts",
      reason:
        lang === "Tamil"
          ? "🚨 மந்தை A அபாய நிலை மாற்றம்: HRI 38% (MODERATE) லிருந்து 67% (HIGH RISK) ஆக அதிகரித்துள்ளது. 3 மாடுகள் தீவிர தொற்றில் உள்ளன."
          : lang === "Hindi"
          ? "🚨 हर्ड A संक्रमण चेतावनी: HRI 38% (मध्यम) से बढ़कर 67% (उच्च जोखिम) हो गया है। 3 पशु तीव्र थनैला से प्रभावित हैं।"
          : "🚨 Herd A Outbreak Transition: HRI escalated from 38% (MODERATE) to 67% (HIGH RISK). 3 cows showing acute clinical mastitis.",
      urgency: lang === "Tamil" ? "உடனடி" : lang === "Hindi" ? "तुरंत" : "Immediate",
      time: "5 min ago",
      action:
        lang === "Tamil"
          ? "கால்நடை மருத்துவர் ஆலோசனை பெற்று பாதிக்கப்பட்ட மாடுகளை தனிமைப்படுத்தவும்."
          : lang === "Hindi"
          ? "पशु चिकित्सक को बुलाएं और तुरंत झुंड पृथक्करण (Quarantine) लागू करें।"
          : "Enforce biosecurity quarantine, sanitize milking clusters between cows, and request emergency vet visit.",
    },
    {
      id: "herd-2",
      type: "herd" as const,
      level: "Level 2 — Herd Assessment",
      target: "Herd B (East Field – Karnal, Haryana)",
      risk: "moderate" as RiskLevel,
      hriDelta: "+14 pts",
      reason:
        lang === "Tamil"
          ? "⚠️ மந்தை B ஆடுகள் கண்காணிப்பு: ஆடுகளின் சராசரி பால் EC 1.8 mS/cm அதிகரித்துள்ளது (7-14 நாள் ஆபத்து)."
          : lang === "Hindi"
          ? "⚠️ हर्ड B उप-नैदानिक चेतावनी: बकरियों की दूध चालकता (EC) में वृद्धि दर्ज की गई है।"
          : "⚠️ Herd B Caprine Subclinical Watch: Caprine baseline conductivity drifted up +1.8 mS/cm. Goat 1 in incubation.",
      urgency: lang === "Tamil" ? "இன்று" : lang === "Hindi" ? "आज" : "Today",
      time: "35 min ago",
      action:
        lang === "Tamil"
          ? "அனைத்து ஆடுகளுக்கும் பால் கறந்த பின் 0.5% அயோடின் டிப் தடவவும்."
          : lang === "Hindi"
          ? "दूध दुहने के बाद 0.5% आयोडीन टीट डिप का प्रयोग करें।"
          : "Apply 0.5% post-milking iodine teat dip on all goats and monitor daily 2-half symmetry.",
    },
    // ── LEVEL 1: INDIVIDUAL ANIMAL ALERTS ──
    {
      id: "animal-1",
      type: "animal" as const,
      level: "Level 1 — Animal Assessment",
      target: "Cow 1 (KA-001) · Herd A",
      risk: "high" as RiskLevel,
      hriDelta: null,
      reason:
        lang === "Tamil"
          ? "பால் EC 12.4 mS/cm + pH 6.1 அசாதாரண உயர்வு — வலது முன் மடி தீவிர தொற்று"
          : lang === "Hindi"
          ? "दूध चालकता 12.4 mS/cm + pH 6.1 — फ्रंट-राइट अयन में थनैला संक्रमण पुष्टि"
          : "Milk EC 12.4 mS/cm + pH 6.1 + Temp 39.4°C — Acute mastitis confirmed in Front-Right quarter",
      urgency: lang === "Tamil" ? "உடனடி" : lang === "Hindi" ? "तुरंत" : "Immediate",
      time: "8 min ago",
      action:
        lang === "Tamil"
          ? "இன்றே கால்நடை மருத்துவ பரிசோதனை தேவை, வலது மடி பாலை தனியாக கொட்டவும்"
          : lang === "Hindi"
          ? "आज ही पशु चिकित्सक की जांच जरूरी, प्रभावित अयन का दूध अलग करें"
          : "Vet exam required today. Discard Front-Right quarter milk to prevent tank contamination.",
    },
    {
      id: "animal-2",
      type: "animal" as const,
      level: "Level 1 — Animal Assessment",
      target: "Goat 1 (GT-001) · Herd B",
      risk: "high" as RiskLevel,
      hriDelta: null,
      reason:
        lang === "Tamil"
          ? "ஆடு 1: பால் EC 13.8 mS/cm + காய்ச்சல் 40.1°C — வலது மடி பகுதியில் கடுமையான தொற்று"
          : lang === "Hindi"
          ? "बकरी 1: दूध चालकता 13.8 mS/cm + बुखार 40.1°C — राइट हाफ में तीव्र संक्रमण"
          : "Goat 1: Milk EC 13.8 mS/cm + Fever 40.1°C — Acute unilateral mastitis in Right Half",
      urgency: lang === "Tamil" ? "உடனடி" : lang === "Hindi" ? "तुरंत" : "Immediate",
      time: "15 min ago",
      action:
        lang === "Tamil"
          ? "மருத்துவரை அழைத்து அழற்சி எதிர்ப்பு சிகிச்சை அளிக்கவும்"
          : lang === "Hindi"
          ? "डॉक्टर को बुलाएं और एंटी-बायोटिक स्प्रे लगाएं"
          : "Administer caprine anti-inflammatory protocol and isolate from kid nursing.",
    },
    {
      id: "animal-3",
      type: "animal" as const,
      level: "Level 1 — Animal Assessment",
      target: "Cow 2 (KA-007) · Herd A",
      risk: "moderate" as RiskLevel,
      hriDelta: null,
      reason:
        lang === "Tamil"
          ? "பால் கடத்துதிறன் (EC) 3 நாட்களில் 9.8 mS/cm ஆக உயர்ந்துள்ளது (7-14 நாள் ஆபத்து)"
          : lang === "Hindi"
          ? "दूध चालकता (EC) 3 दिनों में 9.8 mS/cm तक बढ़ी (7-14 दिन का जोखिम)"
          : "Milk EC trending up to 9.8 mS/cm over 3 days (7–14d subclinical mastitis forecast)",
      urgency: lang === "Tamil" ? "இன்று" : lang === "Hindi" ? "आज" : "Today",
      time: "1 hr ago",
      action:
        lang === "Tamil"
          ? "கண்காணிப்பு முறையை அதிகரிக்கவும், மூலிகை லேப் தடவவும்"
          : lang === "Hindi"
          ? "निगरानी बढ़ाएं और आयुर्वेदिक लेप का प्रयोग करें"
          : "Increase IoT monitoring frequency; apply herbal masticare aloe/turmeric paste.",
    },
  ];

  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === "herd") return a.type === "herd";
    if (filterType === "animal") return a.type === "animal";
    return true;
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="alerts" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0" }}>
        <div style={{ padding: "12px 16px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#1C2714" }}>
              {t("alerts_title", lang)}{" "}
              <span
                style={{
                  background: "#FCE8E5",
                  color: "#B83220",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {t("critical_badge", lang)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7A5C", fontWeight: 600 }}>
              {alerts.length} Total Alerts ({alerts.filter(a => a.type === "herd").length} Herd · {alerts.filter(a => a.type === "animal").length} Animal)
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {[
              { id: "all", label: `🌐 All Alerts (${alerts.length})` },
              { id: "herd", label: `🚨 Herd Outbreaks – Level 2 (${alerts.filter(a => a.type === "herd").length})` },
              { id: "animal", label: `🐄 Animal Alerts – Level 1 (${alerts.filter(a => a.type === "animal").length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                style={{
                  background: filterType === tab.id ? "#2A5C1F" : "#F0EDE6",
                  color: filterType === tab.id ? "#FFFFFF" : "#6B7A5C",
                  border: "none",
                  borderRadius: 14,
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              style={{
                borderLeft: `5px solid ${RISK_COLOR[alert.risk].dot}`,
                background: alert.type === "herd" ? "linear-gradient(135deg, #FFFDF8, #FFFFFF)" : "#FFFFFF",
                border: alert.type === "herd" ? "1.5px solid #FCD34D" : "1px solid #E0DAD0",
                opacity: acknowledged.includes(alert.id) ? 0.65 : 1,
                boxShadow: alert.type === "herd" ? "0 4px 14px rgba(245,158,11,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      background: alert.type === "herd" ? "#78350F" : "#1C3814",
                      color: "#FFFFFF",
                      padding: "2px 7px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {alert.level}
                  </span>
                  <RiskBadge level={alert.risk} small lang={lang} />
                  {alert.hriDelta && (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#B83220", background: "#FEE2E2", padding: "1px 6px", borderRadius: 6 }}>
                      ▲ {alert.hriDelta}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#9BA88C", fontWeight: 500 }}>{alert.time}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#B83220" }}>⏱ {alert.urgency}</span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 800, color: "#1C2714", marginBottom: 4 }}>
                {alert.target}
              </div>

              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.45, marginBottom: 8 }}>
                {alert.reason}
              </div>

              <div
                style={{
                  background: "#F7F4EE",
                  borderRadius: 10,
                  padding: "9px 12px",
                  marginBottom: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 15 }}>💡</span>
                <span style={{ fontSize: 12, color: "#1C2714", fontWeight: 600 }}>{alert.action}</span>
              </div>

              <button
                onClick={() => sendWhatsAppAlert(alert.target, alert.risk, alert.reason, alert.action, alert.urgency, lang)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 44,
                  marginBottom: 8,
                  boxShadow: "0 2px 8px rgba(37,211,102,0.3)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {t("whatsapp_btn", lang)}
              </button>

              {!acknowledged.includes(alert.id) && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setAcknowledged((p) => [...p, alert.id])}
                    style={{
                      flex: 1,
                      background: "#E6F0E2",
                      color: "#2A5C1F",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 0",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: 40,
                    }}
                  >
                    ✓ {t("acknowledge", lang)}
                  </button>
                  <button
                    onClick={() => onNavigate(alert.type === "herd" ? "analytics" : "recommendations")}
                    style={{
                      flex: 1,
                      background: "#2A5C1F",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 0",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: 40,
                    }}
                  >
                    {alert.type === "herd" ? "📊 View Herd Analytics →" : `↑ ${t("escalate", lang)}`}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
