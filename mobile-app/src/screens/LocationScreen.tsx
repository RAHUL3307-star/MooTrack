import React, { useState, useRef, useEffect, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BackHeader, Card, SectionLabel, RiskBadge, ReadAloudFAB } from "../components/ui";
import { useAnimals } from "../context/AnimalsContext";
import { useESP32 } from "../context/ESP32Context";
import { RISK_COLOR } from "../types/index";
import type { Animal, RiskLevel } from "../types/index";
import { t, sendWhatsAppAlert } from "../i18n/index";

// ── Farm Centroid & Geofence (Anand Dairy Research Station, Gujarat) ─────────
const FARM_CENTER = { lat: 22.5580, lng: 72.9520 };
const FARM_RADIUS_M = 220; // 220 meters virtual geofence

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
  rssi: number;        // dBm
  collarId: string;
}

// Initial realistic GPS offsets around Anand farm
const BASE_POSITIONS: Record<string, { dlat: number; dlng: number; zone: string }> = {
  "KA-001": { dlat:  0.00045, dlng:  0.00030, zone: "Milking Barn" },
  "KA-007": { dlat: -0.00035, dlng:  0.00085, zone: "East Pasture" },
  "GT-001": { dlat:  0.00090, dlng: -0.00050, zone: "North Paddock" },
  "GT-002": { dlat: -0.00065, dlng: -0.00095, zone: "West Water Trough" },
  "KA-014": { dlat:  0.00015, dlng:  0.00110, zone: "East Pasture" },
  "BF-001": { dlat:  0.00080, dlng:  0.00015, zone: "Shade Canopy" },
  "KA-022": { dlat: -0.00085, dlng:  0.00060, zone: "East Pasture" },
  "GT-003": { dlat:  0.00040, dlng: -0.00120, zone: "West Water Trough" },
  "KA-031": { dlat: -0.00020, dlng: -0.00040, zone: "Milking Barn" },
  "KA-052": { dlat:  0.00195, dlng:  0.00165, zone: "⚠️ Outside Fence" }, // Outside 220m
};

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

function getZoneName(dist: number, dlat: number, dlng: number): string {
  if (dist > FARM_RADIUS_M) return "⚠️ Outside Fence";
  if (dist < 45) return "Milking Barn";
  if (dlng > 0.0004) return "East Pasture";
  if (dlng < -0.0004) return "West Water Trough";
  if (dlat > 0.0004) return "North Paddock";
  return "Central Grazing";
}

function buildInitialGPS(animals: Animal[]): CowGPS[] {
  return animals.map((a, idx) => {
    const base = BASE_POSITIONS[a.id] || {
      dlat: ((idx * 7) % 15 - 7) * 0.00015,
      dlng: ((idx * 11) % 15 - 7) * 0.00015,
      zone: "East Pasture",
    };
    const lat = FARM_CENTER.lat + base.dlat;
    const lng = FARM_CENTER.lng + base.dlng;
    const dist = haversineM(FARM_CENTER.lat, FARM_CENTER.lng, lat, lng);
    const outside = dist > FARM_RADIUS_M;
    const signals: ("Strong" | "Good" | "Weak")[] = ["Strong", "Good", "Weak"];
    const sig = signals[idx % 3];
    return {
      id: a.id,
      lat,
      lng,
      speed: a.activity === "high" ? 3.4 : a.activity === "normal" ? 1.5 : 0.4,
      heading: (idx * 53 + 45) % 360,
      zone: outside ? "⚠️ Outside Fence" : getZoneName(dist, base.dlat, base.dlng),
      outsideGeofence: outside,
      lastUpdate: `${(idx % 3) + 1}m ago`,
      batteryPct: Math.max(54, 98 - (idx * 6) % 45),
      signal: sig,
      rssi: sig === "Strong" ? -65 - (idx % 8) : sig === "Good" ? -78 - (idx % 6) : -92,
      collarId: `GPS-${a.rfidTag ? a.rfidTag.slice(-6) : a.id}`,
    };
  });
}

