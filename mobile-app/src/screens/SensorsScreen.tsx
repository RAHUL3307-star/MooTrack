import React, { useState, useEffect, useRef } from "react";
import { StatusBar, BackHeader, Card, SectionLabel, ReadAloudFAB, RiskBadge } from "../components/ui";
import { useESP32 } from "../context/ESP32Context";
import { useAnimals } from "../context/AnimalsContext";
import { computeMilkRisk } from "../types/esp32";
import type { MLPredictionSummary } from "../types/esp32";
import type { Screen } from "../types/index";
import { t } from "../i18n/index";
import { predictFromTelemetry, getMLServerStatus } from "../services/mlApiService";
import type { MLServerStatus } from "../services/mlApiService";

export function SensorsScreen({
  onBack,
  onNavigate,
  lang,
}: {
  onBack: () => void;
  onNavigate?: (s: Screen) => void;
  lang: string;
}) {
  const { isLive, deviceId, lastTelemetry, connectUsbSerial, toggleEsp32 } = useESP32();
  const { animals, setSelectedAnimal } = useAnimals();
  const [showSketch, setShowSketch] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Enhanced ML prediction (FastAPI → on-device fallback) ────────────────
  const [mlSummary, setMlSummary] = useState<MLPredictionSummary | null>(null);
  const [mlSource, setMlSource] = useState<"fastapi" | "ondevice">("ondevice");
  const [leadTimeDays, setLeadTimeDays] = useState<number | null>(null);
  const [clinicalAdvisory, setClinicalAdvisory] = useState<string[]>([]);
  const [serverStatus, setServerStatus] = useState<MLServerStatus | null>(null);
  const lastTelemetryRef = useRef<string>("");

  // Check server status once on mount
  useEffect(() => {
    getMLServerStatus().then(setServerStatus);
  }, []);

  // Run prediction whenever live telemetry changes
  useEffect(() => {
    if (!isLive || !lastTelemetry) {
      setMlSummary(null);
      return;
    }
    // Debounce: only re-run if telemetry actually changed
    const key = `${lastTelemetry.conductivity}-${lastTelemetry.temp}-${lastTelemetry.ph}`;
    if (key === lastTelemetryRef.current) return;
    lastTelemetryRef.current = key;

    predictFromTelemetry(lastTelemetry).then(({ summary, source, leadTimeDays: ld, clinicalAdvisory: ca }) => {
      setMlSummary(summary);
      setMlSource(source);
      setLeadTimeDays(ld);
      setClinicalAdvisory(ca);
    });
  }, [isLive, lastTelemetry]);

  const [activeAnimalId, setActiveAnimalId] = useState<string>(
    animals[0]?.id || "KA-001"
  );

  const matchedAnimal = isLive && lastTelemetry
    ? (animals.find((a) => (lastTelemetry.rfidTag && a.rfidTag === lastTelemetry.rfidTag) || a.id === lastTelemetry.cowId) || animals[0])
    : (animals.find((a) => a.id === activeAnimalId) || animals[0]);

  const targetAnimal = matchedAnimal || animals[0];
  const species = targetAnimal?.species || (targetAnimal?.id.startsWith("GT") ? "Goat" : targetAnimal?.id.startsWith("BF") ? "Buffalo" : "Cow");
  const speciesIcon = species === "Goat" ? "🐐" : species === "Buffalo" ? "🐃" : "🐄";

  const effectiveSCC = isLive && lastTelemetry?.scc != null
    ? lastTelemetry.scc
    : (isLive && lastTelemetry
      ? (computeMilkRisk(lastTelemetry).risk === "high" ? 1850000 : computeMilkRisk(lastTelemetry).risk === "moderate" ? 420000 : (species === "Goat" ? 450000 : 85000))
      : (targetAnimal?.scc || (species === "Goat" ? 450000 : 185000)));

  const sccCriticalLimit = species === "Goat" ? 1500000 : 500000;
  const sccElevatedLimit = species === "Goat" ? 750000 : 200000;
  const ambientT = targetAnimal?.ambientTemp || 28.5;
  const shedHum = isLive && lastTelemetry?.humidity != null ? lastTelemetry.humidity : (targetAnimal?.humidity || 68);
  // Temperature-Humidity Index (THI): THI = (1.8 × T + 32) - (0.55 - 0.0055 × RH) × (1.8 × T - 26)
  const thi = Math.round((1.8 * ambientT + 32) - (0.55 - 0.0055 * shedHum) * (1.8 * ambientT - 26));
  const thiStatus = thi >= 79 ? "High Stress 🚨" : thi >= 72 ? "Mild Stress ⚠️" : "Comfortable ✅";
  const thiColor = thi >= 79 ? "#B83220" : thi >= 72 ? "#C47A10" : "#2A5C1F";

  const ruminationMins = targetAnimal?.rumination || (targetAnimal?.risk === "high" ? 210 : targetAnimal?.risk === "moderate" ? 285 : 420);
  const feedingMins = targetAnimal?.feeding || (targetAnimal?.risk === "high" ? 130 : targetAnimal?.risk === "moderate" ? 185 : 240);

  const readings = [
    {
      label: lang === "Tamil" ? "சோமாடிக் செல் எண்ணிக்கை (SCC)" : lang === "Hindi" ? "सोमैटिक सेल काउंट (SCC)" : "Somatic Cell Count (SCC)",
      value: `${(effectiveSCC / 1000).toFixed(0)}k cells/mL`,
      status: effectiveSCC > sccCriticalLimit ? "Critical 🚨" : effectiveSCC > sccElevatedLimit ? "Elevated ⚠️" : "Normal ✅",
      icon: "🔬",
      color: effectiveSCC > sccCriticalLimit ? "#B83220" : effectiveSCC > sccElevatedLimit ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "பால் pH" : "Milk pH (GPIO 34)",
      value: isLive && lastTelemetry?.ph != null ? `${lastTelemetry.ph.toFixed(2)}` : `${targetAnimal?.ph || 6.7}`,
      status: isLive && lastTelemetry?.ph != null
        ? (lastTelemetry.ph < 6.3 || lastTelemetry.ph > 7.0 ? "Abnormal" : "Normal")
        : "Normal",
      icon: "🧪",
      color: isLive && lastTelemetry?.ph != null && (lastTelemetry.ph < 6.3 || lastTelemetry.ph > 7.0) ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "பால் EC (கடத்துதிறன்)" : "Milk EC (GPIO 35)",
      value: isLive && lastTelemetry ? `${lastTelemetry.conductivity.toFixed(1)} mS/cm` : `${targetAnimal?.conductivity || 5.0} mS/cm`,
      status: isLive && lastTelemetry && lastTelemetry.conductivity > 10 ? "High ⚠️" : (targetAnimal?.conductivity || 5) > 8 ? "High ⚠️" : "Normal",
      icon: "⚡",
      color: isLive && lastTelemetry && lastTelemetry.conductivity > 10 ? "#B83220" : (targetAnimal?.conductivity || 5) > 8 ? "#B83220" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "பால் வெப்பநிலை (DS18B20)" : "Milk Temp DS18B20 (GPIO 4)",
      value: isLive && lastTelemetry ? `${lastTelemetry.temp}°C` : `${targetAnimal?.temp || 38.5}°C`,
      status: (isLive && lastTelemetry ? lastTelemetry.temp : (targetAnimal?.temp || 38.5)) > 39.2 ? "Elevated ⚠️" : "Normal",
      icon: "🌡",
      color: (isLive && lastTelemetry ? lastTelemetry.temp : (targetAnimal?.temp || 38.5)) > 39.2 ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "அசைபோடுதல் நேரம்" : "Rumination (IoT Collar)",
      value: `${ruminationMins} min/day`,
      status: ruminationMins < 250 ? "Severely Low 🚨" : ruminationMins < 350 ? "Reduced ⚠️" : "Healthy ✅",
      icon: "🫁",
      color: ruminationMins < 250 ? "#B83220" : ruminationMins < 350 ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "உணவு உட்கொள்ளல்" : "Feeding Duration (IoT)",
      value: `${feedingMins} min/day`,
      status: feedingMins < 150 ? "Reduced ⚠️" : "Normal ✅",
      icon: "🌾",
      color: feedingMins < 150 ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "எடை (HX711 Load Cell)" : "Milk Weight HX711 (GPIO 32/33)",
      value: isLive && lastTelemetry?.weight != null ? `${lastTelemetry.weight.toFixed(1)} kg` : `${targetAnimal?.milk || (species === "Goat" ? 2.5 : 12.0)} kg`,
      status: "Live",
      icon: "⚖️",
      color: "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "கொட்டகை சூழல் (THI)" : `Shed Ambient & THI (${ambientT}°C)`,
      value: `THI ${thi} (${thiStatus})`,
      status: thiStatus,
      icon: "🌤",
      color: thiColor,
    },
    {
      label: lang === "Tamil" ? "கொட்டகை ஈரப்பதம் (DHT22)" : "Shed Humidity DHT22 (GPIO 27)",
      value: `${shedHum}%`,
      status: shedHum > 80 ? "High" : "Normal",
      icon: "💧",
      color: shedHum > 80 ? "#B83220" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "செயல்பாட்டு அளவீடு (MPU6050)" : "Activity MPU6050 (GPIO 21/22)",
      value: isLive && lastTelemetry?.activity != null ? `${lastTelemetry.activity}%` : `${targetAnimal?.activity === "low" ? "32%" : "78%"}`,
      status: (isLive && lastTelemetry?.activity != null ? lastTelemetry.activity < 30 : targetAnimal?.activity === "low") ? "Low ⚠️" : "Normal",
      icon: "📐",
      color: (isLive && lastTelemetry?.activity != null ? lastTelemetry.activity < 30 : targetAnimal?.activity === "low") ? "#C47A10" : "#2A5C1F",
    },
  ];

  const arduinoSketch = `// ═══════════════════════════════════════════════════════════
// MooTracker ESP32 DevKit V1 — Full Hardware Firmware
// Pin Mapping (as provided):
//   RC522 RFID : SDA→5, SCK→18, MOSI→23, MISO→19, RST→2
//   MPU6050    : SDA→21, SCL→22
//   DS18B20    : Data→4  (4.7kΩ pull-up to 3.3V)
//   DHT22      : Data→27
//   HX711      : DOUT→32, SCK→33
//   pH module  : AO→34 (ADC1, voltage divider to 3.3V)
//   EC module  : AO→35 (ADC1, voltage divider to 3.3V)
// ═══════════════════════════════════════════════════════════
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include "HX711.h"

// ── WiFi & Server ──────────────────────────────────────────
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_PC_IP:3000/api/esp32/telemetry";

// ── RC522 RFID (SPI) ───────────────────────────────────────
#define RFID_SS_PIN  5
#define RFID_RST_PIN 2
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
String currentRfidTag = "";

// ── MPU6050 (I2C on SDA=21, SCL=22) ──────────────────────
MPU6050 mpu;

// ── DS18B20 (GPIO 4) ──────────────────────────────────────
#define DS18B20_PIN 4
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

// ── DHT22 (GPIO 27) ───────────────────────────────────────
#define DHT_PIN  27
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// ── HX711 Load Cell (DOUT=32, SCK=33) ────────────────────
#define HX711_DOUT 32
#define HX711_SCK  33
HX711 scale;

// ── Analog pH → GPIO 34, EC → GPIO 35 ────────────────────
#define PH_PIN  34
#define EC_PIN  35
// Convert ADC reading (0–4095) to voltage (0–3.3V via divider)
float adcToVoltage(int raw) { return raw * 3.3f / 4095.0f; }
// Approximate calibrations — adjust slope/intercept per your probe
float voltageToPH(float v)  { return 7.0f + (2.5f - v) / 0.18f; }
float voltageToEC(float v)  { return v * 2.8f; }  // mS/cm approx

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  Wire.begin(21, 22);
  mpu.initialize();
  ds18b20.begin();
  dht.begin();
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(2280.f);  // calibrate this value
  scale.tare();
  analogReadResolution(12);

  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nWiFi OK! IP: " + WiFi.localIP().toString());
}

void loop() {
  // ── 1. RFID scan ──────────────────────────────────────────
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    currentRfidTag = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) currentRfidTag += "0";
      currentRfidTag += String(rfid.uid.uidByte[i], HEX);
    }
    currentRfidTag.toUpperCase();
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    Serial.println("{\\"event\\":\\"rfid\\",\\"rfid\\":\\"" + currentRfidTag + "\\"}");
  }

  // ── 2. Sensor readings ────────────────────────────────────
  ds18b20.requestTemperatures();
  float milkTemp   = ds18b20.getTempCByIndex(0);
  float shedHumidity = dht.readHumidity();
  float shedTemp   = dht.readTemperature();
  float weightKg   = scale.get_units(5);

  int   phRaw  = analogRead(PH_PIN);
  int   ecRaw  = analogRead(EC_PIN);
  float phVal  = voltageToPH(adcToVoltage(phRaw));
  float ecVal  = voltageToEC(adcToVoltage(ecRaw));

  // MPU6050 activity index (magnitude of acceleration vector)
  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  float accelMag = sqrt(sq(ax/16384.0f) + sq(ay/16384.0f) + sq(az/16384.0f));
  int   activity = constrain((int)((accelMag - 1.0f) * 100), 0, 100);

  // ── 3. Serial JSON (USB Web Serial connection) ────────────
  StaticJsonDocument<256> doc;
  doc["cowId"]    = currentRfidTag.length() > 0 ? currentRfidTag : "KA-001";
  doc["rfid"]     = currentRfidTag;
  doc["temp"]     = milkTemp;
  doc["ph"]       = phVal;
  doc["ec"]       = ecVal;
  doc["weight"]   = weightKg;
  doc["shedTemp"] = shedTemp;
  doc["humidity"] = shedHumidity;
  doc["activity"] = activity;
  doc["rssi"]     = WiFi.RSSI();
  serializeJson(doc, Serial);
  Serial.println();

  // ── 4. HTTP POST to MooTracker LAN server ─────────────────
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload;
    serializeJson(doc, payload);
    int code = http.POST(payload);
    Serial.println("HTTP " + String(code));
    http.end();
  }
  delay(2000);
}`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#F7F4EE", position: "relative" }}>
      <ReadAloudFAB screen="sensors" lang={lang} />
      <div style={{ background: "#FFFFFF" }}>
        <BackHeader title={t("sensors_title", lang)} onBack={onBack} />
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Animal Selector Pill Bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
          {animals.map((a) => {
            const isSel = a.id === targetAnimal.id;
            const spIcon = a.species === "Goat" ? "🐐" : a.species === "Buffalo" ? "🐃" : "🐄";
            return (
              <button
                key={a.id}
                onClick={() => setActiveAnimalId(a.id)}
                style={{
                  background: isSel ? "#2A5C1F" : "#FFFFFF",
                  color: isSel ? "#FFFFFF" : "#4A5A38",
                  border: `1.5px solid ${isSel ? "#2A5C1F" : "#D8D2C6"}`,
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  boxShadow: isSel ? "0 2px 6px rgba(42,92,31,0.25)" : "none",
                }}
              >
                <span>{spIcon}</span>
                <span>{a.name.split(" ")[0]} ({a.id})</span>
                {a.risk === "high" && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Real ESP32 Hardware Integration Card */}
        <Card
          style={{
            marginBottom: 14,
            background: isLive ? "linear-gradient(135deg, #0F2D1A 0%, #06180D 100%)" : "#FFFFFF",
            border: isLive ? "2px solid #22C55E" : "1px solid #E0DAD0",
            color: isLive ? "#FFFFFF" : "#1C2714",
            boxShadow: isLive ? "0 8px 24px rgba(34,197,94,0.25)" : "none",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: isLive ? "#22C55E" : "#94A3B8",
                  boxShadow: isLive ? "0 0 10px #22C55E" : "none",
                }}
              />
              <strong style={{ fontSize: 13, color: isLive ? "#FFFFFF" : "#1C2714" }}>
                {isLive ? "🟢 Real ESP32 is Live & Streaming" : "⚪ Real ESP32 Hardware Hub"}
              </strong>
            </div>
            <span
              style={{
                fontSize: 10,
                background: isLive ? "rgba(34,197,94,0.2)" : "#F1F5F9",
                color: isLive ? "#4ADE80" : "#64748B",
                border: `1px solid ${isLive ? "rgba(34,197,94,0.4)" : "#CBD5E1"}`,
                borderRadius: 6,
                padding: "2px 6px",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono'",
              }}
            >
              115200 BAUD
            </span>
          </div>

          <div style={{ fontSize: 11, color: isLive ? "#CBD5E1" : "#6B7A5C", marginBottom: 10, lineHeight: 1.4 }}>
            {isLive ? (
              <>
                Live hardware stream active from <strong>{deviceId || "ESP32-WROOM32"}</strong>. Monitored Cow:{" "}
                <strong style={{ color: "#FCD34D" }}>{lastTelemetry?.cowId || targetAnimal.name}</strong>. Telemetry updating
                in real-time via SSE.
              </>
            ) : (
              <>
                Inspecting telemetry for <strong style={{ color: "#2A5C1F" }}>{speciesIcon} {targetAnimal.name} ({targetAnimal.id})</strong>.
                Connect your physical ESP32 microcontroller via USB cable (Web Serial) or WiFi telemetry stream for live hardware feed.
              </>
            )}
          </div>

          {/* Udder Telemetry (4 Quarters for Cows/Buffaloes vs 2 Halves for Goats) */}
          <div
            style={{
              background: isLive ? "rgba(255,255,255,0.08)" : "#FBF9F4",
              borderRadius: 12,
              padding: "10px 12px",
              marginBottom: 12,
              border: isLive ? "1px solid rgba(255,255,255,0.12)" : "1px solid #ECE7DE",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isLive ? "#86EFAC" : "#2A5C1F", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {speciesIcon} {species === "Goat" ? "2-Half Udder EC & Symmetry" : "4-Quarter Udder EC & Symmetry"} ({targetAnimal.name})
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 700,
                  background: targetAnimal.risk === "high" ? "#EF4444" : targetAnimal.risk === "moderate" ? "#F59E0B" : "#22C55E",
                  color: "#FFFFFF",
                }}
              >
                {targetAnimal.quarter || "All Clear"}
              </span>
            </div>

            {species === "Goat" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div style={{ background: isLive ? "rgba(0,0,0,0.25)" : "#FFFFFF", padding: "6px 8px", borderRadius: 8, border: "1px solid #ECE7DE" }}>
                  <div style={{ fontSize: 9, color: isLive ? "#94A3B8" : "#8A7356" }}>Left Half</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: targetAnimal.quarter?.includes("Left") ? "#B83220" : isLive ? "#F8FAFC" : "#1C2714" }}>
                    {(targetAnimal.conductivity || 5.1).toFixed(1)} <span style={{ fontSize: 9, color: "#8A7356" }}>mS/cm</span>
                  </div>
                </div>
                <div style={{ background: isLive ? "rgba(0,0,0,0.25)" : "#FFFFFF", padding: "6px 8px", borderRadius: 8, border: "1px solid #ECE7DE" }}>
                  <div style={{ fontSize: 9, color: isLive ? "#94A3B8" : "#8A7356" }}>Right Half</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: targetAnimal.quarter?.includes("Right") ? "#B83220" : isLive ? "#F8FAFC" : "#1C2714" }}>
                    {((targetAnimal.conductivity || 5.1) * (targetAnimal.quarter?.includes("Right") ? 1.3 : 0.95)).toFixed(1)} <span style={{ fontSize: 9, color: "#8A7356" }}>mS/cm</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div style={{ background: isLive ? "rgba(0,0,0,0.25)" : "#FFFFFF", padding: "6px 8px", borderRadius: 8, border: "1px solid #ECE7DE" }}>
                  <div style={{ fontSize: 9, color: isLive ? "#94A3B8" : "#8A7356" }}>Front Left (FL)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isLive ? "#F8FAFC" : "#1C2714" }}>
                    {lastTelemetry?.ec_fl || (targetAnimal.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#8A7356" }}>mS/cm</span>
                  </div>
                </div>
                <div style={{ background: isLive ? "rgba(0,0,0,0.25)" : "#FFFFFF", padding: "6px 8px", borderRadius: 8, border: "1px solid #ECE7DE" }}>
                  <div style={{ fontSize: 9, color: isLive ? "#94A3B8" : "#8A7356" }}>Front Right (FR)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: targetAnimal.quarter?.includes("Front-Right") ? "#B83220" : isLive ? "#F8FAFC" : "#1C2714" }}>
                    {lastTelemetry?.ec_fr || (targetAnimal.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#8A7356" }}>mS/cm</span>
                  </div>
                </div>
                <div style={{ background: isLive ? "rgba(0,0,0,0.25)" : "#FFFFFF", padding: "6px 8px", borderRadius: 8, border: "1px solid #ECE7DE" }}>
                  <div style={{ fontSize: 9, color: isLive ? "#94A3B8" : "#8A7356" }}>Rear Left (RL)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: targetAnimal.quarter?.includes("Rear-Left") ? "#B83220" : isLive ? "#F8FAFC" : "#1C2714" }}>
                    {lastTelemetry?.ec_rl || (targetAnimal.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#8A7356" }}>mS/cm</span>
                  </div>
                </div>
                <div style={{ background: isLive ? "rgba(0,0,0,0.25)" : "#FFFFFF", padding: "6px 8px", borderRadius: 8, border: "1px solid #ECE7DE" }}>
                  <div style={{ fontSize: 9, color: isLive ? "#94A3B8" : "#8A7356" }}>Rear Right (RR)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: targetAnimal.quarter?.includes("Rear-Right") ? "#B83220" : isLive ? "#F8FAFC" : "#1C2714" }}>
                    {lastTelemetry?.ec_rr || (targetAnimal.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#8A7356" }}>mS/cm</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: isLive ? "#CBD5E1" : "#7B6F5D" }}>
              <span>ΔEC Ratio: <strong style={{ color: targetAnimal.risk === "high" ? "#DC2626" : "#2A5C1F" }}>{targetAnimal.risk === "high" ? "1.42x" : "1.02x"}</strong></span>
              <span>Lactation: <strong>#{targetAnimal.lactation}</strong> · Breed: <strong>{targetAnimal.breed}</strong></span>
            </div>
          </div>

          {/* ── AI PREDICTIVE FORECASTING SUMMARY CARD (TRAINED ML MODEL) ── */}
          {isLive && mlSummary && (
            <div
              style={{
                background: mlSummary.risk === "high"
                  ? "linear-gradient(135deg, rgba(184,50,32,0.25) 0%, rgba(127,29,29,0.35) 100%)"
                  : mlSummary.risk === "moderate"
                  ? "linear-gradient(135deg, rgba(196,122,16,0.25) 0%, rgba(146,64,14,0.35) 100%)"
                  : "linear-gradient(135deg, rgba(42,92,31,0.25) 0%, rgba(20,83,45,0.35) 100%)",
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 12,
                border: `1.5px solid ${
                  mlSummary.risk === "high" ? "#EF4444" : mlSummary.risk === "moderate" ? "#F59E0B" : "#22C55E"
                }`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🤖</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    AI ML Prediction Summary
                  </span>
                </div>
                <RiskBadge level={mlSummary.risk} />
              </div>

              {/* Scanned Cow and RFID Identification */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 8, color: "#E2E8F0" }}>
                <span>
                  {speciesIcon} Animal: <strong style={{ color: "#FDE047" }}>{matchedAnimal ? `${matchedAnimal.name} (${matchedAnimal.id})` : (lastTelemetry?.cowId || "KA-001")}</strong>
                </span>
                {lastTelemetry?.rfidTag && (
                  <span style={{ fontSize: 9.5, background: "rgba(255,255,255,0.12)", padding: "1px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono'" }}>
                    RFID: {lastTelemetry.rfidTag}
                  </span>
                )}
              </div>

              {/* Verdict banner */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: mlSummary.risk === "high" ? "#FCA5A5" : mlSummary.risk === "moderate" ? "#FDE68A" : "#86EFAC",
                  marginBottom: 8,
                  lineHeight: 1.4,
                }}
              >
                {lang === "Tamil"
                  ? mlSummary.tamilVerdict
                  : lang === "Hindi"
                  ? mlSummary.hindiVerdict
                  : mlSummary.verdict}
              </div>

              {/* Probability bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#CBD5E1", marginBottom: 3 }}>
                  <span>{mlSource === "fastapi" ? "Indian Farms Ensemble Probability:" : "Trained Dataset ML Probability:"}</span>
                  <strong style={{ color: "#FFFFFF", fontFamily: "'JetBrains Mono'" }}>{mlSummary.probability}%</strong>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${mlSummary.probability}%`,
                      background: mlSummary.risk === "high" ? "#EF4444" : mlSummary.risk === "moderate" ? "#F59E0B" : "#22C55E",
                      borderRadius: 4,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              {/* Model source + lead-time forecast row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 7px",
                    borderRadius: 20,
                    fontWeight: 700,
                    background: mlSource === "fastapi" ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.2)",
                    color: mlSource === "fastapi" ? "#86EFAC" : "#A5B4FC",
                    border: `1px solid ${mlSource === "fastapi" ? "rgba(34,197,94,0.35)" : "rgba(99,102,241,0.35)"}`,
                  }}
                >
                  {mlSource === "fastapi" ? "🟢 Indian Farms Model (FastAPI)" : "🔵 On-Device JS Model"}
                </span>
                {leadTimeDays !== null && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      background: "rgba(245,158,11,0.2)",
                      color: "#FDE68A",
                      border: "1px solid rgba(245,158,11,0.4)",
                      borderRadius: 20,
                      padding: "2px 8px",
                    }}
                  >
                    ⏱️ Onset in ~{leadTimeDays}d
                  </span>
                )}
              </div>

              {/* Real-Time Sensor vs ML Dataset Norms Comparison Matrix */}
              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginBottom: 6 }}>
                  📊 Real-Time vs {mlSource === "fastapi" ? "Indian Farm Dataset" : "30k Veterinary Dataset"} Baseline:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {mlSummary.comparisons.map((c) => (
                    <div
                      key={c.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 10.5,
                        color: "#E2E8F0",
                      }}
                    >
                      <span>{c.name}:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: c.status === "critical" ? "#F87171" : c.status === "elevated" ? "#FDE047" : "#86EFAC" }}>
                          {c.current}
                        </span>
                        <span style={{ fontSize: 9, color: "#94A3B8" }}>
                          (Norm: {c.datasetNormal})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2 Handoff: Take Cow Udder Photo (Image ML Scan) */}
              <button
                onClick={() => {
                  if (matchedAnimal) setSelectedAnimal(matchedAnimal);
                  if (onNavigate) onNavigate("visual-ai");
                }}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                  color: "#052E16",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
                }}
              >
                <span>📸</span>
                <span>
                  {lang === "Tamil"
                    ? "மடி புகைப்பட ஆய்வு செய்க (Image ML) →"
                    : lang === "Hindi"
                    ? "अयन फोटो स्कैन करें (Image ML) →"
                    : "📸 Scan Cow Udder Photo (Image ML) →"}
                </span>
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <button
              onClick={connectUsbSerial}
              style={{
                flex: 1,
                background: "#2A5C1F",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>🔌</span> Connect USB (Web Serial)
            </button>
            <button
              onClick={() => toggleEsp32()}
              style={{
                background: isLive ? "#B83220" : "rgba(42,92,31,0.12)",
                color: isLive ? "#FFFFFF" : "#2A5C1F",
                border: `1px solid ${isLive ? "#B83220" : "#2A5C1F"}`,
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isLive ? "⏹ Disconnect" : "⚡ Simulate Live Stream"}
            </button>
          </div>

          <button
            onClick={() => setShowSketch(!showSketch)}
            style={{
              background: "transparent",
              border: "none",
              color: isLive ? "#86EFAC" : "#2A5C1F",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {showSketch ? "▲ Hide ESP32 Arduino C++ Code" : "▼ View ESP32 Arduino C++ Code & Wiring"}
          </button>

          {showSketch && (
            <div
              style={{
                marginTop: 10,
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: 10,
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#A7F3D0", fontFamily: "'JetBrains Mono'" }}>
                  MooTracker_ESP32_Firmware.ino
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(arduinoSketch);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    background: "#22C55E",
                    color: "#052E16",
                    border: "none",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 9,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {copied ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: 10,
                  color: "#E2E8F0",
                  fontFamily: "'JetBrains Mono'",
                  maxHeight: 120,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                }}
              >
                {arduinoSketch}
              </pre>
            </div>
          )}
        </Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { label: t("online", lang), value: "42", total: "48", color: "#2A5C1F", bg: "#E6F0E2" },
            { label: "Low Batt", value: "6", color: "#C47A10", bg: "#FEF3E2" },
            { label: "Sync", value: "4m", color: "#1C2714", bg: "#FFFFFF" },
          ].map((s) => (
            <div
              key={s.label}
              style={{ background: s.bg, borderRadius: 14, padding: "12px 10px", border: "1px solid #E0DAD0" }}
            >
              <div style={{ fontSize: 10, color: "#9BA88C", fontWeight: 700, textTransform: "uppercase" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: s.color }}>
                {s.value}
                {s.total && <span style={{ fontSize: 13, fontWeight: 500 }}>/{s.total}</span>}
              </div>
            </div>
          ))}
        </div>

        <SectionLabel>{lang === "Tamil" ? "தற்போதைய சென்சார் அளவீடுகள்" : "Current Readings"}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {readings.map((r) => (
            <div
              key={r.label}
              style={{ background: "#FFFFFF", borderRadius: 12, padding: "10px 12px", border: "1px solid #E0DAD0" }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <span style={{ fontSize: 10, color: "#9BA88C", fontWeight: 600 }}>{r.label}</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 700, color: r.color }}>
                {r.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
