import React from "react";
import { StatusBar, BackHeader, ReadAloudFAB } from "../components/ui";
import { t } from "../i18n/index";

export function RecommendationsScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  const categories = [
    {
      id: "hygiene",
      icon: "🧼",
      label: lang === "Tamil" ? "மடி சுகாதாரம்" : lang === "Hindi" ? "थनों की स्वच्छता" : "Udder Hygiene",
      color: "#1A5C9E",
      bg: "#E3EEF9",
      items: [
        {
          p: 1,
          text:
            lang === "Tamil"
              ? "கறவைக்கு முன் 0.5% அயோடின் திரவத்தில் 30 வினாடிகள் மடியை நனைத்து சுத்தம் செய்யவும்"
              : "Pre-dip all teats with 0.5% iodine solution for 30 seconds before milking",
          tag: "Immediate",
        },
        {
          p: 1,
          text:
            lang === "Tamil"
              ? "கறவை முடிந்தவுடன் மீண்டும் அயோடின் திரவத்தால் மடியை சுத்தம் செய்யவும்"
              : "Post-dip with barrier teat dip after every milking session",
          tag: "Immediate",
        },
      ],
    },
    {
      id: "milking",
      icon: "🥛",
      label: lang === "Tamil" ? "கறவை நெறிமுறை" : lang === "Hindi" ? "दुग्ध दोहन प्रोटोकॉल" : "Milking Protocol",
      color: "#2A5C1F",
      bg: "#E6F0E2",
      items: [
        {
          p: 1,
          text:
            lang === "Tamil"
              ? "கறவைக்கு முன் 3-4 சொட்டு பாலை தனியாக பீய்ச்சி கட்டிகள் உள்ளதா என பார்க்கவும்"
              : "Strip 3–4 squirts from each teat and check for clots before milking",
          tag: "Immediate",
        },
      ],
    },
    {
      id: "vet",
      icon: "🩺",
      label: lang === "Tamil" ? "கால்நடை மருத்துவர் தொடர்பு" : lang === "Hindi" ? "पशु चिकित्सक परामर्श" : "Veterinary Follow-up",
      color: "#B83220",
      bg: "#FCE8E5",
      items: [
        {
          p: 1,
          text:
            lang === "Tamil"
              ? "Cow 1 மற்றும் Cow 8 மாடுகளுக்காக டாக்டர் சர்மாவை உடனே தொடர்பு கொள்ளவும்"
              : "Contact Vet Dr. Sharma for Cow 1 and Cow 8 — clinical exam required",
          tag: "Immediate",
        },
      ],
    },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="recommendations" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader title={t("recs_title", lang)} onBack={onBack} />
        <div style={{ padding: "8px 16px 12px", background: "#E6F0E2", borderBottom: "1px solid #C4DDA0" }}>
          <div style={{ fontSize: 12, color: "#2A5C1F", fontWeight: 600 }}>
            {t("no_med_note", lang)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: cat.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {cat.icon}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#1C2714" }}>{cat.label}</span>
            </div>
            {cat.items.map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0DAD0",
                  borderLeft: `3px solid ${cat.color}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginBottom: 6,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: cat.bg,
                    color: cat.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {item.p}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#1C2714", lineHeight: 1.5 }}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
