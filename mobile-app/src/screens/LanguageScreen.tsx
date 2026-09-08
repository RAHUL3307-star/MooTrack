import React, { useState } from "react";
import { StatusBar } from "../components/ui";

export function LanguageScreen({
  onNext,
  onSelect,
  currentLang,
}: {
  onNext: () => void;
  onSelect: (l: string) => void;
  currentLang: string;
}) {
  const [selected, setSelected] = useState(currentLang || "Tamil");
  const langs = [
    { code: "Tamil", native: "தமிழ்", sub: "Tamil", flag: "🇮🇳" },
    { code: "Hindi", native: "हिन्दी", sub: "Hindi", flag: "🇮🇳" },
    { code: "English", native: "English", sub: "English", flag: "🇮🇳" },
    { code: "Kannada", native: "ಕನ್ನಡ", sub: "Kannada", flag: "🇮🇳" },
    { code: "Telugu", native: "తెలుగు", sub: "Telugu", flag: "🇮🇳" },
    { code: "Marathi", native: "मराठी", sub: "Marathi", flag: "🇮🇳" },
    { code: "Gujarati", native: "ગુજરાતી", sub: "Gujarati", flag: "🇮🇳" },
    { code: "Punjabi", native: "ਪੰਜਾਬੀ", sub: "Punjabi", flag: "🇮🇳" },
  ];

  return (
    <div style={{ flex: 1, background: "#F7F4EE", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 24px 16px" }}>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 26,
            fontWeight: 700,
            color: "#1C2714",
            lineHeight: 1.2,
          }}
        >
          {selected === "Tamil"
            ? "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்"
            : selected === "Hindi"
            ? "अपनी भाषा चुनें"
            : "Choose your language"}
        </div>
        <div style={{ fontSize: 13, color: "#6B7A5C", marginTop: 6 }}>
          உங்கள் தாய்மொழியில் எளிதாக பயன்படுத்தலாம் · आसानी से अपनी भाषा में उपयोग करें
        </div>
      </div>
      <div style={{ flex: 1, padding: "0 16px", overflow: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setSelected(l.code);
                onSelect(l.code);
              }}
              style={{
                background: selected === l.code ? "#E6F0E2" : "#FFFFFF",
                border: `2px solid ${selected === l.code ? "#2A5C1F" : "#E0DAD0"}`,
                borderRadius: 14,
                padding: "14px 12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                boxShadow: selected === l.code ? "0 4px 12px rgba(42,92,31,0.15)" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 20 }}>{l.flag}</span>
                {selected === l.code && (
                  <span style={{ color: "#2A5C1F", fontWeight: 800, fontSize: 14 }}>✓</span>
                )}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1C2714" }}>{l.native}</div>
              <div style={{ fontSize: 11, color: "#9BA88C", fontWeight: 500 }}>{l.sub}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 24px 32px" }}>
        <button
          onClick={() => {
            onSelect(selected);
            onNext();
          }}
          style={{
            width: "100%",
            background: "#2A5C1F",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            padding: "17px 0",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 52,
            letterSpacing: "0.02em",
            boxShadow: "0 6px 18px rgba(42,92,31,0.3)",
          }}
        >
          {selected === "Tamil"
            ? "தமிழில் தொடரவும் →"
            : selected === "Hindi"
            ? "हिंदी में जारी रखें →"
            : `Continue with ${selected} →`}
        </button>
      </div>
    </div>
  );
}
