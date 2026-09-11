import React, { useState, useRef, useEffect, useCallback } from "react";
import { BackHeader, Card, SectionLabel, RiskBadge, ReadAloudFAB } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { useESP32 } from "../context/ESP32Context";
import { RISK_COLOR } from "../types/index";
import type { Animal, RiskLevel } from "../types/index";
import { t } from "../i18n/index";

// ── GPS Coordinate seeds per animal (lat/lng offsets from farm centre) ──────────
// Farm centroid: Anand, Gujarat (~22.5580° N, 72.9520° E)
const FARM_CENTER = { lat: 22.5580, lng: 72.9520 };
const FARM_RADIUS_M = 220; // geofence radius in metres

interface CowGPS {
  id: string;
  lat: number;
  lng: number;
  speed: number;       // m/min
  heading: number;     // degrees 0–360
  zone: string;
  outsideGeofence: boolean;
  lastUpdate: string;
  batteryPct: number;
  signal: "Strong" | "Good" | "Weak";
  collarId: string;
}

// Deterministic starting positions for each animal
const BASE_POSITIONS: Record<string, { dlat: number; dlng: number }> = {
  "KA-001": { dlat:  0.0008,  dlng:  0.0004 },
  "KA-007": { dlat: -0.0005,  dlng:  0.0010 },
  "GT-001": { dlat:  0.0012,  dlng: -0.0006 },
  "GT-002": { dlat: -0.0009,  dlng: -0.0012 },
  "KA-014": { dlat:  0.0002,  dlng:  0.0015 },
  "BF-001": { dlat:  0.0018,  dlng:  0.0002 },
  "KA-022": { dlat: -0.0014,  dlng:  0.0008 },
  "GT-003": { dlat:  0.0006,  dlng: -0.0018 },
  "KA-031": { dlat: -0.0003,  dlng: -0.0005 },
  "KA-052": { dlat:  0.0020,  dlng:  0.0018 }, // outside geofence
};

// Convert lat/lng delta to pixel offset on the canvas map (equirectangular approx)
const LAT_TO_PX = 14000;  // pixels per degree lat
const LNG_TO_PX = 13000;  // pixels per degree lng

// Haversine distance in metres
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildInitialGPS(animals: Animal[]): CowGPS[] {
  return animals.map((a, idx) => {
    const base = BASE_POSITIONS[a.id] || { dlat: (idx * 0.0004) % 0.002, dlng: (idx * 0.0003) % 0.002 };
    const lat = FARM_CENTER.lat + base.dlat;
    const lng = FARM_CENTER.lng + base.dlng;
    const dist = haversineM(FARM_CENTER.lat, FARM_CENTER.lng, lat, lng);
    const signals: CowGPS["signal"][] = ["Strong", "Good", "Weak"];
    return {
      id: a.id,
      lat,
      lng,
      speed: a.activity === "high" ? 3.2 : a.activity === "normal" ? 1.4 : 0.3,
      heading: (idx * 47 + 30) % 360,
      zone: dist < 80 ? "Barn" : dist < 140 ? "East Paddock" : dist < 200 ? "West Grazing" : "Far Field",
      outsideGeofence: dist > FARM_RADIUS_M,
      lastUpdate: `${(idx % 4) + 1} min ago`,
      batteryPct: 95 - (idx * 7) % 40,
      signal: signals[idx % 3],
      collarId: `GPS-${a.rfidTag ?? a.id}`,
    };
  });
}

// Simulate slow drift of cow positions
function driftGPS(prev: CowGPS[], animals: Animal[]): CowGPS[] {
  return prev.map((cow) => {
    const animal = animals.find((a) => a.id === cow.id);
    const baseSpeed = animal?.activity === "high" ? 0.00003 : animal?.activity === "normal" ? 0.00001 : 0.000003;
    const drift = baseSpeed * (0.5 + Math.random());
    const angle = (cow.heading + (Math.random() - 0.5) * 30) % 360;
    const newLat = cow.lat + Math.cos((angle * Math.PI) / 180) * drift;
    const newLng = cow.lng + Math.sin((angle * Math.PI) / 180) * drift;
    const dist = haversineM(FARM_CENTER.lat, FARM_CENTER.lng, newLat, newLng);
    const outside = dist > FARM_RADIUS_M;
    return {
      ...cow,
      lat: newLat,
      lng: newLng,
      heading: angle,
      outsideGeofence: outside,
      zone: dist < 80 ? "Barn" : dist < 140 ? "East Paddock" : dist < 200 ? "West Grazing" : "Far Field",
      lastUpdate: "just now",
    };
  });
}