function driftGPS(prev: CowGPS[], animals: Animal[]): CowGPS[] {
  return prev.map((cow) => {
    const animal = animals.find((a) => a.id === cow.id);
    const speedMult = animal?.activity === "high" ? 0.000025 : animal?.activity === "normal" ? 0.000012 : 0.000004;
    const angleDelta = (Math.random() - 0.5) * 35;
    const newHeading = (cow.heading + angleDelta + 360) % 360;
    const drift = speedMult * (0.6 + Math.random() * 0.8);
    const newLat = cow.lat + Math.cos((newHeading * Math.PI) / 180) * drift;
    const newLng = cow.lng + Math.sin((newHeading * Math.PI) / 180) * drift;
    const dist = haversineM(FARM_CENTER.lat, FARM_CENTER.lng, newLat, newLng);
    const outside = dist > FARM_RADIUS_M;
    return {
      ...cow,
      lat: newLat,
      lng: newLng,
      heading: newHeading,
      speed: Math.max(0.2, cow.speed + (Math.random() - 0.5) * 0.4),
      outsideGeofence: outside,
      zone: outside ? "⚠️ Outside Fence" : getZoneName(dist, newLat - FARM_CENTER.lat, newLng - FARM_CENTER.lng),
      lastUpdate: "Just now",
    };
  });
}

