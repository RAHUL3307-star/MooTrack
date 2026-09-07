import React from "react";
import { StatusBar, BackHeader, Card, SectionLabel, Sparkline, ReadAloudFAB } from "../components/ui";
import { t } from "../i18n/index";

export function AnalyticsScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  const sccTrend = [182, 188, 195, 210, 222, 235, 248];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="analytics" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <StatusBar />
        <BackHeader title={t("analytics_title", lang)} onBack={onBack} />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: t("at_risk", lang), value: "4", color: "#B83220", bg: "#FCE8E5" },
            { label: t("avg_scc", lang), value: "248k", color: "#C47A10", bg: "#FEF3E2" },
            { label: t("milk_yield", lang), value: "424L", color: "#2A5C1F", bg: "#E6F0E2" },
          ].map((k) => (
            <div key={k.label} style={{ background: k.bg, borderRadius: 14, padding: "12px 10px" }}>
              <div style={{ fontSize: 10, color: k.color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {k.label}
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: k.color, lineHeight: 1.1, marginTop: 2 }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
        <Card style={{ marginBottom: 12 }}>
          <SectionLabel>{t("scc_trend", lang)}</SectionLabel>
          <Sparkline data={sccTrend} color="#C47A10" width={330} height={56} />
        </Card>
      </div>
    </div>
  );
}
