import React, { useState } from "react";
import { BackHeader, ReadAloudFAB, Card, SectionLabel } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { useHerd } from "../context/HerdContext";
import { HERDS, type Animal } from "../types/index";
import { filterAnimalsByHerd, calculateHerdRisk } from "../services/herdService";
import { t } from "../i18n/index";

export function RecommendationsScreen({
  onBack,
  lang,
  onSelectAnimal,
}: {
  onBack: () => void;
  lang: string;
  onSelectAnimal?: (animal: Animal) => void;
}) {
  const { animals } = useAnimals();
  const { selectedHerdId, setSelectedHerdId } = useHerd();
  const [activeTab, setActiveTab] = useState<"all" | "immediate" | "biosecurity" | "species">("all");

  const activeAnimals = filterAnimalsByHerd(animals, selectedHerdId);
  const herdAssessment = calculateHerdRisk(activeAnimals);
  const highRiskAnimals = activeAnimals.filter((a) => a.risk === "high");
  const modRiskAnimals = activeAnimals.filter((a) => a.risk === "moderate");

  const categories = [
    {
      id: "immediate",
      icon: "🚨",
      label: lang === "Tamil" ? "உடனடி தனிமைப்படுத்தல் & கவனிப்பு" : lang === "Hindi" ? "त्वरित अलगाव और देखभाल" : "Immediate Quarantine & Isolation",
      color: "#B83220",
      bg: "#FCE8E5",
      badge: `${highRiskAnimals.length} Critical`,
      items: highRiskAnimals.length > 0
        ? highRiskAnimals.map((a, i) => ({
            p: i + 1,
            title: `Isolate ${a.name} (${a.id}) - ${a.species}`,
            text: `${a.name} in ${HERDS.find(h => h.id === a.herdId)?.name || "Herd"} shows high mastitis risk with EC ${a.conductivity} mS/cm in ${a.quarter || "affected quarter"}. Disinfect stall and milk LAST using dedicated cluster.`,
            tag: "Immediate Priority",
            animal: a,
          }))
        : [
            {
              p: 1,
              title: "No High-Risk Animals Detected",
              text: "All animals in this cohort currently show low-to-moderate mastitis risk indices. Maintain standard milking sequence.",
              tag: "Status Normal",
              animal: undefined,
            },
          ],
    },
    {
      id: "hygiene",
      icon: "🧼",
      label: lang === "Tamil" ? "மடி சுகாதாரம் & கிருமிநாசினி" : lang === "Hindi" ? "थनों की स्वच्छता" : "Udder Hygiene & Teat Dipping",
      color: "#1A5C9E",
      bg: "#E3EEF9",
      badge: "Routine Best Practice",
      items: [
        {
          p: 1,
          title: "Pre-Milking Teat Disinfection",
          text: lang === "Tamil"
            ? "கறவைக்கு முன் 0.5% அயோடின் திரவத்தில் 30 வினாடிகள் மடியை நனைத்து சுத்தம் செய்யவும்"
            : "Pre-dip all teats with 0.5% chlorhexidine or iodine solution for 30 seconds before cluster attachment.",
          tag: "Pre-Milking",
          animal: undefined,
        },
        {
          p: 2,
          title: "Post-Milking Barrier Teat Dip",
          text: lang === "Tamil"
            ? "கறவை முடிந்தவுடன் மீண்டும் அயோடின் திரவத்தால் மடியை சுத்தம் செய்யவும்"
            : "Apply a polymer-barrier post-dip immediately after milking to seal teat canals for 30 minutes while standing.",
          tag: "Post-Milking",
          animal: undefined,
        },
        {
          p: 3,
          title: "Stall Bedding Dryness (Lime Dusting)",
          text: "Dust cubicle beds with agricultural lime (100g/stall) daily to inhibit environmental coliform pathogens (E. coli, Strep. uberis).",
          tag: "Housing Hygiene",
          animal: undefined,
        },
      ],
    },
    {
      id: "biosecurity",
      icon: "🛡️",
      label: lang === "Tamil" ? "பண்ணை உயிரியல் பாதுகாப்பு நெறிமுறை" : lang === "Hindi" ? "फार्म जैव सुरक्षा" : "Herd-Level Biosecurity",
      color: "#2A5C1F",
      bg: "#E6F0E2",
      badge: `HRI: ${herdAssessment.hri}%`,
      items: [
        {
          p: 1,
          title: "Milking Order Sequencing Protocol",
          text: `Milk in strict sequence: (1) Fresh first-lactation heifers → (2) Healthy low-risk herd (${herdAssessment.counts.none + herdAssessment.counts.low} animals) → (3) Moderate watch-list (${modRiskAnimals.length} animals) → (4) High-risk quarantined animals LAST.`,
          tag: "Protocol",
          animal: undefined,
        },
        {
          p: 2,
          title: "Early Warning Watchlist Monitoring",
          text: `${modRiskAnimals.length} animals (${modRiskAnimals.map(a => a.name).join(", ") || "None"}) have rising EC (7.0–10.0 mS/cm). Re-scan with California Mastitis Test (CMT) within 48 hours.`,
          tag: "Subclinical Watch",
          animal: undefined,
        },
      ],
    },
    {
      id: "species",
      icon: "🐾",
      label: lang === "Tamil" ? "இனம் சார்ந்த வழிகாட்டுதல்" : lang === "Hindi" ? "प्रजाति विशिष्ट देखभाल" : "Species-Specific Advisory",
      color: "#78350F",
      bg: "#FEF3C7",
      badge: "Cow / Goat / Buffalo",
      items: [
        {
          p: 1,
          title: "Caprine (Goat) Apocrine Milking Care",
          text: "Goat milk naturally sheds non-cellular particles (apocrine secretion). High SCC (>750k) indicates subclinical mastitis in goats vs >200k in cattle. Ensure half-udder teat cups fit snugly.",
          tag: "Goats 🐐",
          animal: undefined,
        },
        {
          p: 2,
          title: "Buffalo Wallowing Hygiene",
          text: "Murrah and Mehsana buffaloes prone to environmental Streptococcus from wallowing ponds. Wash udder with clean water and dry thoroughly with individual paper towels prior to milking.",
          tag: "Buffalo 🐃",
          animal: undefined,
        },
      ],
    },
    {
      id: "vet",
      icon: "🩺",
      label: lang === "Tamil" ? "கால்நடை மருத்துவர் தொடர்பு" : lang === "Hindi" ? "पशु चिकित्सक परामर्श" : "Veterinary Escalation",
      color: "#B83220",
      bg: "#FCE8E5",
      badge: "Dr. Sharma V.O.",
      items: [
        {
          p: 1,
          title: "Veterinary Officer Alert",
          text: `Immediate clinical evaluation scheduled for ${highRiskAnimals.map(a => `${a.name} (${a.id})`).join(", ") || "No urgent cases"}. Culture milk sample before starting any intramammary therapy.`,
          tag: "Clinical Action",
          animal: undefined,
        },
      ],
    },
  ];

  const filteredCategories = categories.filter((cat) => {
    if (activeTab === "all") return true;
    if (activeTab === "immediate") return cat.id === "immediate" || cat.id === "vet";
    if (activeTab === "biosecurity") return cat.id === "biosecurity" || cat.id === "hygiene";
    if (activeTab === "species") return cat.id === "species";
    return true;
  });

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

      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px 80px" }}>
        {/* Herd Filter Pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
          <button
            onClick={() => setSelectedHerdId("all")}
            style={{
              background: selectedHerdId === "all" ? "#2A5C1F" : "#FFFFFF",
              color: selectedHerdId === "all" ? "#FFFFFF" : "#4A5A38",
              border: `1px solid ${selectedHerdId === "all" ? "#2A5C1F" : "#D8D2C6"}`,
              borderRadius: 20,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🌐 All Herds
          </button>
          {HERDS.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHerdId(h.id)}
              style={{
                background: selectedHerdId === h.id ? "#2A5C1F" : "#FFFFFF",
                color: selectedHerdId === h.id ? "#FFFFFF" : "#4A5A38",
                border: `1px solid ${selectedHerdId === h.id ? "#2A5C1F" : "#D8D2C6"}`,
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              🏡 {h.name.split(" ")[0]} {h.name.split(" ")[1]}
            </button>
          ))}
        </div>

        {/* Tab Filters */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#EAE5DC", padding: 3, borderRadius: 10 }}>
          {[
            { id: "all", label: "All Recs" },
            { id: "immediate", label: "🚨 Critical" },
            { id: "biosecurity", label: "🛡️ Biosecurity" },
            { id: "species", label: "🐾 Species Care" },
          ].map((tb) => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              style={{
                flex: 1,
                border: "none",
                background: activeTab === tb.id ? "#2A5C1F" : "transparent",
                color: activeTab === tb.id ? "#FFFFFF" : "#5A4E3D",
                borderRadius: 8,
                padding: "6px 4px",
                fontSize: 10.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {/* Actionable Categories */}
        {filteredCategories.map((cat) => (
          <div key={cat.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: cat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  {cat.icon}
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: "#1C2714" }}>{cat.label}</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: cat.bg,
                  color: cat.color,
                  padding: "2px 8px",
                  borderRadius: 10,
                  border: `1px solid ${cat.color}30`,
                }}
              >
                {cat.badge}
              </span>
            </div>

            {cat.items.map((item, i) => (
              <div
                key={i}
                onClick={() => item.animal && onSelectAnimal && onSelectAnimal(item.animal)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E0DAD0",
                  borderLeft: `3.5px solid ${cat.color}`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  cursor: item.animal ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#1C2714" }}>{item.title}</span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      background: "#F2EDE4",
                      color: "#6B5E4B",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "#4A4032", lineHeight: 1.45 }}>{item.text}</div>
                {item.animal && (
                  <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 700, color: "#2A5C1F", display: "flex", alignItems: "center", gap: 4 }}>
                    <span>🔍 View {item.animal.name}'s Profile →</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
