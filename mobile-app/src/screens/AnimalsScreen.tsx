import React, { useState } from "react";
import { StatusBar, RiskBadge, TrendArrow, ReadAloudFAB } from "../components/ui";
import { RISK_COLOR } from "../types/index";
import type { Screen, RiskLevel } from "../types/index";
import { t } from "../i18n/index";
import { useAnimals } from "../context/AnimalsContext";
import { useHerd } from "../context/HerdContext";
import { useESP32 } from "../context/ESP32Context";

// ─── RFID Registration Modal ──────────────────────────────────────────────────
// ─── RFID Registration Modal ──────────────────────────────────────────────────
function RFIDRegisterModal({
  onClose,
  onRegister,
  lang,
}: {
  onClose: () => void;
  onRegister: (rfid: string, name: string, ageYears: number, ageMonths: number, breed: string, species: "Cow" | "Goat" | "Buffalo") => void;
  lang: string;
}) {
  const { isLive, lastTelemetry } = useESP32();
  const { animals } = useAnimals();
  const [species, setSpecies] = useState<"Cow" | "Goat" | "Buffalo">("Cow");
  const defaultName = `${species} ${animals.length + 1}`;
  const [name, setName] = useState(defaultName);
  const [rfidTag, setRfidTag] = useState(
    isLive && lastTelemetry?.rfidTag ? lastTelemetry.rfidTag : isLive && lastTelemetry?.cowId ? lastTelemetry.cowId : ""
  );
  const [ageYears, setAgeYears] = useState("3");
  const [ageMonths, setAgeMonths] = useState("0");

  const SPECIES_BREEDS: Record<"Cow" | "Goat" | "Buffalo", string[]> = {
    Cow: ["HF Cross", "Sahiwal", "Jersey X", "Gir", "Tharparkar", "Red Sindhi", "Mixed"],
    Goat: ["Jamnapari", "Sirohi", "Beetal", "Barbari", "Osmanabadi", "Black Bengal", "Mixed"],
    Buffalo: ["Murrah", "Nili-Ravi", "Jaffarabadi", "Surti", "Bhadawari", "Mehsana"],
  };

  const [breed, setBreed] = useState(SPECIES_BREEDS.Cow[0]);

  const handleSpeciesChange = (newSp: "Cow" | "Goat" | "Buffalo") => {
    setSpecies(newSp);
    setBreed(SPECIES_BREEDS[newSp][0]);
    setName(`${newSp} ${animals.length + 1}`);
  };

  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      const tag = isLive && (lastTelemetry?.rfidTag || lastTelemetry?.cowId)
        ? (lastTelemetry.rfidTag || lastTelemetry.cowId)
        : `RFID-${species === "Goat" ? "G" : species === "Buffalo" ? "B" : "0"}${Math.floor(Math.random() * 900) + 100}`;
      setRfidTag(tag);
      setScanning(false);
      setScanned(true);
    }, 1200);
  };

  const handleSubmit = () => {
    if (!rfidTag.trim()) return;
    onRegister(rfidTag.trim(), name.trim() || defaultName, parseInt(ageYears) || 0, parseInt(ageMonths) || 0, breed, species);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#F7F4EE",
    border: "1.5px solid #D0CCC4",
    borderRadius: 10,
    padding: "11px 13px",
    fontSize: 14,
    color: "#1C2714",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(28,39,20,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 480,
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          padding: "24px 20px 36px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", gap: 16,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: "#E0DAD0", borderRadius: 99, margin: "0 auto -8px" }} />

        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "#1C2714" }}>
              📡 {lang === "Hindi" ? "नया पशु दर्ज करें" : lang === "Tamil" ? "புதிய கால்நடை பதிவு" : "Register New Animal"}
            </div>
            <div style={{ fontSize: 12, color: "#9BA88C", marginTop: 2 }}>
              {lang === "Hindi" ? "गाय, बकरी या भैंस का RFID स्कैन करें" : "Scan RFID card or enter Cow, Goat, Buffalo details"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#F0EDE6", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 16, cursor: "pointer" }}
          >✕</button>
        </div>

        {/* Species Selection */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🐾 {lang === "Hindi" ? "पशु प्रजाति" : lang === "Tamil" ? "கால்நடை வகை" : "Animal Species"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(["Cow", "Goat", "Buffalo"] as const).map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => handleSpeciesChange(sp)}
                style={{
                  background: species === sp ? "#2A5C1F" : "#F7F4EE",
                  color: species === sp ? "#FFFFFF" : "#1C2714",
                  border: `1.5px solid ${species === sp ? "#2A5C1F" : "#D0CCC4"}`,
                  borderRadius: 12,
                  padding: "10px 6px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 20 }}>{sp === "Goat" ? "🐐" : sp === "Buffalo" ? "🐃" : "🐄"}</span>
                <span>{sp === "Cow" ? "Cow 🐄" : sp === "Goat" ? "Goat 🐐" : "Buffalo 🐃"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RFID Scan Area */}
        <div
          style={{
            background: scanned ? "#E6F4E4" : scanning ? "#EEF6E4" : "#F7F4EE",
            border: `2px dashed ${scanned ? "#2D7A26" : "#C8C3BB"}`,
            borderRadius: 14, padding: "16px 14px",
            textAlign: "center", transition: "all 0.3s",
          }}
        >
          {scanning ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 6, animation: "pulse 0.8s infinite" }}>📡</div>
              <div style={{ fontSize: 13, color: "#4F8823", fontWeight: 600 }}>
                {lang === "Hindi" ? "स्कैन हो रहा है..." : "Scanning RFID..."}
              </div>
            </div>
          ) : scanned ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 4 }}>✅</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: "#2D7A26", fontWeight: 700 }}>{rfidTag}</div>
              <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>RFID Tag Detected</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🏷️</div>
              <div style={{ fontSize: 12, color: "#9BA88C" }}>
                {isLive ? "ESP32 connected — tap to scan" : "Tap to scan RFID or simulate tag"}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              flex: 1, background: scanning ? "#C8C3BB" : "#2A5C1F",
              color: "#FFF", border: "none", borderRadius: 12,
              padding: "12px 0", fontSize: 13, fontWeight: 700, cursor: scanning ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {scanning ? "⏳ Scanning..." : "📡 Scan RFID Card"}
          </button>
          <div style={{ flex: 1 }}>
            <input
              value={rfidTag}
              onChange={(e) => { setRfidTag(e.target.value); setScanned(!!e.target.value); }}
              placeholder="Or type RFID tag..."
              style={{ ...inputStyle, marginTop: 0 }}
            />
          </div>
        </div>

        {/* Animal Name */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🏷️ {lang === "Hindi" ? "पशु का नाम" : lang === "Tamil" ? "கால்நடை பெயர்" : "Animal Name"}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`e.g. ${species} 1, Lakshmi, Chandani...`}
            style={inputStyle}
          />
        </div>

        {/* Age */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🎂 {lang === "Hindi" ? "आयु" : lang === "Tamil" ? "வயது" : "Age"}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <input
                type="number" min="0" max="20"
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                style={inputStyle}
                placeholder="Years"
              />
              <div style={{ fontSize: 10, color: "#9BA88C", marginTop: 3, textAlign: "center" }}>
                {lang === "Hindi" ? "साल" : "Years"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number" min="0" max="11"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
                style={inputStyle}
                placeholder="Months"
              />
              <div style={{ fontSize: 10, color: "#9BA88C", marginTop: 3, textAlign: "center" }}>
                {lang === "Hindi" ? "महीना" : "Months"}
              </div>
            </div>
          </div>
        </div>

        {/* Breed */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7A5C", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🐾 {lang === "Hindi" ? "नस्ल" : lang === "Tamil" ? "இனம்" : "Breed"}
          </div>
          <select
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            style={{ ...inputStyle }}
          >
            {SPECIES_BREEDS[species].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!rfidTag.trim()}
          style={{
            background: rfidTag.trim() ? "#2A5C1F" : "#C8C3BB",
            color: "#FFF", border: "none", borderRadius: 14,
            padding: "16px 0", fontSize: 15, fontWeight: 700,
            cursor: rfidTag.trim() ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            boxShadow: rfidTag.trim() ? "0 4px 16px rgba(42,92,31,0.3)" : "none",
          }}
        >
          ✅ {lang === "Hindi" ? `${species === "Goat" ? "बकरी" : species === "Buffalo" ? "भैंस" : "गाय"} दर्ज करें` : `Register ${species}`}
        </button>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AnimalsScreen({
  onNavigate,
  lang,
}: {
  onNavigate: (s: Screen) => void;
  lang: string;
}) {
  const { isLive, lastTelemetry } = useESP32();
  const { animals, setSelectedAnimal, addAnimal } = useAnimals();
  const { selectedHerdId, setSelectedHerdId, herds } = useHerd();
  const [speciesFilter, setSpeciesFilter] = useState<"all" | "Cow" | "Goat" | "Buffalo">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [lactationFilter, setLactationFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"risk_desc" | "risk_asc" | "milk_desc" | "name" | "lactation_desc">("risk_desc");
  const [search, setSearch] = useState("");
  const [showRFIDModal, setShowRFIDModal] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const riskFilters: { id: "all" | RiskLevel; label: string }[] = [
    { id: "all", label: lang === "Tamil" ? "அனைத்து இடர்" : lang === "Hindi" ? "सभी रिस्क" : "All Risks" },
    { id: "high", label: t("risk_high", lang) },
    { id: "moderate", label: t("risk_moderate", lang) },
    { id: "low", label: t("risk_low", lang) },
    { id: "none", label: t("risk_none", lang) },
  ];

  const speciesFilters: { id: "all" | "Cow" | "Goat" | "Buffalo"; label: string; icon: string }[] = [
    { id: "all", label: "All Species", icon: "🐾" },
    { id: "Cow", label: "Cows", icon: "🐄" },
    { id: "Goat", label: "Goats", icon: "🐐" },
    { id: "Buffalo", label: "Buffaloes", icon: "🐃" },
  ];

  const getRiskScore = (risk: RiskLevel): number => {
    switch (risk) {
      case "high": return 88;
      case "moderate": return 64;
      case "low": return 22;
      case "none": return 8;
    }
  };

  const visible = animals
    .filter((a) => {
      const sp = a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow");
      const matchesHerd = selectedHerdId === "all" || a.herdId === selectedHerdId;
      const matchesSpecies = speciesFilter === "all" || sp === speciesFilter;
      const matchesRisk = riskFilter === "all" || a.risk === riskFilter;
      const matchesLactation =
        lactationFilter === "all" ||
        (lactationFilter === "4+" ? a.lactation >= 4 : a.lactation.toString() === lactationFilter);
      const matchesSearch =
        search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        (a.rfidTag?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (a.breed?.toLowerCase().includes(search.toLowerCase()) ?? false);

      return matchesHerd && matchesSpecies && matchesRisk && matchesLactation && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "risk_desc") return getRiskScore(b.risk) - getRiskScore(a.risk);
      if (sortBy === "risk_asc") return getRiskScore(a.risk) - getRiskScore(b.risk);
      if (sortBy === "milk_desc") return (b.milk || 0) - (a.milk || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "lactation_desc") return b.lactation - a.lactation;
      return 0;
    });

  const handleRegister = (rfid: string, animalName: string, ageYears: number, ageMonths: number, breed: string, species: "Cow" | "Goat" | "Buffalo") => {
    const newAnimal = addAnimal(rfid, animalName, ageYears, ageMonths, breed, species);
    setJustAdded(newAnimal.id);
    setTimeout(() => setJustAdded(null), 3000);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="animals" lang={lang} />

      {showRFIDModal && (
        <RFIDRegisterModal
          onClose={() => setShowRFIDModal(false)}
          onRegister={handleRegister}
          lang={lang}
        />
      )}

      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E0DAD0", padding: "12px 0 0" }}>
        <div style={{ padding: "4px 16px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#1C2714" }}>
                {t("tab_animals", lang)}{" "}
                <span style={{ fontSize: 14, fontWeight: 500, color: "#9BA88C", fontFamily: "'Outfit', sans-serif" }}>
                  ({animals.length} {t("animals_total", lang)})
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#6B7A5C", marginTop: 2 }}>
                🐄 {animals.filter(a => (a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow")) === "Cow").length} Cows · 🐐 {animals.filter(a => (a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow")) === "Goat").length} Goats · 🐃 {animals.filter(a => (a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow")) === "Buffalo").length} Buffaloes
              </div>
            </div>
            {/* RFID Register Button */}
            <button
              onClick={() => setShowRFIDModal(true)}
              style={{
                background: "linear-gradient(135deg, #2A5C1F, #3D7A2C)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "9px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 3px 10px rgba(42,92,31,0.3)",
                whiteSpace: "nowrap",
              }}
            >
              📡 {lang === "Hindi" ? "+ नया पशु" : lang === "Tamil" ? "+ புதிய கால்நடை" : "+ Add Animal (RFID)"}
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "Hindi" ? "नाम, ID, RFID या नस्ल खोजें..." : lang === "Tamil" ? "பெயர், ID, RFID அல்லது இனம் தேடுக..." : "Search by name, ID, RFID or breed..."}
            style={{
              width: "100%",
              background: "#F7F4EE",
              border: "1.5px solid #E0DAD0",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              color: "#1C2714",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Multi-Herd Filter Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", overflowX: "auto" }}>
          <button
            onClick={() => setSelectedHerdId("all")}
            style={{
              background: selectedHerdId === "all" ? "#2A5C1F" : "#F0EDE6",
              color: selectedHerdId === "all" ? "#FFFFFF" : "#6B7A5C",
              border: "none",
              borderRadius: 16,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            🌐 All Herds ({animals.length})
          </button>
          {herds.map((h) => {
            const count = animals.filter((a) => a.herdId === h.id).length;
            const isSelected = selectedHerdId === h.id;
            return (
              <button
                key={h.id}
                onClick={() => setSelectedHerdId(h.id)}
                style={{
                  background: isSelected ? "#2A5C1F" : "#F0EDE6",
                  color: isSelected ? "#FFFFFF" : "#6B7A5C",
                  border: "none",
                  borderRadius: 16,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                🐄 {h.name.split("–")[0].trim()} ({count})
              </button>
            );
          })}
        </div>

        {/* Species Filter Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", overflowX: "auto" }}>
          {speciesFilters.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpeciesFilter(s.id)}
              style={{
                background: speciesFilter === s.id ? "#1C3814" : "#F0EDE6",
                color: speciesFilter === s.id ? "#FFFFFF" : "#6B7A5C",
                border: "none",
                borderRadius: 16,
                padding: "5px 11px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s",
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
              {s.id !== "all" && (
                <span style={{ opacity: 0.8, fontSize: 10 }}>
                  ({animals.filter((a) => (a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow")) === s.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Risk Filter Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", overflowX: "auto" }}>
          {riskFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setRiskFilter(f.id)}
              style={{
                background: riskFilter === f.id ? "#2A5C1F" : "#FFFFFF",
                color: riskFilter === f.id ? "#FFFFFF" : "#6B7A5C",
                border: `1px solid ${riskFilter === f.id ? "#2A5C1F" : "#E0DAD0"}`,
                borderRadius: 16,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {f.label}
              {f.id !== "all" && (
                <span style={{ marginLeft: 4, opacity: 0.8 }}>
                  ({animals.filter((a) => a.risk === f.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort & Lactation Filter Controls Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7A5C", textTransform: "uppercase" }}>Lactation:</span>
            <select
              value={lactationFilter}
              onChange={(e) => setLactationFilter(e.target.value)}
              style={{
                background: "#F7F4EE",
                border: "1px solid #D0CCC4",
                borderRadius: 8,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 600,
                color: "#1C2714",
                outline: "none",
              }}
            >
              <option value="all">All Lactations</option>
              <option value="1">Lactation 1</option>
              <option value="2">Lactation 2</option>
              <option value="3">Lactation 3</option>
              <option value="4+">Lactation 4+</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7A5C", textTransform: "uppercase" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: "#F7F4EE",
                border: "1px solid #D0CCC4",
                borderRadius: 8,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 600,
                color: "#1C2714",
                outline: "none",
              }}
            >
              <option value="risk_desc">Risk % (High → Low)</option>
              <option value="risk_asc">Risk % (Low → High)</option>
              <option value="milk_desc">Milk Yield (High → Low)</option>
              <option value="lactation_desc">Lactation Stage</option>
              <option value="name">Name (A → Z)</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {/* Just-added success banner */}
        {justAdded && (
          <div
            style={{
              background: "#E6F4E4", border: "1.5px solid #B8DBBA",
              borderRadius: 12, padding: "10px 14px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 8,
              animation: "slideDown 0.3s ease",
            }}
          >
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2D7A26" }}>
                {animals.find(a => a.id === justAdded)?.name} Registered!
              </div>
              <div style={{ fontSize: 11, color: "#6B7A5C" }}>
                Species: {animals.find(a => a.id === justAdded)?.species || "Cow"} · RFID: {animals.find(a => a.id === justAdded)?.rfidTag} · ID: {justAdded}
              </div>
            </div>
          </div>
        )}

        {/* Live ESP32 Hardware Banner */}
        {isLive && lastTelemetry?.cowScanned ? (
          <div
            style={{
              background: "linear-gradient(135deg, #1C2714, #2A5C1F)",
              border: "1.5px solid #68B946",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 12,
              color: "#FFFFFF",
              boxShadow: "0 4px 16px rgba(42,92,31,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 10px #4ADE80" }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: "#A3E635", textTransform: "uppercase" }}>
                  LIVE ESP32 SENSOR FEED
                </span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: "'JetBrains Mono'" }}>
                {lastTelemetry.timestamp}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  🐄 {lastTelemetry.cowName || lastTelemetry.cowId || "LIVE ANIMAL"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                  RFID: {lastTelemetry.rfidTag || "0xE3995556"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: lastTelemetry.riskTier === "HIGH" || lastTelemetry.riskTier === "Elevated" ? "#F87171" : "#86EFAC" }}>
                  {lastTelemetry.riskTier || "LOW RISK"}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                  Risk Score: {lastTelemetry.riskScore ?? 0}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 10, background: "rgba(0,0,0,0.2)", padding: "8px 10px", borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>MILK pH</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{lastTelemetry.ph != null ? Number(lastTelemetry.ph).toFixed(2) : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>MILK EC</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{lastTelemetry.conductivity != null ? Number(lastTelemetry.conductivity).toFixed(2) : "—"} <span style={{ fontSize: 8 }}>mS</span></div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>BODY TEMP</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{lastTelemetry.temp != null ? `${Number(lastTelemetry.temp).toFixed(1)}°C` : "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>WEIGHT</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>{lastTelemetry.weight != null ? `${Number(lastTelemetry.weight).toFixed(1)}kg` : "—"}</div>
              </div>
            </div>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9BA88C" }}>{t("no_animals", lang)}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map((a) => {
              const sp = a.species || (a.id.startsWith("GT") ? "Goat" : a.id.startsWith("BF") ? "Buffalo" : "Cow");
              const spIcon = sp === "Goat" ? "🐐" : sp === "Buffalo" ? "🐃" : "🐄";
              const isMonitoredCow = isLive && lastTelemetry?.cowScanned && (a.id === lastTelemetry.cowId || a.rfidTag === lastTelemetry.rfidTag);
              const displayPh = isMonitoredCow && lastTelemetry.ph != null ? lastTelemetry.ph : a.ph;
              const displayEc = isMonitoredCow && lastTelemetry.conductivity != null ? lastTelemetry.conductivity : a.conductivity;
              const displayTemp = isMonitoredCow && lastTelemetry.temp != null ? lastTelemetry.temp : a.temp;
              const displayRisk = isMonitoredCow && lastTelemetry.riskTier ? (lastTelemetry.riskTier.toLowerCase() as RiskLevel) : a.risk;
              const riskPct = getRiskScore(displayRisk);
              const herdObj = herds.find((h) => h.id === a.herdId);
              const herdLabel = herdObj ? herdObj.name.split("–")[0].trim() : (a.herdId || "Herd A");

              return (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedAnimal(a);
                  onNavigate("animal-profile");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: isMonitoredCow ? "#F2F9EE" : a.id === justAdded ? "#F0FAF0" : "#FFFFFF",
                  border: `1px solid ${isMonitoredCow ? "#68B946" : a.id === justAdded ? "#B8DBBA" : "#E0DAD0"}`,
                  borderLeft: `4px solid ${isMonitoredCow ? "#2A5C1F" : RISK_COLOR[a.risk].dot}`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: RISK_COLOR[a.risk].bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {spIcon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
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
                    <span style={{ fontSize: 10, fontWeight: 700, background: "#EEF6E4", color: "#2A5C1F", padding: "1px 6px", borderRadius: 6 }}>
                      {sp}
                    </span>
                    <span style={{ fontSize: 9.5, fontWeight: 700, background: "#F1F5F9", color: "#475569", padding: "1px 6px", borderRadius: 6, border: "1px solid #CBD5E1" }}>
                      🏡 {herdLabel}
                    </span>
                    <TrendArrow dir={a.trend} />
                  </div>

                  {/* Age badge + breed + lactation + RFID info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: "#EEF6E4",
                        color: "#2A5C1F",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                        border: "1px solid #C4DDA0",
                      }}
                    >
                      🎂 {a.age}
                    </span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "#6B7A5C", background: "#F8FAFC", padding: "2px 6px", borderRadius: 6 }}>
                      🥛 Lac {a.lactation}
                    </span>
                    <span style={{ fontSize: 11, color: "#6B7A5C" }}>
                      {a.breed} · {sp === "Goat" ? "2 Halves" : "4 Quarters"}
                    </span>
                    {a.rfidTag && (
                      <span style={{ fontSize: 9, color: "#9BA88C", fontFamily: "'JetBrains Mono'" }}>
                        📡 {a.rfidTag}
                      </span>
                    )}
                  </div>

                  {/* Sensor telemetry row */}
                  <div style={{ display: "flex", gap: 10, fontSize: 11, flexWrap: "wrap" }}>
                    <span style={{ color: "#6B7A5C" }}>
                      pH <strong style={{ color: displayPh && (displayPh > 7.0 || displayPh < 6.4) ? "#B83220" : "#1C2714" }}>{displayPh != null ? Number(displayPh).toFixed(2) : "6.7"}</strong>
                    </span>
                    <span style={{ color: "#6B7A5C" }}>
                      EC <strong style={{ color: displayEc > 8 ? "#B83220" : "#1C2714" }}>{displayEc != null ? Number(displayEc).toFixed(1) : "—"}</strong>
                    </span>
                    <span style={{ color: "#6B7A5C" }}>
                      🌡 <strong style={{ color: displayTemp > 39 ? "#B83220" : "#1C2714" }}>{displayTemp != null ? `${Number(displayTemp).toFixed(1)}°C` : "—"}</strong>
                    </span>
                    <span style={{ color: "#6B7A5C" }}>
                      🥛 <strong style={{ color: "#1C2714" }}>{isMonitoredCow && lastTelemetry.weight != null ? `${Number(lastTelemetry.weight).toFixed(1)}kg` : `${a.milk}L`}</strong>
                    </span>
                    {a.scc != null && (
                      <span style={{ color: "#6B7A5C" }}>
                        SCC <strong style={{ color: a.scc > (sp === "Goat" ? 1200000 : 500000) ? "#B83220" : "#1C2714" }}>{((a.scc) / 1000).toFixed(0)}k</strong>
                      </span>
                    )}
                    {a.rumination != null && (
                      <span style={{ color: "#6B7A5C" }}>
                        🔄 <strong>{a.rumination}m</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  {/* Risk % Pill Badge */}
                  <div
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: 14,
                      fontWeight: 800,
                      color: RISK_COLOR[displayRisk].text,
                    }}
                  >
                    {riskPct}% <span style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: 700 }}>Risk</span>
                  </div>
                  <RiskBadge level={displayRisk} small lang={lang} />
                  <div style={{ fontSize: 10, color: isMonitoredCow ? "#2A5C1F" : "#9BA88C", fontWeight: isMonitoredCow ? 700 : 400 }}>
                    {isMonitoredCow ? "Live ESP32" : a.lastSync}
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}



