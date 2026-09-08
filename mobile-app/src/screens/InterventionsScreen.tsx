import React from "react";
import { StatusBar, BackHeader, Card, SectionLabel, ReadAloudFAB } from "../components/ui";
import { t } from "../i18n/index";

export function InterventionsScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="interventions" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader title={t("interventions_title", lang)} onBack={onBack} />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <Card>
          <SectionLabel>{lang === "Tamil" ? "நடவடிக்கை நிலை" : "Active Treatments"}</SectionLabel>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1C2714", marginBottom: 4 }}>Ganga (KA-001)</div>
          <div style={{ fontSize: 12, color: "#6B7A5C" }}>
            {lang === "Tamil"
              ? "சி.எம்.டி பரிசோதனை செய்யப்பட்டது · ஆய்வக முடிவு எதிர்பார்க்கப்படுகிறது"
              : "CMT positive · Milk sample sent to lab · Isolation in progress"}
          </div>
        </Card>
      </div>
    </div>
  );
}