// ── Leaflet Interactive Map Component ─────────────────────────────────────────
function LeafletHerdMap({
  cowsGPS,
  animals,
  selectedId,
  onSelect,
  activeLayer,
  onSelectAnimal,
}: {
  cowsGPS: CowGPS[];
  animals: Animal[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeLayer: "satellite" | "voyager" | "dark" | "osm";
  onSelectAnimal?: (animal: Animal) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [FARM_CENTER.lat, FARM_CENTER.lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 14,
    });

    mapInstanceRef.current = map;

    // Zoom control in top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Farm Geofence and Zones Overlay Group
    const zonesGroup = L.layerGroup().addTo(map);
    geofenceLayerRef.current = zonesGroup;

    // 1. Virtual Geofence (220m circle with glowing dashed border)
    L.circle([FARM_CENTER.lat, FARM_CENTER.lng], {
      radius: FARM_RADIUS_M,
      color: "#22C55E",
      weight: 2.5,
      dashArray: "8, 6",
      fillColor: "#22C55E",
      fillOpacity: 0.07,
    }).bindTooltip("🛡️ Virtual Geofence Boundary (220m Perimeter)", { direction: "top", permanent: false }).addTo(zonesGroup);

    // 2. Milking Barn Zone (Polygon)
    L.polygon(
      [
        [FARM_CENTER.lat + 0.0006, FARM_CENTER.lng - 0.0003],
        [FARM_CENTER.lat + 0.0006, FARM_CENTER.lng + 0.0004],
        [FARM_CENTER.lat - 0.0002, FARM_CENTER.lng + 0.0004],
        [FARM_CENTER.lat - 0.0002, FARM_CENTER.lng - 0.0003],
      ],
      {
        color: "#F59E0B",
        weight: 1.8,
        dashArray: "4, 4",
        fillColor: "#F59E0B",
        fillOpacity: 0.2,
      }
    ).bindTooltip("🏠 Main Milking Barn & Stalls", { direction: "center", permanent: false }).addTo(zonesGroup);

    // 3. East Lush Grazing Pasture
    L.polygon(
      [
        [FARM_CENTER.lat + 0.0011, FARM_CENTER.lng + 0.0005],
        [FARM_CENTER.lat + 0.0011, FARM_CENTER.lng + 0.0016],
        [FARM_CENTER.lat - 0.0010, FARM_CENTER.lng + 0.0016],
        [FARM_CENTER.lat - 0.0010, FARM_CENTER.lng + 0.0005],
      ],
      {
        color: "#10B981",
        weight: 1.5,
        fillColor: "#10B981",
        fillOpacity: 0.15,
      }
    ).bindTooltip("🌾 East Clover Pasture", { direction: "center", permanent: false }).addTo(zonesGroup);

    // 4. West Water & Cooling Shade Zone
    L.circle([FARM_CENTER.lat - 0.0006, FARM_CENTER.lng - 0.0010], {
      radius: 52,
      color: "#38BDF8",
      weight: 1.5,
      fillColor: "#38BDF8",
      fillOpacity: 0.22,
    }).bindTooltip("💧 Water Trough & Shade Canopy", { direction: "center", permanent: false }).addTo(zonesGroup);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileConfigs = {
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        maxZoom: 19,
      },
      voyager: {
        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        maxZoom: 19,
      },
      dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        maxZoom: 19,
      },
      osm: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
      },
    };

    const config = tileConfigs[activeLayer];
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // Update Animal Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;

    cowsGPS.forEach((cow) => {
      const animal = animals.find((a) => a.id === cow.id);
      const risk = animal?.risk ?? "none";
      const isSelected = cow.id === selectedId;
      const isOutside = cow.outsideGeofence;

      const sp = animal?.species || (cow.id.startsWith("GT") ? "Goat" : cow.id.startsWith("BF") ? "Buffalo" : "Cow");
      const spIcon = sp === "Goat" ? "🐐" : sp === "Buffalo" ? "🐃" : "🐄";

      // Color scheme based on risk & breach
      const borderColor = isOutside ? "#EF4444" : risk === "high" ? "#EF4444" : risk === "moderate" ? "#F59E0B" : "#22C55E";
      const glowColor = isOutside ? "rgba(239, 68, 68, 0.6)" : risk === "high" ? "rgba(239, 68, 68, 0.5)" : risk === "moderate" ? "rgba(245, 158, 11, 0.4)" : "rgba(34, 197, 94, 0.35)";
      const sonarClass = isOutside || risk === "high" ? "sonar-danger" : risk === "moderate" ? "sonar-warning" : "sonar-safe";

      // Custom high-tech DivIcon
      const iconHtml = `
        <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <!-- Sonar pulse ring -->
          <div class="${sonarClass}"></div>

          <!-- Selection indicator halo -->
          ${
            isSelected
              ? `<div style="position: absolute; inset: -4px; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 16px ${glowColor}; animation: pulseGlowRing 1.5s infinite;"></div>`
              : ""
          }

          <!-- Central Badge -->
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #152217;
            border: 2px solid ${borderColor};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.45);
            position: relative;
            z-index: 2;
          ">
            <span style="font-size: 17px;">${spIcon}</span>

            <!-- Heading arrow needle -->
            <div style="
              position: absolute;
              top: -3px;
              left: 50%;
              transform: translateX(-50%) rotate(${cow.heading}deg);
              transform-origin: center 21px;
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-bottom: 7px solid ${borderColor};
              pointer-events: none;
            "></div>
          </div>

          <!-- Mini Ear Tag Name Badge -->
          <div style="
            position: absolute;
            bottom: -16px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 16, 0.9);
            color: #FFFFFF;
            font-size: 8.5px;
            font-weight: 700;
            padding: 1.5px 5px;
            border-radius: 6px;
            border: 1px solid ${borderColor};
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            letter-spacing: 0.02em;
            z-index: 3;
          ">
            ${animal?.name.split(" ")[0] || cow.id}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-cow-marker",
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -22],
      });

      if (currentMarkers[cow.id]) {
        // Smoothly animate marker position
        currentMarkers[cow.id].setLatLng([cow.lat, cow.lng]);
        currentMarkers[cow.id].setIcon(customIcon);
      } else {
        const marker = L.marker([cow.lat, cow.lng], { icon: customIcon }).addTo(map);

        marker.on("click", () => {
          onSelect(cow.id);
        });

        // Popup Content
        const popupContent = document.createElement("div");
        popupContent.style.minWidth = "180px";
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 20px;">${spIcon}</span>
            <div>
              <strong style="font-size: 13px; color: #86EFAC;">${animal?.name || cow.id}</strong>
              <div style="font-size: 10px; color: #CBD5E1;">${cow.collarId} · ${cow.zone}</div>
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.35); border-radius: 8px; padding: 6px 8px; font-size: 10.5px; line-height: 1.45; margin-bottom: 8px; color: #F1F5F9;">
            <div>⚡ Speed: <strong>${cow.speed.toFixed(1)} m/min</strong> · 🧭 <strong>${Math.round(cow.heading)}°</strong></div>
            <div>🔋 Battery: <strong>${cow.batteryPct}%</strong> · 📶 <strong>${cow.signal} (${cow.rssi} dBm)</strong></div>
            <div>🩺 Status: <strong style="color: ${borderColor};">${isOutside ? "BREACH ALERT" : (animal?.risk?.toUpperCase() ?? "HEALTHY")}</strong></div>
          </div>
        `;

        if (onSelectAnimal && animal) {
          const btn = document.createElement("button");
          btn.innerText = "View Animal Profile →";
          btn.style.cssText = "width: 100%; background: #22C55E; color: #052E16; border: none; border-radius: 6px; padding: 6px 8px; font-size: 11px; font-weight: 800; cursor: pointer;";
          btn.onclick = () => onSelectAnimal(animal);
          popupContent.appendChild(btn);
        }

        marker.bindPopup(popupContent, { offset: [0, -18] });
        currentMarkers[cow.id] = marker;
      }
    });
  }, [cowsGPS, animals, selectedId, onSelect, onSelectAnimal]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 360,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
      }}
    />
  );
}