// ── Risk colour helper ─────────────────────────────────────────────────────────
function riskDot(risk: RiskLevel): string {
  return RISK_COLOR[risk]?.dot ?? "#94A3B8";
}

// ── Tiny signal bar component ─────────────────────────────────────────────────
function SignalBars({ signal }: { signal: CowGPS["signal"] }) {
  const bars = signal === "Strong" ? 3 : signal === "Good" ? 2 : 1;
  const color = signal === "Strong" ? "#2A5C1F" : signal === "Good" ? "#C47A10" : "#B83220";
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 12 }}>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          style={{
            width: 3,
            height: b <= bars ? `${b * 4}px` : "4px",
            background: b <= bars ? color : "#D1C9BA",
            borderRadius: 2,
            display: "inline-block",
          }}
        />
      ))}
    </span>
  );
}

// ── Canvas farm map ────────────────────────────────────────────────────────────
function FarmMapCanvas({
  cowsGPS,
  animals,
  selectedId,
  onSelect,
}: {
  cowsGPS: CowGPS[];
  animals: Animal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 340, H = 260;
  const CX = W / 2, CY = H / 2;

  // Convert lat/lng to canvas pixel
  const toPixel = useCallback(
    (lat: number, lng: number): [number, number] => {
      const px = CX + (lng - FARM_CENTER.lng) * LNG_TO_PX;
      const py = CY - (lat - FARM_CENTER.lat) * LAT_TO_PX;
      return [px, py];
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Background terrain
    const terrainGrad = ctx.createLinearGradient(0, 0, W, H);
    terrainGrad.addColorStop(0, "#E8F5E4");
    terrainGrad.addColorStop(1, "#D4EBCE");
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (subtle)
    ctx.strokeStyle = "rgba(42,92,31,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Barn building
    ctx.fillStyle = "#C8A96E";
    ctx.strokeStyle = "#8B6914";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(CX - 22, CY - 18, 44, 36, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8B6914";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BARN", CX, CY + 4);

    // Geofence circle
    const FENCE_R = (FARM_RADIUS_M / 111000) * LAT_TO_PX; // approx px
    ctx.strokeStyle = "rgba(42,92,31,0.55)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(CX, CY, FENCE_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone shading
    ctx.fillStyle = "rgba(42,92,31,0.06)";
    ctx.beginPath(); ctx.arc(CX, CY, FENCE_R, 0, Math.PI * 2); ctx.fill();

    // Fence label
    ctx.fillStyle = "rgba(42,92,31,0.6)";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Geo-fence boundary", CX, CY - FENCE_R + 12);

    // Water trough
    ctx.fillStyle = "#7EC8E3";
    ctx.strokeStyle = "#2B7FAA";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(CX + 52, CY - 30, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2B7FAA";
    ctx.font = "7px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Water", CX + 52, CY - 18);

    // Feed area
    ctx.fillStyle = "#E9D46A";
    ctx.strokeStyle = "#B5981E";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(CX - 72, CY + 28, 28, 18, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#7A620A";
    ctx.font = "7px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Feed", CX - 58, CY + 40);

    // Cow dots
    cowsGPS.forEach((cow) => {
      const animal = animals.find((a) => a.id === cow.id);
      const risk = animal?.risk ?? "none";
      const [px, py] = toPixel(cow.lat, cow.lng);
      const isSelected = cow.id === selectedId;
      const dotColor = cow.outsideGeofence ? "#B83220" : riskDot(risk);
      const dotR = isSelected ? 9 : 6;

      // Selection glow
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(px, py, dotR + 5, 0, Math.PI * 2);
        ctx.fillStyle = `${dotColor}30`;
        ctx.fill();
      }

      // Pulsing outer ring for outside-geofence
      if (cow.outsideGeofence) {
        ctx.beginPath();
        ctx.arc(px, py, dotR + 4, 0, Math.PI * 2);
        ctx.strokeStyle = "#B83220";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Dot
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Name label
      ctx.fillStyle = "#1C2714";
      ctx.font = isSelected ? "bold 8px sans-serif" : "7px sans-serif";
      ctx.textAlign = "center";
      const shortName = animal?.name.replace("Cow ", "C").replace("Goat ", "G").replace("Buffalo ", "B") ?? cow.id;
      ctx.fillText(shortName, px, py - dotR - 3);

      // Speed direction arrow
      if (cow.speed > 0.5) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((cow.heading * Math.PI) / 180);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -dotR);
        ctx.lineTo(0, -dotR - 6);
        ctx.stroke();
        ctx.restore();
      }
    });

    // Compass rose (top-right)
    const compassX = W - 20, compassY = 20;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath(); ctx.arc(compassX, compassY, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#B83220"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("N", compassX, compassY - 4);
    ctx.fillStyle = "#1C2714"; ctx.font = "7px sans-serif";
    ctx.fillText("S", compassX, compassY + 9);
    ctx.fillText("E", compassX + 6, compassY + 3);
    ctx.fillText("W", compassX - 6, compassY + 3);
  }, [cowsGPS, animals, selectedId, toPixel]);

  // Click handler to select cow
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    let closest: string | null = null;
    let minDist = 14;
    cowsGPS.forEach((cow) => {
      const [px, py] = [
        CX + (cow.lng - FARM_CENTER.lng) * LNG_TO_PX,
        CY - (cow.lat - FARM_CENTER.lat) * LAT_TO_PX,
      ];
      const d = Math.hypot(mx - px, my - py);
      if (d < minDist) { minDist = d; closest = cow.id; }
    });
    if (closest) onSelect(closest);
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      onClick={handleClick}
      style={{
        width: "100%",
        height: "auto",
        borderRadius: 14,
        cursor: "crosshair",
        display: "block",
        border: "1.5px solid #C8BFA8",
      }}
    />
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export function LocationScreen({
  onBack,
  lang,
  onSelectAnimal,
}: {
  onBack: () => void;
  lang: string;
  onSelectAnimal?: (animal: Animal) => void;
}) {
  const { animals } = useAnimals();
  const { isLive } = useESP32();
  const [cowsGPS, setCowsGPS] = useState<CowGPS[]>(() => buildInitialGPS(animals));
  const [selectedId, setSelectedId] = useState<string | null>(animals[0]?.id ?? null);
  const [filterZone, setFilterZone] = useState<"All" | "Barn" | "East Paddock" | "West Grazing" | "Far Field">("All");
  const [filterRisk, setFilterRisk] = useState<"All" | "high" | "moderate" | "low" | "none">("All");
  const [liveTracking, setLiveTracking] = useState(true);
  const [mapLayer, setMapLayer] = useState<"terrain" | "satellite" | "heat">("terrain");

  // Live GPS drift simulation
  useEffect(() => {
    if (!liveTracking) return;
    const interval = setInterval(() => {
      setCowsGPS((prev) => driftGPS(prev, animals));
    }, 3000);
    return () => clearInterval(interval);
  }, [liveTracking, animals]);

  // Derived stats
  const outsideCount = cowsGPS.filter((c) => c.outsideGeofence).length;
  const inBarn = cowsGPS.filter((c) => c.zone === "Barn").length;
  const activeMoving = cowsGPS.filter((c) => c.speed > 1).length;
  const avgBattery = Math.round(cowsGPS.reduce((s, c) => s + c.batteryPct, 0) / cowsGPS.length);

  const selectedCow = cowsGPS.find((c) => c.id === selectedId);
  const selectedAnimal = animals.find((a) => a.id === selectedId);

  // Filtered list
  const filteredCows = cowsGPS.filter((cow) => {
    const animal = animals.find((a) => a.id === cow.id);
    if (filterZone !== "All" && cow.zone !== filterZone) return false;
    if (filterRisk !== "All" && animal?.risk !== filterRisk) return false;
    return true;
  });

  const zones: typeof filterZone[] = ["All", "Barn", "East Paddock", "West Grazing", "Far Field"];
  const risks: typeof filterRisk[] = ["All", "high", "moderate", "low", "none"];
  const riskLabels: Record<string, string> = { All: "All Risk", high: "High", moderate: "Moderate", low: "Low", none: "Healthy" };

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

      {/* Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E0D8" }}>
        <BackHeader
          title={
            lang === "Tamil" ? "📍 கால்நடை இடம் கண்காணிப்பு"
            : lang === "Hindi" ? "📍 पशु स्थान ट्रैकिंग"
            : "📍 Live GPS Cattle Tracking"
          }
          onBack={onBack}
        />
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 14px 80px" }}>

        {/* ── Top Alert Banner (geofence breach) */}
        {outsideCount > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #B83220 0%, #7F1D1D 100%)",
              borderRadius: 14,
              padding: "12px 14px",
              color: "#FFFFFF",
              marginBottom: 14,
              boxShadow: "0 4px 16px rgba(184,50,32,0.28)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                {outsideCount} {outsideCount === 1 ? "Animal" : "Animals"} Outside Geo-Fence!
              </div>
              <div style={{ fontSize: 11, color: "#FEE2E2", lineHeight: 1.4 }}>
                {lang === "Tamil"
                  ? "ஒரு அல்லது அதிக மாடுகள் பண்ணை எல்லையை கடந்துள்ளன. உடனடி நடவடிக்கை எடுக்கவும்."
                  : "One or more animals have crossed the farm boundary. Check their GPS position immediately."}
              </div>
            </div>
          </div>
        )}

        {/* ── Summary Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { label: "Tracked", value: cowsGPS.length, icon: "📡", color: "#2A5C1F" },
            { label: "In Barn", value: inBarn, icon: "🏠", color: "#1D4ED8" },
            { label: "Moving", value: activeMoving, icon: "🚶", color: "#C47A10" },
            { label: "Battery", value: `${avgBattery}%`, icon: "🔋", color: avgBattery > 50 ? "#2A5C1F" : "#B83220" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: "1.5px solid #E5E0D8",
                padding: "10px 6px",
                textAlign: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "#8A7A6A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Map Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <SectionLabel
            label={
              lang === "Tamil" ? "பண்ணை வரைபடம்"
              : lang === "Hindi" ? "फार्म मैप"
              : "Farm GPS Map"
            }
          />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Live toggle */}
            <button
              onClick={() => setLiveTracking((v) => !v)}
              style={{
                background: liveTracking ? "#052E16" : "#F0EDE6",
                color: liveTracking ? "#4ADE80" : "#6B7A5C",
                border: `1.5px solid ${liveTracking ? "#22C55E" : "#D0CAC0"}`,
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: liveTracking ? "#22C55E" : "#94A3B8",
                  animation: liveTracking ? "pulse 1.5s infinite" : "none",
                }}
              />
              {liveTracking ? "LIVE" : "PAUSED"}
            </button>
          </div>
        </div>

        {/* Map layer pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["terrain", "satellite", "heat"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setMapLayer(l)}
              style={{
                background: mapLayer === l ? "#2A5C1F" : "#FFFFFF",
                color: mapLayer === l ? "#FFFFFF" : "#6B7A5C",
                border: `1.5px solid ${mapLayer === l ? "#2A5C1F" : "#D0CAC0"}`,
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 10,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {l === "terrain" ? "🌿 Terrain" : l === "satellite" ? "🛰️ Satellite" : "🔥 Heat Map"}
            </button>
          ))}
        </div>

        {/* ── Canvas Map */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: 10,
            border: "1.5px solid #E0DAD0",
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
            marginBottom: 14,
            position: "relative",
          }}
        >
          {mapLayer === "heat" && (
            <div
              style={{
                position: "absolute",
                inset: 10,
                borderRadius: 14,
                background:
                  "radial-gradient(circle at 55% 45%, rgba(184,50,32,0.25) 0%, rgba(196,122,16,0.15) 30%, rgba(42,92,31,0.05) 70%, transparent 100%)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          )}
          {mapLayer === "satellite" && (
            <div
              style={{
                position: "absolute",
                inset: 10,
                borderRadius: 14,
                background: "rgba(0,30,10,0.12)",
                zIndex: 1,
                pointerEvents: "none",
                backdropFilter: "saturate(0.7) brightness(0.9)",
              }}
            />
          )}
          <FarmMapCanvas
            cowsGPS={cowsGPS}
            animals={animals}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Legend */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid #F0EDE6",
            }}
          >
            {[
              { label: "High Risk", color: "#B83220" },
              { label: "Moderate", color: "#C47A10" },
              { label: "Healthy", color: "#2A5C1F" },
              { label: "Outside Fence", color: "#B83220", dashed: true },
            ].map((leg) => (
              <div key={leg.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: leg.color,
                    border: leg.dashed ? "2px dashed #B83220" : "1.5px solid #FFF",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontSize: 9, color: "#6B7A5C", fontWeight: 600 }}>{leg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Selected Cow Detail Panel */}
        {selectedCow && selectedAnimal && (
          <div
            style={{
              background: "linear-gradient(135deg, #1C3E26 0%, #0F2516 100%)",
              borderRadius: 16,
              padding: "14px 16px",
              color: "#FFFFFF",
              marginBottom: 14,
              boxShadow: "0 6px 24px rgba(28,62,38,0.25)",
              border: "1.5px solid #366B38",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>
                    {selectedAnimal.species === "Goat" ? "🐐" : selectedAnimal.species === "Buffalo" ? "🐃" : "🐄"}
                  </span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedAnimal.name}</div>
                    <div style={{ fontSize: 10, color: "#86EFAC", fontWeight: 600 }}>{selectedCow.collarId}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    background: selectedCow.outsideGeofence ? "#B83220" : "#2A5C1F",
                    color: "#FFFFFF",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 10,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {selectedCow.outsideGeofence ? "⚠️ Outside Fence" : `✅ ${selectedCow.zone}`}
                </div>
                <div style={{ fontSize: 10, color: "#86EFAC" }}>Updated {selectedCow.lastUpdate}</div>
              </div>
            </div>

            {/* GPS Coordinates */}
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 10,
                fontFamily: "monospace",
              }}
            >
              <div style={{ fontSize: 10, color: "#86EFAC", marginBottom: 3, fontWeight: 700 }}>GPS COORDINATES</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
                {selectedCow.lat.toFixed(6)}°N, {selectedCow.lng.toFixed(6)}°E
              </div>
            </div>

            {/* Metrics row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Speed", value: `${selectedCow.speed.toFixed(1)} m/s`, icon: "⚡" },
                { label: "Heading", value: `${Math.round(selectedCow.heading)}°`, icon: "🧭" },
                { label: "Battery", value: `${selectedCow.batteryPct}%`, icon: "🔋" },
                { label: "Signal", value: selectedCow.signal, icon: "📶" },
              ].map((m) => (
                <div key={m.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{m.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{m.value}</div>
                  <div style={{ fontSize: 9, color: "#86EFAC", textTransform: "uppercase" }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Profile CTA */}
            {onSelectAnimal && (
              <button
                onClick={() => onSelectAnimal(selectedAnimal)}
                style={{
                  width: "100%",
                  marginTop: 12,
                  background: "rgba(255,255,255,0.1)",
                  color: "#86EFAC",
                  border: "1px solid rgba(134,239,172,0.3)",
                  borderRadius: 10,
                  padding: "8px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                View Full Animal Profile →
              </button>
            )}
          </div>
        )}

        {/* ── Filter Row */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7A5C", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Filter by Zone
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {zones.map((z) => (
              <button
                key={z}
                onClick={() => setFilterZone(z)}
                style={{
                  background: filterZone === z ? "#2A5C1F" : "#FFFFFF",
                  color: filterZone === z ? "#FFFFFF" : "#4B5E3C",
                  border: `1.5px solid ${filterZone === z ? "#2A5C1F" : "#D0CAC0"}`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {z}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7A5C", margin: "8px 0 6px", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Filter by Risk
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {risks.map((r) => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                style={{
                  background: filterRisk === r ? (r === "All" ? "#1C2714" : RISK_COLOR[r as RiskLevel]?.bg ?? "#F0EDE6") : "#FFFFFF",
                  color: filterRisk === r ? (r === "All" ? "#FFFFFF" : RISK_COLOR[r as RiskLevel]?.text ?? "#333") : "#6B7A5C",
                  border: `1.5px solid ${filterRisk === r ? (r === "All" ? "#1C2714" : RISK_COLOR[r as RiskLevel]?.border ?? "#D0CAC0") : "#D0CAC0"}`,
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {riskLabels[r]}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cow List */}
        <SectionLabel
          label={`All Animals (${filteredCows.length})`}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredCows.map((cow) => {
            const animal = animals.find((a) => a.id === cow.id);
            if (!animal) return null;
            const isSelected = cow.id === selectedId;
            const dotColor = cow.outsideGeofence ? "#B83220" : riskDot(animal.risk);

            return (
              <button
                key={cow.id}
                onClick={() => setSelectedId(cow.id)}
                style={{
                  background: isSelected ? "#FFFFFF" : "#FFFFFF",
                  border: isSelected ? "2px solid #2A5C1F" : "1.5px solid #E5E0D8",
                  borderRadius: 14,
                  padding: "12px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 16px rgba(42,92,31,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
                  transition: "all 0.18s ease",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Left: animal info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Risk dot + icon */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: RISK_COLOR[animal.risk]?.bg ?? "#F0F0F0",
                        border: `2px solid ${dotColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      {animal.species === "Goat" ? "🐐" : animal.species === "Buffalo" ? "🐃" : "🐄"}
                      {cow.outsideGeofence && (
                        <span
                          style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            background: "#B83220",
                            color: "#FFF",
                            borderRadius: "50%",
                            width: 14,
                            height: 14,
                            fontSize: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                          }}
                        >
                          !
                        </span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#1C2714", marginBottom: 1 }}>
                        {animal.name}
                        {" "}
                        <span style={{ fontSize: 10, color: "#8A7A6A", fontWeight: 500 }}>#{cow.id}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6B7A5C", display: "flex", alignItems: "center", gap: 4 }}>
                        <span>📍</span>
                        <span style={{ fontWeight: 600 }}>{cow.zone}</span>
                        <span style={{ color: "#C8BFA8" }}>·</span>
                        <span>{cow.lat.toFixed(4)}°N</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: stats */}
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                      <RiskBadge risk={animal.risk} lang={lang} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                      <SignalBars signal={cow.signal} />
                      <span style={{ fontSize: 10, color: "#8A7A6A" }}>{cow.batteryPct}%🔋</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#8A7A6A" }}>
                      ⚡ {cow.speed.toFixed(1)} m/s · {cow.lastUpdate}
                    </div>
                  </div>
                </div>

                {/* Geofence breach warning row */}
                {cow.outsideGeofence && (
                  <div
                    style={{
                      marginTop: 8,
                      background: "#FEE2E2",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontSize: 10,
                      color: "#B83220",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span>🚨</span>
                    Outside geo-fence boundary — immediate check required!
                  </div>
                )}
              </button>
            );
          })}

          {filteredCows.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "#8A7A6A",
                padding: "30px 20px",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📡</div>
              No animals match the selected filters.
            </div>
          )}
        </div>

        {/* ── GPS Collar Info */}
        <div
          style={{
            marginTop: 18,
            background: "linear-gradient(135deg, #1C2714 0%, #0E1809 100%)",
            borderRadius: 16,
            padding: "14px 16px",
            color: "#FFFFFF",
            border: "1.5px solid #2A3C1C",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🛰️</span>
            <div style={{ fontWeight: 800, fontSize: 13 }}>
              {lang === "Tamil" ? "GPS காலர் தொழில்நுட்ப தகவல்" : "GPS Collar System Info"}
            </div>
          </div>
          {[
            { label: "Device", value: "SkyTrack AgriCollar v2.1" },
            { label: "Protocol", value: "NMEA 0183 + LoRa 868 MHz" },
            { label: "Update Rate", value: "Every 30 sec" },
            { label: "Accuracy", value: "±2.5 m (SBAS corrected)" },
            { label: "Geo-fence", value: `${FARM_RADIUS_M} m radius` },
            {
              label: "ESP32 Bridge",
              value: isLive ? "✅ Connected" : "⚠️ Simulated",
              highlight: isLive,
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: 11, color: "#86EFAC", fontWeight: 600 }}>{row.label}</span>
              <span
                style={{
                  fontSize: 11,
                  color: row.highlight ? "#4ADE80" : "#F0EDE6",
                  fontWeight: row.highlight ? 700 : 400,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
