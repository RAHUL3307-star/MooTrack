import React, { useState } from "react";
import { BackHeader, Card, SectionLabel, ReadAloudFAB, RiskBadge } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { t, sendWhatsAppAlert } from "../i18n/index";
import type { Animal } from "../types/index";

export function GISScreen({
  onBack,
  lang,
  onSelectAnimal,
}: {
  onBack: () => void;
  lang: string;
  onSelectAnimal?: (animal: Animal) => void;
}) {
  const { animals } = useAnimals();
  const [selectedPen, setSelectedPen] = useState<string>("Pen A");
  const [checklist, setChecklist] = useState({
    waterTrough: false,
    bedding: true,
    ozoneFogging: false,
    milkingClaw: true,
  });

  // Pen groupings
  const pens = [
    {
      id: "Pen A",
      name: "Pen A (Lactating High-Yield)",
      risk: "high",
      color: "#B83220",
      bg: "#FEE2E2",
      cowIds: ["KA-001", "KA-052"],
      ammonia: "14 ppm (High)",
      humidity: "84%",
      temp: "31.2°C",
      notes: "⚠️ Contamination Hotspot: Cow 1 & Cow 8 co-located near shared water trough.",
    },
    {
      id: "Pen B",
      name: "Pen B (Transition & Intermediate)",
      risk: "moderate",
      color: "#C47A10",
      bg: "#FEF3C7",
      cowIds: ["KA-007", "KA-014"],
      ammonia: "8 ppm (Normal)",
      humidity: "72%",
      temp: "29.4°C",
      notes: "Early Warning: Cow 2 & Cow 3 under 7–14d pre-mastitis observation.",
    },
    {
      id: "Pen C",
      name: "Pen C (Heifers & Healthy)",
      risk: "none",
      color: "#2A5C1F",
      bg: "#E8F5E9",
      cowIds: ["KA-022", "KA-031", "KA-038", "KA-045"],
      ammonia: "4 ppm (Clean)",
      humidity: "68%",
      temp: "28.5°C",
      notes: "Biosecure Zone: All cattle healthy with low somatic cell count.",
    },
    {
      id: "Quarantine",
      name: "Isolation & Recovery Ward",
      risk: "moderate",
      color: "#6B21A8",
      bg: "#F3E8FF",
      cowIds: [],
      ammonia: "2 ppm (Sterilized)",
      humidity: "65%",
      temp: "27.8°C",
      notes: "Dedicated medical ward for post-treatment monitoring.",
    },
  ];

  const currentPenData = pens.find((p) => p.id === selectedPen) || pens[0];

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#F7F4EE",
        position: "relative",
      }}
    >
      <ReadAloudFAB screen="gis" lang={lang} />
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E0D8" }}>
        <BackHeader title={t("gis_title", lang)} onBack={onBack} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 80px" }}>
        {/* Hotspot Alert Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #B83220 0%, #7F1D1D 100%)",
            borderRadius: 16,
            padding: "14px 16px",
            color: "#FFFFFF",
            marginBottom: 16,
            boxShadow: "0 4px 16px rgba(184,50,32,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 20 }}>🚨</span>
            <strong style={{ fontSize: 14 }}>
              {lang === "Tamil" ? "கொட்டகை ஏ நோய் பரவல் எச்சரிக்கை" : "Pen A Disease Hotspot Detected"}
            </strong>
          </div>
          <p style={{ fontSize: 12, color: "#FEE2E2", lineHeight: 1.45, margin: 0 }}>
            {lang === "Tamil"
              ? "Cow 1 மற்றும் Cow 8 மாடுகள் அருகருகே உள்ளன. நீர் தொட்டி மற்றும் தரையை உடனே கிருமிநாசினி கொண்டு சுத்தம் செய்யவும்."
              : "High risk cows Cow 1 (KA-001) and Cow 8 (KA-052) are co-located in Pen A. Immediate disinfection of shared water trough and deep bedding change is required to stop disease transmission."}
          </p>
        </div>

        {/* Interactive Barn & Pen Visual Map */}
        <Card style={{ marginBottom: 16, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <SectionLabel>Interactive Barn Floor Plan (GIS)</SectionLabel>
            <span style={{ fontSize: 10.5, color: "#8A7356", fontWeight: 700 }}>Tap pens to inspect</span>
          </div>

          <div style={{ width: "100%", height: 210, background: "#EAE5DA", borderRadius: 12, overflow: "hidden", position: "relative", border: "1px solid #D5CFC4" }}>
            <svg viewBox="0 0 340 200" style={{ width: "100%", height: "100%" }}>
              {/* Barn Perimeter */}
              <rect x="5" y="5" width="330" height="190" rx="8" fill="#F4EFE6" stroke="#B8AEA0" strokeWidth="2" />

              {/* Feed Alley */}
              <rect x="15" y="85" width="310" height="30" fill="#E2DACD" stroke="#C8BEAF" strokeWidth="1" strokeDasharray="4,2" />
              <text x="170" y="104" textAnchor="middle" fontSize="9" fill="#7A6F60" fontWeight="700">FEED ALLEY & AUTOMATED SCRAPER</text>

              {/* Pen A (Top Left) */}
              <g
                onClick={() => setSelectedPen("Pen A")}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="15"
                  y="15"
                  width="145"
                  height="65"
                  rx="6"
                  fill={selectedPen === "Pen A" ? "#FEE2E2" : "#FFF5F5"}
                  stroke={selectedPen === "Pen A" ? "#B83220" : "#FCA5A5"}
                  strokeWidth={selectedPen === "Pen A" ? "2.5" : "1.5"}
                />
                <text x="22" y="32" fontSize="10.5" fontWeight="800" fill="#B83220">PEN A · HIGH RISK</text>
                {/* Cow markers */}
                <circle cx="45" cy="54" r="10" fill="#B83220" />
                <text x="45" y="57.5" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#FFFFFF">C1</text>
                <circle cx="85" cy="54" r="10" fill="#B83220" />
                <text x="85" y="57.5" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#FFFFFF">C8</text>
                {/* Water Trough */}
                <rect x="125" y="25" width="25" height="14" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
                <text x="137.5" y="35" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0369A1">H2O</text>
              </g>

              {/* Pen B (Top Right) */}
              <g
                onClick={() => setSelectedPen("Pen B")}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="180"
                  y="15"
                  width="145"
                  height="65"
                  rx="6"
                  fill={selectedPen === "Pen B" ? "#FEF3C7" : "#FFFBEB"}
                  stroke={selectedPen === "Pen B" ? "#C47A10" : "#FCD34D"}
                  strokeWidth={selectedPen === "Pen B" ? "2.5" : "1.5"}
                />
                <text x="188" y="32" fontSize="10.5" fontWeight="800" fill="#C47A10">PEN B · WARNING (7–14d)</text>
                <circle cx="215" cy="54" r="10" fill="#C47A10" />
                <text x="215" y="57.5" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#FFFFFF">C2</text>
                <circle cx="255" cy="54" r="10" fill="#C47A10" />
                <text x="255" y="57.5" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#FFFFFF">C3</text>
              </g>

              {/* Pen C (Bottom Left) */}
              <g
                onClick={() => setSelectedPen("Pen C")}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="15"
                  y="120"
                  width="190"
                  height="65"
                  rx="6"
                  fill={selectedPen === "Pen C" ? "#E8F5E9" : "#F0FDF4"}
                  stroke={selectedPen === "Pen C" ? "#2A5C1F" : "#86EFAC"}
                  strokeWidth={selectedPen === "Pen C" ? "2.5" : "1.5"}
                />
                <text x="22" y="137" fontSize="10.5" fontWeight="800" fill="#2A5C1F">PEN C · HEALTHY HERD</text>
                <circle cx="40" cy="158" r="9" fill="#2A5C1F" />
                <text x="40" y="161" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">C4</text>
                <circle cx="70" cy="158" r="9" fill="#2A5C1F" />
                <text x="70" y="161" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">C5</text>
                <circle cx="100" cy="158" r="9" fill="#2A5C1F" />
                <text x="100" y="161" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">C6</text>
                <circle cx="130" cy="158" r="9" fill="#2A5C1F" />
                <text x="130" y="161" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#FFFFFF">C7</text>
              </g>

              {/* Isolation Ward (Bottom Right) */}
              <g
                onClick={() => setSelectedPen("Quarantine")}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x="215"
                  y="120"
                  width="110"
                  height="65"
                  rx="6"
                  fill={selectedPen === "Quarantine" ? "#F3E8FF" : "#FAF5FF"}
                  stroke={selectedPen === "Quarantine" ? "#7E22CE" : "#D8B4FE"}
                  strokeWidth={selectedPen === "Quarantine" ? "2.5" : "1.5"}
                />
                <text x="222" y="137" fontSize="9.5" fontWeight="800" fill="#7E22CE">ISOLATION WARD</text>
                <text x="270" y="160" textAnchor="middle" fontSize="8.5" fill="#9333EA">Sterile / Ready</text>
              </g>
            </svg>
          </div>
        </Card>

        {/* Selected Pen Environmental & Animal Details */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <strong style={{ fontSize: 15, color: "#1C2714" }}>{currentPenData.name}</strong>
              <div style={{ fontSize: 11.5, color: "#6B7A5C", marginTop: 2 }}>{currentPenData.notes}</div>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 6,
                background: currentPenData.bg,
                color: currentPenData.color,
                textTransform: "uppercase",
              }}
            >
              {currentPenData.risk}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
            <div style={{ background: "#F7F6F2", padding: "8px 10px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#8A7356", fontWeight: 700 }}>AMMONIA</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>{currentPenData.ammonia}</div>
            </div>
            <div style={{ background: "#F7F6F2", padding: "8px 10px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#8A7356", fontWeight: 700 }}>HUMIDITY</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>{currentPenData.humidity}</div>
            </div>
            <div style={{ background: "#F7F6F2", padding: "8px 10px", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#8A7356", fontWeight: 700 }}>TEMP</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1C2714", marginTop: 2 }}>{currentPenData.temp}</div>
            </div>
          </div>

          {/* Cattle inside this pen */}
          {currentPenData.cowIds.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid #ECE7DE", paddingTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#594F40", marginBottom: 6 }}>
                OCCUPANTS ({currentPenData.cowIds.length} COWS)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {currentPenData.cowIds.map((id) => {
                  const cow = animals.find((a) => a.id === id);
                  if (!cow) return null;
                  return (
                    <div
                      key={cow.id}
                      onClick={() => onSelectAnimal && onSelectAnimal(cow)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 10px",
                        background: "#FFFFFF",
                        borderRadius: 8,
                        border: "1px solid #E5E0D8",
                        cursor: onSelectAnimal ? "pointer" : "default",
                      }}
                    >
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1C2714" }}>
                        {cow.name} ({cow.id})
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "#7B6F5D" }}>{cow.scc}k SCC</span>
                        <RiskBadge risk={cow.risk} lang={lang} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Biosecurity & Sanitation Checklist */}
        <Card>
          <SectionLabel>Barn Biosecurity & Disinfection Protocol</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {[
              { key: "waterTrough", label: "Disinfect Pen A Shared Water Trough (Bleach/Iodine)" },
              { key: "bedding", label: "Replace Wet Bedding with Dry Sawdust / Lime" },
              { key: "ozoneFogging", label: "Activate Ozone Misting in Feed Alley" },
              { key: "milkingClaw", label: "Sterilize Milking Claws Between Batches" },
            ].map((item) => {
              const checked = checklist[item.key as keyof typeof checklist];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleCheck(item.key as keyof typeof checklist)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: checked ? "#F0FDF4" : "#FFFBEB",
                    borderRadius: 8,
                    border: `1px solid ${checked ? "#BBF7D0" : "#FDE68A"}`,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    style={{ width: 16, height: 16, accentColor: "#2A5C1F" }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: checked ? "#166534" : "#92400E", flex: 1 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: checked ? "#166534" : "#B45309" }}>
                    {checked ? "✓ Done" : "Action Req."}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              sendWhatsAppAlert(
                "Pen A Cluster",
                "High Risk",
                "Biosecurity Alert: Disinfection protocols triggered for Pen A water trough & bedding replacement.",
                "Verify completion of sanitation checklist to prevent cross-pen transmission.",
                "Immediate",
                lang
              );
            }}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "10px",
              background: "#25D366",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span>💬 Dispatch Biosecurity Alert to Team</span>
          </button>
        </Card>
      </div>
    </div>
  );
}
