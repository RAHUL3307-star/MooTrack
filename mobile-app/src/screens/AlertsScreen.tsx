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
  const alerts = [
    {
      id: 1,
      animal: "Ganga (KA-001)",
      risk: "high" as RiskLevel,
      reason:
        lang === "Tamil"
          ? "SCC 485k + பால் கடத்துதிறன் அதிகரிப்பு — மடிநோய் சாத்தியம்"
          : lang === "Hindi"
          ? "SCC 485k + दूध चालकता में वृद्धि — थनैला की संभावना"
          : "SCC 485k + conductivity elevated — Mastitis likely",
      urgency: lang === "Tamil" ? "உடனடி" : lang === "Hindi" ? "तुरंत" : "Immediate",
      time: "8 min ago",
      action:
        lang === "Tamil"
          ? "இன்றே கால்நடை மருத்துவ பரிசோதனை தேவை"
          : lang === "Hindi"
          ? "आज ही पशु चिकित्सक की जांच जरूरी"
          : "Vet exam required today",
    },
    {
      id: 2,
      animal: "Betwa (KA-052)",
      risk: "high" as RiskLevel,
      reason:
        lang === "Tamil"
          ? "SCC 620k — தீவிர மடிநோய் அறிகுறி"
          : lang === "Hindi"
          ? "SCC 620k — थनैला के गंभीर लक्षण"
          : "SCC 620k — Clinical mastitis suspected",
      urgency: lang === "Tamil" ? "உடனடி" : lang === "Hindi" ? "तुरंत" : "Immediate",
      time: "22 min ago",
      action:
        lang === "Tamil"
          ? "மந்தையை விட்டு தனிமைப்படுத்தி மருத்துவரை அழைக்கவும்"
          : lang === "Hindi"
          ? "झुंड से अलग करें और डॉक्टर को बुलाएं"
          : "Isolate and call vet",
    },
    {
      id: 3,
      animal: "Kaveri (KA-007)",
      risk: "moderate" as RiskLevel,
      reason:
        lang === "Tamil"
          ? "SCC 3 நாட்களில் 25% உயர்ந்துள்ளது"
          : lang === "Hindi"
          ? "SCC 3 दिनों में 25% बढ़ा"
          : "SCC trending up 25% over 3 days",
      urgency: lang === "Tamil" ? "இன்று" : lang === "Hindi" ? "आज" : "Today",
      time: "1 hr ago",
      action:
        lang === "Tamil"
          ? "கண்காணிப்பு முறையை அதிகரிக்கவும்"
          : lang === "Hindi"
          ? "निगरानी बढ़ाएं"
          : "Increase monitoring frequency",
    },
  ];

  const [acknowledged, setAcknowledged] = useState<number[]>([]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="alerts" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0" }}>
        <StatusBar />
        <div style={{ padding: "8px 16px 12px" }}>
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
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              style={{
                borderLeft: `4px solid ${RISK_COLOR[alert.risk].dot}`,
                opacity: acknowledged.includes(alert.id) ? 0.65 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <RiskBadge level={alert.risk} small lang={lang} />
                  <span style={{ fontSize: 11, color: "#9BA88C", fontWeight: 500 }}>{alert.time}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#B83220" }}>⏱ {alert.urgency}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2714", marginBottom: 4 }}>{alert.animal}</div>
              <div style={{ fontSize: 12, color: "#6B7A5C", lineHeight: 1.4, marginBottom: 8 }}>{alert.reason}</div>
              <div
                style={{
                  background: "#F7F4EE",
                  borderRadius: 10,
                  padding: "8px 12px",
                  marginBottom: 10,
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 14 }}>💡</span>
                <span style={{ fontSize: 12, color: "#1C2714", fontWeight: 500 }}>{alert.action}</span>
              </div>
              <button
                onClick={() => sendWhatsAppAlert(alert.animal, alert.risk, alert.reason, alert.action, alert.urgency, lang)}
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
                    onClick={() => onNavigate("recommendations")}
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
                    ↑ {t("escalate", lang)}
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
