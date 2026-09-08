import React, { useState } from "react";
import { StatusBar, SectionLabel } from "../components/ui";
import { t } from "../i18n/index";

export function LoginScreen({ onNext, lang }: { onNext: () => void; lang: string }) {
  const [role, setRole] = useState<"farmer" | "vet" | "officer" | null>("farmer");
  const [phone, setPhone] = useState("");
  const roles = [
    { id: "farmer" as const, label: t("role_farmer", lang), desc: t("role_farmer_sub", lang), icon: "👨‍🌾" },
    { id: "vet" as const, label: t("role_vet", lang), desc: t("role_vet_sub", lang), icon: "🩺" },
    { id: "officer" as const, label: t("role_officer", lang), desc: t("role_officer_sub", lang), icon: "📋" },
  ];

  return (
    <div style={{ flex: 1, background: "#F7F4EE", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#2A5C1F", padding: "24px 24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 26 }}>🐄</span>
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            MooTracker
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.25,
            whiteSpace: "pre-line",
          }}
        >
          {t("welcome_dairy", lang)}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
          {t("healthy_cattle", lang)}
        </div>
      </div>
      <div style={{ flex: 1, padding: "20px 20px", overflow: "auto" }}>
        <SectionLabel>{t("select_role", lang)}</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: role === r.id ? "#E6F0E2" : "#FFFFFF",
                border: `1.5px solid ${role === r.id ? "#2A5C1F" : "#E0DAD0"}`,
                borderRadius: 14,
                padding: "14px 16px",
                cursor: "pointer",
                textAlign: "left",
                minHeight: 64,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 28 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1C2714" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "#6B7A5C" }}>{r.desc}</div>
              </div>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: `2px solid ${role === r.id ? "#2A5C1F" : "#D0CAC0"}`,
                  background: role === r.id ? "#2A5C1F" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {role === r.id && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFFFFF" }} />
                )}
              </div>
            </button>
          ))}
        </div>
        <SectionLabel>{t("mobile_num", lang)}</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E0DAD0",
              borderRadius: 12,
              padding: "14px 12px",
              fontSize: 14,
              fontWeight: 600,
              color: "#1C2714",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🇮🇳</span> +91
          </div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="98XXXXXXXX"
            style={{
              flex: 1,
              background: "#FFFFFF",
              border: "1.5px solid #E0DAD0",
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#1C2714",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={onNext}
          disabled={!role}
          style={{
            width: "100%",
            background: role ? "#2A5C1F" : "#D0CAC0",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 14,
            padding: "17px 0",
            fontSize: 16,
            fontWeight: 700,
            cursor: role ? "pointer" : "not-allowed",
            minHeight: 52,
            transition: "background 0.2s",
          }}
        >
          {t("continue_as", lang)} {roles.find((r) => r.id === role)?.label} →
        </button>
      </div>
    </div>
  );
}
