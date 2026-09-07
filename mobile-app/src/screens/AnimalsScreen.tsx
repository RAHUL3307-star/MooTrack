import React, { useState } from "react";
import { StatusBar, RiskBadge, TrendArrow, ReadAloudFAB } from "../components/ui";
import { RISK_COLOR } from "../types/index";
import type { Screen, RiskLevel } from "../types/index";
import { t } from "../i18n/index";
import { useAnimals } from "../context/AnimalsContext";

export function AnimalsScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { animals } = useAnimals();
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");
  const [search, setSearch] = useState("");
  const filters: { id: "all" | RiskLevel; label: string }[] = [
    { id: "all", label: lang === "Tamil" ? "அனைத்தும்" : lang === "Hindi" ? "सभी" : "All" },
    { id: "high", label: t("risk_high", lang) },
    { id: "moderate", label: t("risk_moderate", lang) },
    { id: "low", label: t("risk_low", lang) },
    { id: "none", label: t("risk_none", lang) },
  ];
  const visible = animals.filter(
    (a) =>
      (filter === "all" || a.risk === filter) &&
      (search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="animals" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0", padding: "8px 0 0" }}>
        <StatusBar />
        <div style={{ padding: "8px 16px 12px" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#1C2714", marginBottom: 12 }}>
            {t("tab_animals", lang)}{" "}
            <span style={{ fontSize: 14, fontWeight: 500, color: "#9BA88C", fontFamily: "'Outfit', sans-serif" }}>
              {animals.length} {t("animals_total", lang)}
            </span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder", lang)}
            style={{
              width: "100%",
              background: "#F7F4EE",
              border: "1.5px solid #E0DAD0",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              color: "#1C2714",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, padding: "0 16px 12px", overflowX: "auto" }}>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                background: filter === f.id ? "#2A5C1F" : "#F0EDE6",
                color: filter === f.id ? "#FFFFFF" : "#6B7A5C",
                border: "none",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: 36,
                transition: "all 0.15s",
              }}
            >
              {f.label}
              {f.id !== "all" && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                  ({ANIMALS.filter((a) => a.risk === f.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9BA88C" }}>{t("no_animals", lang)}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate("animal-profile")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "#FFFFFF",
                  border: "1px solid #E0DAD0",
                  borderLeft: `4px solid ${RISK_COLOR[a.risk].dot}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1C2714" }}>{a.name}</span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono'",
                        fontSize: 10,
                        color: "#9BA88C",
                        background: "#F0EDE6",
                        padding: "1px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {a.id}
                    </span>
                    <TrendArrow dir={a.trend} />
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                    {a.breed} · Lac {a.lactation} · {a.age}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11 }}>
                    <span style={{ color: "#6B7A5C" }}>
                      SCC <strong style={{ color: "#1C2714" }}>{a.scc}k</strong>
                    </span>
                    <span style={{ color: "#6B7A5C" }}>
                      🌡 <strong style={{ color: a.temp > 39 ? "#B83220" : "#1C2714" }}>{a.temp}°C</strong>
                    </span>
                    <span style={{ color: "#6B7A5C" }}>
                      🥛 <strong style={{ color: "#1C2714" }}>{a.milk}L</strong>
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <RiskBadge level={a.risk} small lang={lang} />
                  <div style={{ fontSize: 10, color: "#9BA88C" }}>{a.lastSync}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
