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
      label: lang === "Tamil" ? "பால் கடத்துதிறன் (சராசரி)" : "Conductivity (avg)",
      value: isLive && lastTelemetry ? `${lastTelemetry.conductivity} mS/cm` : "10.4 mS/cm",
      status: "Normal",
      icon: "⚡",
      color: "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "பால் pH அளவு" : "Milk pH (avg)",
      value: "6.7",
      status: "Normal",
      icon: "🧪",
      color: "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "மடி வெப்பநிலை" : "Milk Temperature",
      value: isLive && lastTelemetry ? `${lastTelemetry.temp}°C` : "37.8°C",
      status: "Normal",
      icon: "🌡",
      color: "#2A5C1F",
    },
    {
      label: lang === "Tamil" ? "கொட்டகை வெப்பநிலை" : "Shed Temp",
      value: "32.4°C",
      status: "Warm",
      icon: "🌡",
      color: "#C47A10",
    },
    {
      label: lang === "Tamil" ? "கொட்டகை ஈரப்பதம்" : "Shed Humidity",
      value: isLive && lastTelemetry?.humidity ? `${lastTelemetry.humidity}%` : "84%",
      status: "High",
      icon: "💧",
      color: "#B83220",
    },
  ];

  const arduinoSketch = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_COMPUTER_IP:3000/api/esp32/telemetry";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nESP32 WiFi Connected!");
}

void loop() {
  // Read sensors (DS18B20 Temp + EC Analog Pin 34)
  float temp = 39.4;
  float ec = 6.85;
  long scc = 2450000;

  // 1. Output Serial JSON for USB WebSerial connection
  Serial.printf("{\\"cowId\\":\\"KA-001\\",\\"temp\\":%.2f,\\"conductivity\\":%.2f,\\"scc\\":%ld}\\n", temp, ec, scc);

  // 2. Stream HTTP POST to MooTracker LAN Server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    String payload = "{\\"deviceId\\":\\"ESP32-HARDWARE-WROOM32\\",\\"cowId\\":\\"KA-001\\",\\"temp\\":39.4,\\"conductivity\\":6.85,\\"scc\\":2450000,\\"humidity\\":84,\\"battery\\":94,\\"rssi\\":-58}";
    http.POST(payload);
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
                in real-time.
              </>
            ) : (
              <>
                Connect your physical ESP32 microcontroller via USB cable (Web Serial) or WiFi telemetry stream to
                inject live milk sensors.
              </>
            )}
          </div>

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
