import React from "react";
import { StatusBar, Card, SectionLabel } from "../components/ui";
import { t, LANG_FLAGS } from "../i18n/index";

export function ProfileScreen({
  onBack,
  lang,
  onLangChange,
}: {
  onBack: () => void;
  lang: string;
  onLangChange: (l: string) => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE" }}>
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0" }}>
        <StatusBar />
        <div style={{ padding: "12px 16px 16px" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#1C2714" }}>
            {t("profile_title", lang)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Card style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: "#2A5C1F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "#FFFFFF",
              flexShrink: 0,
            }}
          >
            👨‍🌾
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#1C2714" }}>
              Ramesh Patel
            </div>
            <div style={{ fontSize: 12, color: "#6B7A5C" }}>{t("farm_sub", lang)}</div>
          </div>
        </Card>

        {/* Language selector in profile */}
        <Card style={{ marginBottom: 14 }}>
          <SectionLabel>{lang === "Tamil" ? "பயன்பாட்டு மொழி" : "App Language"}</SectionLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Tamil", "Hindi", "English", "Kannada", "Telugu"].map((l) => (
              <button
                key={l}
                onClick={() => onLangChange(l)}
                style={{
                  background: lang === l ? "#2A5C1F" : "#F0EDE6",
                  color: lang === l ? "#FFFFFF" : "#6B7A5C",
                  border: "none",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  minHeight: 36,
                }}
              >
                {LANG_FLAGS[l] || l}
              </button>
            ))}
          </div>
        </Card>

        <button
          onClick={onBack}
          style={{
            width: "100%",
            background: "#FCE8E5",
            color: "#B83220",
            border: "1px solid #F0B4AA",
            borderRadius: 12,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 48,
          }}
        >
          {t("sign_out", lang)}
        </button>
      </div>
    </div>
  );
}
