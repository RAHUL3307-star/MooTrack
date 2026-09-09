import React, { useState } from "react";
import { StatusBar, BackHeader, Card, SectionLabel, ReadAloudFAB } from "../components/ui";
import { useESP32 } from "../context/ESP32Context";
import { t } from "../i18n/index";

export function SensorsScreen({
  onBack,
  lang,
}: {
  onBack: () => void;
  lang: string;
}) {
  const { isLive, deviceId, lastTelemetry, connectUsbSerial, toggleEsp32 } = useESP32();
  const [showSketch, setShowSketch] = useState(false);
  const [copied, setCopied] = useState(false);

  const readings = [
    {
      label: lang === "Tamil" ? "பால் pH" : "Milk pH (GPIO 34)",
      value: isLive && lastTelemetry?.ph != null ? `${lastTelemetry.ph.toFixed(2)}` : "6.7",
      status: isLive && lastTelemetry?.ph != null
        ? (lastTelemetry.ph < 6.3 || lastTelemetry.ph > 7.0 ? "Abnormal" : "Normal")
        : "Normal",
      icon: "🧪",
      color: isLive && lastTelemetry?.ph != null && (lastTelemetry.ph < 6.3 || lastTelemetry.ph > 7.0) ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "பால் EC (கடத்துதிறன்)" : "Milk EC (GPIO 35)",
      value: isLive && lastTelemetry ? `${lastTelemetry.conductivity.toFixed(1)} mS/cm` : "5.0 mS/cm",
      status: isLive && lastTelemetry && lastTelemetry.conductivity > 10 ? "High ⚠️" : "Normal",
      icon: "⚡",
      color: isLive && lastTelemetry && lastTelemetry.conductivity > 10 ? "#B83220" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "பால் வெப்பநிலை (DS18B20)" : "Milk Temp DS18B20 (GPIO 4)",
      value: isLive && lastTelemetry ? `${lastTelemetry.temp}°C` : "38.5°C",
      status: isLive && lastTelemetry && lastTelemetry.temp > 39.2 ? "Elevated ⚠️" : "Normal",
      icon: "🌡",
      color: isLive && lastTelemetry && lastTelemetry.temp > 39.2 ? "#C47A10" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "எடை (HX711 Load Cell)" : "Milk Weight HX711 (GPIO 32/33)",
      value: isLive && lastTelemetry?.weight != null ? `${lastTelemetry.weight.toFixed(1)} kg` : "—",
      status: "Live",
      icon: "⚖️",
      color: "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "கொட்டகை ஈரப்பதம் (DHT22)" : "Shed Humidity DHT22 (GPIO 27)",
      value: isLive && lastTelemetry?.humidity != null ? `${lastTelemetry.humidity}%` : "68%",
      status: isLive && lastTelemetry?.humidity != null && lastTelemetry.humidity > 80 ? "High" : "Normal",
      icon: "💧",
      color: isLive && lastTelemetry?.humidity != null && lastTelemetry.humidity > 80 ? "#B83220" : "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "செயல்பாட்டு அளவீடு (MPU6050)" : "Activity MPU6050 (GPIO 21/22)",
      value: isLive && lastTelemetry?.activity != null ? `${lastTelemetry.activity}%` : "—",
      status: isLive && lastTelemetry?.activity != null && lastTelemetry.activity < 30 ? "Low ⚠️" : "Normal",
      icon: "📐",
      color: isLive && lastTelemetry?.activity != null && lastTelemetry.activity < 30 ? "#C47A10" : "#2A5C1F",
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
                {isLive ? "🟢 Real ESP32 is Live & Streaming" : "⚪ Real ESP32 Disconnected"}
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
                <strong style={{ color: "#FCD34D" }}>{lastTelemetry?.cowId || "KA-001"}</strong>. Telemetry updating
                in real-time via SSE.
              </>
            ) : (
              <>
                Connect your physical ESP32 microcontroller via USB cable (Web Serial) or WiFi telemetry stream to
                inject live milk sensors.
              </>
            )}
          </div>

          {/* Quad-Quarter Conductivity & Thermal Asymmetry Matrix */}
          {isLive && (
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 12,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  🐄 4-Quarter Udder EC & Symmetry
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontWeight: 700,
                    background: (lastTelemetry?.quarterRatio || 1.0) > 1.15 ? "#EF4444" : "#22C55E",
                    color: "#FFFFFF",
                  }}
                >
                  {(lastTelemetry?.quarterRatio || 1.0) > 1.15 ? "⚠️ Asymmetry Alert" : "✓ Balanced Quarters"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 9, color: "#94A3B8" }}>Front Left (FL)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{lastTelemetry?.ec_fl || (lastTelemetry?.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#94A3B8" }}>mS/cm</span></div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 9, color: "#94A3B8" }}>Front Right (FR)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: (lastTelemetry?.ec_fr || 5.1) > 6.5 ? "#F87171" : "#F8FAFC" }}>{lastTelemetry?.ec_fr || (lastTelemetry?.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#94A3B8" }}>mS/cm</span></div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 9, color: "#94A3B8" }}>Rear Left (RL)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{lastTelemetry?.ec_rl || (lastTelemetry?.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#94A3B8" }}>mS/cm</span></div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.25)", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 9, color: "#94A3B8" }}>Rear Right (RR)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>{lastTelemetry?.ec_rr || (lastTelemetry?.conductivity || 5.1).toFixed(2)} <span style={{ fontSize: 9, color: "#94A3B8" }}>mS/cm</span></div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#CBD5E1" }}>
                <span>ΔEC Ratio: <strong style={{ color: "#FDE047" }}>{lastTelemetry?.quarterRatio ? `${lastTelemetry.quarterRatio}x` : "1.02x"}</strong></span>
                <span>Thermal Asymmetry: <strong style={{ color: "#FDE047" }}>{lastTelemetry?.thermalAsymmetry ? `${lastTelemetry.thermalAsymmetry}°C` : "0.18°C"}</strong></span>
              </div>
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
