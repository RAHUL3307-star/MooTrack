import React from "react";
import { StatusBar, BackHeader, Card, ReadAloudFAB } from "../components/ui";
import { t } from "../i18n/index";

export function GISScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="gis" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader title={t("gis_title", lang)} onBack={onBack} />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>🗺️</span>
            <strong style={{ fontSize: 14, color: "#1C2714" }}>
              {lang === "Tamil" ? "கொட்டகை ஏ நோய் பரவல் எச்சரிக்கை" : "Pen A Disease Cluster Hotspot"}
            </strong>
          </div>
          <p style={{ fontSize: 12, color: "#6B7A5C", lineHeight: 1.5, margin: 0 }}>
            {lang === "Tamil"
              ? "கங்கா மற்றும் பெட்வா மாடுகள் அருகருகே உள்ளன. நீர் தொட்டி மற்றும் தரையை உடனே கிருமிநாசினி கொண்டு சுத்தம் செய்யவும்."
              : "High risk animals Ganga (KA-001) and Betwa (KA-052) are co-located in Pen A. Immediate disinfection of shared water trough is advised."}
          </p>
        </Card>
      </div>
    </div>
  );
}