// ── Main Location & GIS Tracking Screen ────────────────────────────────────────
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
  const [filterZone, setFilterZone] = useState<"All" | "Barn" | "East Pasture" | "Water" | "Breach">("All");
  const [liveTracking, setLiveTracking] = useState(true);
  const [mapLayer, setMapLayer] = useState<"satellite" | "voyager" | "dark" | "osm">("satellite");
  const [collarBuzzerActive, setCollarBuzzerActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Periodic GPS drift simulation
  useEffect(() => {
    if (!liveTracking) return;
    const interval = setInterval(() => {
      setCowsGPS((prev) => driftGPS(prev, animals));
    }, 3200);
    return () => clearInterval(interval);
  }, [liveTracking, animals]);

  const outsideCount = cowsGPS.filter((c) => c.outsideGeofence).length;
  const inBarnCount = cowsGPS.filter((c) => c.zone === "Milking Barn").length;
  const activeMovingCount = cowsGPS.filter((c) => c.speed > 1.2).length;
  const avgBattery = Math.round(cowsGPS.reduce((s, c) => s + c.batteryPct, 0) / (cowsGPS.length || 1));

  const selectedCow = cowsGPS.find((c) => c.id === selectedId) || cowsGPS[0];
  const selectedAnimal = animals.find((a) => a.id === (selectedCow?.id || selectedId));

  const triggerCollarBuzzer = () => {
    setCollarBuzzerActive(true);
    setToastMessage(`🔊 LoRa Command Sent: GPS Collar ${selectedCow?.collarId} Buzzer & High-Intensity LED Activated!`);
    setTimeout(() => {
      setCollarBuzzerActive(false);
      setTimeout(() => setToastMessage(null), 3000);
    }, 2500);
  };

  const handleWhatsAppAlert = () => {
    if (!selectedAnimal || !selectedCow) return;
    const msg = `🚨 *MooTracker GPS Alert* 🚨\n*Animal:* ${selectedAnimal.name} (${selectedAnimal.id})\n*Zone:* ${selectedCow.zone}\n*Coordinates:* ${selectedCow.lat.toFixed(6)}°N, ${selectedCow.lng.toFixed(6)}°E\n*Geofence Status:* ${selectedCow.outsideGeofence ? "⚠️ OUTSIDE BOUNDARY" : "Safe"}\n*Speed:* ${selectedCow.speed.toFixed(1)} m/min\n*Battery:* ${selectedCow.batteryPct}%`;
    sendWhatsAppAlert(msg);
  };

  // Filtered cow list for the bottom horizontal strip
  const filteredCows = cowsGPS.filter((c) => {
    if (filterZone === "Breach") return c.outsideGeofence;
    if (filterZone === "Barn") return c.zone === "Milking Barn";
    if (filterZone === "East Pasture") return c.zone === "East Pasture";
    if (filterZone === "Water") return c.zone === "West Water Trough";
    return true;
  });

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

      {/* Top Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E0D8" }}>
        <BackHeader
          title={
            lang === "Tamil" ? "📍 கால்நடை வரைபடம் & GPS"
            : lang === "Hindi" ? "📍 लाइव फार्म मैप व GPS ट्रैकिंग"
            : "📍 Live GPS & Pasture Geofence"
          }
          onBack={onBack}
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: isLive ? "#DCFCE7" : "#F0FDF4",
                  color: "#166534",
                  border: "1px solid #86EFAC",
                  padding: "3px 8px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulse-dot 1.5s infinite" }} />
                RTK GPS
              </span>
            </div>
          }
        />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 14px 80px" }}>

        {/* ── Toast Notification Banner ─────────────────────────────── */}
        {toastMessage && (
          <div
            style={{
              background: "linear-gradient(135deg, #1C3E26, #0F2516)",
              color: "#86EFAC",
              border: "1.5px solid #22C55E",
              borderRadius: 12,
              padding: "10px 14px",
              marginBottom: 10,
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "slideDownPop 0.3s ease",
            }}
          >
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── Top Alert Banner (Geofence Breach) ───────────────────── */}
        {outsideCount > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #B83220 0%, #7F1D1D 100%)",
              borderRadius: 14,
              padding: "12px 14px",
              color: "#FFFFFF",
              marginBottom: 12,
              boxShadow: "0 4px 16px rgba(184,50,32,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.02em" }}>
                  {outsideCount} {outsideCount === 1 ? "Animal" : "Animals"} Outside Geofence!
                </div>
                <div style={{ fontSize: 11, color: "#FEE2E2", marginTop: 2 }}>
                  {lang === "Tamil"
                    ? "மாடு பண்ணை எல்லையை கடந்துள்ளது. வரைபடத்தில் இருப்பிடத்தை பார்க்கவும்."
                    : "Cattle breached 220m perimeter fence. Real-time GPS coordinates broadcasting."}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const breached = cowsGPS.find((c) => c.outsideGeofence);
                if (breached) setSelectedId(breached.id);
                setFilterZone("Breach");
              }}
              style={{
                background: "#FFFFFF",
                color: "#991B1B",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Locate →
            </button>
          </div>
        )}

        {/* ── Executive KPI Telemetry Strip ───────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {[
            { label: "Tracked", value: `${cowsGPS.length} Active`, icon: "🛰️", color: "#2A5C1F", sub: "LoRa Collar" },
            { label: "Fence", value: outsideCount > 0 ? `${outsideCount} Breach` : "All Safe", icon: "🛡️", color: outsideCount > 0 ? "#B83220" : "#2E7D32", sub: "220m Radius" },
            { label: "In Barn", value: `${inBarnCount} Heads`, icon: "🏠", color: "#1D4ED8", sub: "Milking/Feed" },
            { label: "Battery", value: `${avgBattery}%`, icon: "🔋", color: avgBattery > 70 ? "#2A5C1F" : "#C47A10", sub: "Avg Level" },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                border: "1.5px solid #E5E0D8",
                padding: "8px 6px",
                textAlign: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 16 }}>{k.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: k.color, marginTop: 2 }}>{k.value}</div>
              <div style={{ fontSize: 9, color: "#8A7A6A", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Map Controls & Layer Selector Bar ───────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {/* Layer switcher */}
          <div style={{ display: "flex", gap: 4, background: "#EAE5DB", padding: 3, borderRadius: 20 }}>
            {(
              [
                { id: "satellite", label: "🛰️ Satellite" },
                { id: "voyager", label: "🗺️ Clean" },
                { id: "dark", label: "🌙 Tactical" },
                { id: "osm", label: "🌾 Topo" },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                onClick={() => setMapLayer(l.id)}
                style={{
                  background: mapLayer === l.id ? "#2A5C1F" : "transparent",
                  color: mapLayer === l.id ? "#FFFFFF" : "#556447",
                  border: "none",
                  borderRadius: 16,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Live stream status toggle */}
          <button
            onClick={() => setLiveTracking((v) => !v)}
            style={{
              background: liveTracking ? "#052E16" : "#F0EDE6",
              color: liveTracking ? "#4ADE80" : "#6B7A5C",
              border: `1.5px solid ${liveTracking ? "#22C55E" : "#D0CAC0"}`,
              borderRadius: 20,
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: liveTracking ? "#22C55E" : "#94A3B8",
                animation: liveTracking ? "pulse-dot 1.2s infinite" : "none",
              }}
            />
            {liveTracking ? "LIVE STREAM" : "PAUSED"}
          </button>
        </div>

        {/* ── High-Resolution Leaflet Interactive Map ─────────────── */}
        <div
          style={{
            height: 380,
            borderRadius: 16,
            overflow: "hidden",
            border: "1.5px solid #D5CEBF",
            boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
            marginBottom: 12,
            position: "relative",
          }}
        >
          <LeafletHerdMap
            cowsGPS={cowsGPS}
            animals={animals}
            selectedId={selectedId}
            onSelect={setSelectedId}
            activeLayer={mapLayer}
            onSelectAnimal={onSelectAnimal}
          />

          {/* Map Compass & Quick Legend Overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              background: "rgba(17, 27, 19, 0.88)",
              backdropFilter: "blur(8px)",
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid rgba(134,239,172,0.3)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              zIndex: 1000,
              fontSize: 9.5,
              color: "#E2E8F0",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E" }} /> Normal
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} /> Warning
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} /> Critical / Breach
            </span>
          </div>
        </div>

        {/* ── Cattle Quick Selection Carousel ──────────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <SectionLabel>{lang === "Tamil" ? "கால்நடைகள் பட்டியல்" : "Tracked Cattle Herd"}</SectionLabel>
            <div style={{ display: "flex", gap: 4 }}>
              {(["All", "Breach", "Barn", "East Pasture", "Water"] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setFilterZone(z)}
                  style={{
                    background: filterZone === z ? "#2A5C1F" : "#FFFFFF",
                    color: filterZone === z ? "#FFFFFF" : "#556447",
                    border: `1px solid ${filterZone === z ? "#2A5C1F" : "#D0CAC0"}`,
                    borderRadius: 12,
                    padding: "2px 8px",
                    fontSize: 9.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {z === "Breach" ? "🚨 Breach" : z}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {filteredCows.map((c) => {
              const animal = animals.find((a) => a.id === c.id);
              const isSelected = c.id === selectedId;
              const isOutside = c.outsideGeofence;
              const sp = animal?.species || (c.id.startsWith("GT") ? "Goat" : c.id.startsWith("BF") ? "Buffalo" : "Cow");
              const spIcon = sp === "Goat" ? "🐐" : sp === "Buffalo" ? "🐃" : "🐄";

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    flexShrink: 0,
                    minWidth: 128,
                    background: isSelected ? "linear-gradient(135deg, #1C3E26, #0F2516)" : "#FFFFFF",
                    color: isSelected ? "#FFFFFF" : "#1C2714",
                    border: isOutside
                      ? "2px solid #EF4444"
                      : isSelected
                      ? "2px solid #22C55E"
                      : "1.5px solid #E0DAD0",
                    borderRadius: 14,
                    padding: "10px 10px",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 4px 14px rgba(28,62,38,0.25)" : "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{spIcon}</span>
                    <span
                      style={{
                        fontSize: 8.5,
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: 6,
                        background: isOutside ? "#EF4444" : isSelected ? "#22C55E" : "#E2E8F0",
                        color: isOutside || isSelected ? "#FFFFFF" : "#334155",
                      }}
                    >
                      {isOutside ? "BREACH" : c.zone.split(" ")[0]}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 12 }}>{animal?.name || c.id}</div>
                  <div style={{ fontSize: 10, color: isSelected ? "#86EFAC" : "#6B7A5C", marginTop: 2 }}>
                    {c.collarId} · 🔋 {c.batteryPct}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected Animal Real-Time Inspection Sheet ──────────── */}
        {selectedCow && selectedAnimal && (
          <div
            style={{
              background: "linear-gradient(135deg, #182A1B 0%, #0D1910 100%)",
              borderRadius: 18,
              padding: "16px 18px",
              color: "#FFFFFF",
              marginBottom: 14,
              boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
              border: "1.5px solid #366B38",
              position: "relative",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  {selectedAnimal.species === "Goat" ? "🐐" : selectedAnimal.species === "Buffalo" ? "🐃" : "🐄"}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedAnimal.name}</div>
                  <div style={{ fontSize: 11, color: "#86EFAC", fontWeight: 600 }}>
                    {selectedAnimal.id} · {selectedCow.collarId} · {selectedAnimal.breed}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    background: selectedCow.outsideGeofence ? "#EF4444" : "#22C55E",
                    color: "#FFFFFF",
                    borderRadius: 12,
                    padding: "3px 10px",
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    display: "inline-block",
                    boxShadow: selectedCow.outsideGeofence ? "0 0 10px rgba(239,68,68,0.5)" : "none",
                  }}
                >
                  {selectedCow.outsideGeofence ? "⚠️ Geofence Breach" : `✅ ${selectedCow.zone}`}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>
                  GPS Updated {selectedCow.lastUpdate}
                </div>
              </div>
            </div>

            {/* GPS Precise Coordinates Tag */}
            <div
              style={{
                background: "rgba(0,0,0,0.35)",
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid rgba(134,239,172,0.2)",
              }}
            >
              <div>
                <div style={{ fontSize: 9, color: "#86EFAC", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  HIGH-PRECISION GNSS COORDINATES
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 700, color: "#FFFFFF", marginTop: 2 }}>
                  {selectedCow.lat.toFixed(6)}° N, {selectedCow.lng.toFixed(6)}° E
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${selectedCow.lat.toFixed(6)}, ${selectedCow.lng.toFixed(6)}`);
                  setToastMessage("📋 GPS Coordinates Copied to Clipboard!");
                  setTimeout(() => setToastMessage(null), 2500);
                }}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Copy 📍
              </button>
            </div>

            {/* Live Kinematics & Collar Telemetry Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: 6,
                marginBottom: 14,
              }}
            >
              {[
                { label: "Pace / Speed", value: `${selectedCow.speed.toFixed(1)} m/min`, icon: "⚡" },
                { label: "Orientation", value: `${Math.round(selectedCow.heading)}° Compass`, icon: "🧭" },
                { label: "Battery", value: `${selectedCow.batteryPct}% LiPo`, icon: "🔋" },
                { label: "LoRa RSSI", value: `${selectedCow.rssi} dBm`, icon: "📶" },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "8px 6px",
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ fontSize: 15 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, marginTop: 2 }}>{m.value}</div>
                  <div style={{ fontSize: 8.5, color: "#86EFAC", textTransform: "uppercase", marginTop: 1 }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons: Ping Collar Buzzer / WhatsApp / Profile */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <button
                onClick={triggerCollarBuzzer}
                disabled={collarBuzzerActive}
                style={{
                  background: collarBuzzerActive ? "#EF4444" : "rgba(255,255,255,0.15)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 10,
                  padding: "10px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
              >
                <span>{collarBuzzerActive ? "🔊" : "🔔"}</span>
                <span>{collarBuzzerActive ? "Beacon Active..." : "Ping Collar Buzzer"}</span>
              </button>

              <button
                onClick={handleWhatsAppAlert}
                style={{
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(37,211,102,0.3)",
                }}
              >
                <span>💬</span>
                <span>WhatsApp Vet Loc</span>
              </button>
            </div>

            {onSelectAnimal && (
              <button
                onClick={() => onSelectAnimal(selectedAnimal)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #22C55E, #16A34A)",
                  color: "#052E16",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(34,197,94,0.3)",
                }}
              >
                <span>🐄 View Full Animal Health Profile →</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
