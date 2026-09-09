const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

// SSE Active Client Subscribers
const sseClients = new Set();

function broadcastTelemetry(statePayload) {
  const message = `data: ${JSON.stringify(statePayload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

let esp32State = {
  connected: false,
  isLive: false,
  isRealHardware: false,
  cowScanned: false,
  deviceId: "ESP32-MOOTRACKER",
  mac: "24:6F:28:B2:7D:9A",
  ip: "192.168.4.1",
  firmware: "v2.6.0-masti-quad",
  baudRate: 115200,
  connectionType: "WiFi Direct",
  rssi: -56,
  packetCount: 0,
  lastPing: null,
  lastTelemetry: null
};

// Simulation State Engine (disabled by default so real ESP32 hardware data is shown)
let simulationTimer = null;
let simulationConfig = {
  enabled: false,
  intervalMs: 3000,
  scenario: "dynamic_herd",
  activeCowIndex: 0
};

const SIM_COWS = [
  { cowId: "KA-001", rfidTag: "E200001938090124", name: "Ganga (Cow 1)", baseTemp: 38.6, basePh: 6.68, baseEc: 5.1, baseWeight: 14.2, baseAct: 58, riskScore: 18, riskTier: "Low" },
  { cowId: "KA-007", rfidTag: "E200001938090128", name: "Nandini (Cow 2)", baseTemp: 38.85, basePh: 6.78, baseEc: 5.4, baseWeight: 12.6, baseAct: 42, riskScore: 48, riskTier: "Watch" },
  { cowId: "KA-014", rfidTag: "E200001938090135", name: "Kaveri (Cow 3)", baseTemp: 38.45, basePh: 6.62, baseEc: 4.95, baseWeight: 15.0, baseAct: 62, riskScore: 12, riskTier: "Low" },
  { cowId: "KA-022", rfidTag: "E200001938090142", name: "Kamadhenu (Cow 4)", baseTemp: 39.45, basePh: 7.15, baseEc: 7.85, baseWeight: 8.4, baseAct: 28, riskScore: 86, riskTier: "Elevated" }
];

function stepSimulation() {
  if (!simulationConfig.enabled) return;

  // Cycle through herd cows every 4 ticks
  if (esp32State.packetCount % 4 === 0) {
    simulationConfig.activeCowIndex = (simulationConfig.activeCowIndex + 1) % SIM_COWS.length;
  }

  const cow = SIM_COWS[simulationConfig.activeCowIndex];
  const jitter = (range) => (Math.random() - 0.5) * range;

  // 4-Quarter EC variations
  const isHighRisk = cow.riskTier === "Elevated";
  const ecBase = cow.baseEc + jitter(0.2);
  const ec_fl = +(ecBase + jitter(0.1)).toFixed(2);
  const ec_fr = +(ecBase + (isHighRisk ? 2.4 : 0.15) + jitter(0.1)).toFixed(2);
  const ec_rl = +(ecBase + jitter(0.1)).toFixed(2);
  const ec_rr = +(ecBase + jitter(0.1)).toFixed(2);
  
  const maxEc = Math.max(ec_fl, ec_fr, ec_rl, ec_rr);
  const minEc = Math.min(ec_fl, ec_fr, ec_rl, ec_rr);
  const quarterRatio = +(maxEc / (minEc || 1.0)).toFixed(2);
  const thermalAsymmetry = +(isHighRisk ? 1.65 + jitter(0.2) : 0.18 + jitter(0.08)).toFixed(2);

  esp32State.connected = true;
  esp32State.isLive = true;
  esp32State.lastPing = Date.now();
  esp32State.packetCount += 1;

  esp32State.lastTelemetry = {
    cowId: cow.cowId,
    rfidTag: cow.rfidTag,
    cowName: cow.name,
    temp: +(cow.baseTemp + jitter(0.15)).toFixed(2),
    ph: +(cow.basePh + jitter(0.04)).toFixed(2),
    conductivity: +( (ec_fl + ec_fr + ec_rl + ec_rr) / 4 ).toFixed(2),
    ec_fl,
    ec_fr,
    ec_rl,
    ec_rr,
    quarterRatio,
    thermalAsymmetry,
    weight: +(Math.max(0, cow.baseWeight + jitter(0.3))).toFixed(1),
    activity: Math.round(Math.max(10, Math.min(95, cow.baseAct + jitter(6)))),
    shedTemp: +(31.5 + jitter(0.8)).toFixed(1),
    humidity: Math.round(65 + jitter(4)),
    battery: Math.max(85, 98 - Math.floor(esp32State.packetCount / 50)),
    voltage: 3.31,
    riskScore: cow.riskScore,
    riskTier: cow.riskTier,
    timestamp: new Date().toLocaleTimeString()
  };

  broadcastTelemetry({
    ...esp32State,
    isLive: true,
    serverTime: Date.now()
  });
}

// Start background simulation ticker
if (simulationConfig.enabled) {
  simulationTimer = setInterval(stepSimulation, simulationConfig.intervalMs);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let reqPath = parsedUrl.pathname;

  // Universal CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. ESP32 Real-Time SSE Stream Endpoint
  if (reqPath === '/api/esp32/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    });

    const isLive = esp32State.connected && esp32State.lastPing && (Date.now() - esp32State.lastPing < 60000);
    const initialPayload = {
      ...esp32State,
      isLive: !!isLive,
      serverTime: Date.now()
    };
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. ESP32 Status API Endpoint (Polling Fallback)
  if (reqPath === '/api/esp32/status') {
    const isLive = esp32State.connected && esp32State.lastPing && (Date.now() - esp32State.lastPing < 60000);
    const statePayload = {
      ...esp32State,
      isLive: !!isLive,
      serverTime: Date.now(),
      simulation: simulationConfig
    };
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    return res.end(JSON.stringify(statePayload));
  }

  // 3. Telemetry Simulator Control Endpoint
  if (reqPath === '/api/esp32/simulate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        if (data.enabled !== undefined) {
          simulationConfig.enabled = !!data.enabled;
          if (simulationConfig.enabled && !simulationTimer) {
            simulationTimer = setInterval(stepSimulation, simulationConfig.intervalMs);
          } else if (!simulationConfig.enabled && simulationTimer) {
            clearInterval(simulationTimer);
            simulationTimer = null;
          }
        }
        if (data.intervalMs && Number(data.intervalMs) >= 500) {
          simulationConfig.intervalMs = Number(data.intervalMs);
          if (simulationTimer) {
            clearInterval(simulationTimer);
            simulationTimer = setInterval(stepSimulation, simulationConfig.intervalMs);
          }
        }
        if (data.scenario) simulationConfig.scenario = data.scenario;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, simulation: simulationConfig }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 4. ESP32 Connect Toggle (USB-Serial / WiFi Registration)
  if (reqPath === '/api/esp32/connect' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        esp32State.connected = true;
        esp32State.isLive = true;
        esp32State.lastPing = Date.now();
        esp32State.packetCount += 1;
        if (data.connectionType) esp32State.connectionType = data.connectionType;
        if (data.deviceId) esp32State.deviceId = data.deviceId;
        if (data.telemetry) esp32State.lastTelemetry = { ...esp32State.lastTelemetry, ...data.telemetry };

        broadcastTelemetry({ ...esp32State, isLive: true, serverTime: Date.now() });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: "ESP32 is live and connected", state: esp32State }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (reqPath === '/api/esp32/disconnect' && req.method === 'POST') {
    esp32State.connected = false;
    esp32State.isLive = false;
    esp32State.cowScanned = false;
    esp32State.lastTelemetry = null;
    broadcastTelemetry({ ...esp32State, isLive: false, serverTime: Date.now() });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: "ESP32 disconnected", state: esp32State }));
  }

  // 6. ESP32 Telemetry Ingestion Endpoint (POST from real hardware via WiFi)
  if (reqPath === '/api/esp32/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');

        // Automatically disable simulation and clear fake data when real ESP32 connects
        if (simulationTimer) {
          clearInterval(simulationTimer);
          simulationTimer = null;
        }
        simulationConfig.enabled = false;

        esp32State.connected = true;
        esp32State.isLive = true;
        esp32State.isRealHardware = true;
        esp32State.lastPing = Date.now();
        esp32State.packetCount += 1;
        esp32State.connectionType = "WiFi Direct (Real ESP32)";
        if (data.deviceId) esp32State.deviceId = data.deviceId;
        if (data.rssi) esp32State.rssi = data.rssi;

        const isScanned = (data.cowScanned === true || data.rfid_status === "VERIFIED") && data.rfid_status !== "NOT_VERIFIED";

        if (!isScanned) {
          esp32State.connected = true;
          esp32State.isLive = true;
          esp32State.isRealHardware = true;
          esp32State.cowScanned = false;
          esp32State.lastTelemetry = {
            cowScanned: false,
            rfid_status: "WAITING_FOR_CARD",
            timestamp: new Date().toLocaleTimeString()
          };
          broadcastTelemetry({ ...esp32State, isLive: true, serverTime: Date.now() });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: "Waiting for RFID card", state: esp32State }));
        }

        esp32State.connected = true;
        esp32State.isLive = true;
        esp32State.isRealHardware = true;
        esp32State.cowScanned = true;

        const phVal = data.ph !== undefined ? data.ph : (data.pH !== undefined ? data.pH : data.milk_ph);
        const ecVal = data.conductivity !== undefined ? data.conductivity : (data.ec !== undefined ? data.ec : data.milk_conductivity);
        const tempVal = data.temp !== undefined ? data.temp : (data.temperature !== undefined ? data.temperature : data.body_temperature);
        const rfid = data.rfidTag || data.rfid || (data.rfid_status === "VERIFIED" ? "0xE3995556" : undefined);
        const cowId = data.cowId || data.cow_id || "COW_001";
        const cowName = data.cow_name || data.cowName || (cowId === "COW_001" ? "Cow 1" : cowId);
        const activityVal = data.activity !== undefined ? data.activity : data.activity_score;

        const ec_fl = data.ec_fl !== undefined ? data.ec_fl : (ecVal || 5.0);
        const ec_fr = data.ec_fr !== undefined ? data.ec_fr : (ecVal || 5.0);
        const ec_rl = data.ec_rl !== undefined ? data.ec_rl : (ecVal || 5.0);
        const ec_rr = data.ec_rr !== undefined ? data.ec_rr : (ecVal || 5.0);
        const maxEc = Math.max(ec_fl, ec_fr, ec_rl, ec_rr);
        const minEc = Math.min(ec_fl, ec_fr, ec_rl, ec_rr);
        const quarterRatio = +(maxEc / (minEc || 1.0)).toFixed(2);

        esp32State.lastTelemetry = {
          cowScanned: true,
          cowId,
          cowName,
          rfidTag: rfid,
          temp: tempVal !== undefined ? tempVal : 38.6,
          ph: phVal !== undefined ? phVal : 6.7,
          conductivity: ecVal !== undefined ? ecVal : 5.2,
          ec_fl,
          ec_fr,
          ec_rl,
          ec_rr,
          quarterRatio,
          thermalAsymmetry: data.thermalAsymmetry !== undefined ? data.thermalAsymmetry : 0.1,
          weight: data.weight !== undefined ? data.weight : 0,
          activity: activityVal !== undefined ? activityVal : 50,
          shedTemp: data.shedTemp !== undefined ? data.shedTemp : 30.0,
          humidity: data.humidity !== undefined ? data.humidity : 65,
          battery: data.battery !== undefined ? data.battery : 98,
          rssi: data.rssi !== undefined ? data.rssi : -50,
          riskScore: data.riskScore !== undefined ? data.riskScore : (data.mastitis_risk_score !== undefined ? data.mastitis_risk_score : 0),
          riskTier: data.riskTier || data.mastitis_risk || "LOW",
          timestamp: new Date().toLocaleTimeString()
        };

        broadcastTelemetry({ ...esp32State, isLive: true, serverTime: Date.now() });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "ESP32 telemetry ingested", state: esp32State }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON", message: err.message }));
      }
    });
    return;
  }

  // 7. ESP32 Arduino Sketch Code endpoint
  if (reqPath === '/api/esp32/sketch') {
    const sketch = `// ═══════════════════════════════════════════════════════════
// MooTracker ESP32 Clinical Telemetry & Quad-EC Firmware v2.6
// Hardware Pin Map:
// RC522 RFID:   SDA/SS -> GPIO 5, SCK -> GPIO 18, MOSI -> GPIO 23, MISO -> GPIO 19, RST -> GPIO 2
// MPU6050:       SDA -> GPIO 21, SCL -> GPIO 22
// DS18B20 Temp:  Data -> GPIO 4 (with 4.7k pullup)
// DHT22 Shed:    Data -> GPIO 27
// HX711 Scale:   DOUT -> GPIO 32, SCK -> GPIO 33
// pH Board:      Analog Out -> GPIO 34 (ADC1_CH6)
// 4-Quarter EC:  Multiplexed or Analog Pins (FL: 35, FR: 36, RL: 39, RR: 33)
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

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000/api/esp32/telemetry";

#define RFID_SS_PIN  5
#define RFID_RST_PIN 2
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
String currentRfidTag = "";

MPU6050 mpu;

#define DS18B20_PIN 4
OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);

#define DHT_PIN  27
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

#define HX711_DOUT 32
#define HX711_SCK  33
HX711 scale;

#define PH_PIN    34
#define EC_FL_PIN 35
#define EC_FR_PIN 36
#define EC_RL_PIN 39

float adcToVoltage(int raw) { return raw * 3.3f / 4095.0f; }
float voltageToPH(float v)  { return 7.0f + (2.5f - v) / 0.18f; }
float voltageToEC(float v)  { return v * 2.85f; }

void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();
  Wire.begin(21, 22);
  mpu.initialize();
  ds18b20.begin();
  dht.begin();
  scale.begin(HX711_DOUT, HX711_SCK);
  analogReadResolution(12);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
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

  ds18b20.requestTemperatures();
  float milkTemp   = ds18b20.getTempCByIndex(0);
  float shedHum    = dht.readHumidity();
  float shedTemp   = dht.readTemperature();
  float weightKg   = scale.get_units(3);

  int   phRaw   = analogRead(PH_PIN);
  float phVal   = voltageToPH(adcToVoltage(phRaw));
  float ec_fl   = voltageToEC(adcToVoltage(analogRead(EC_FL_PIN)));
  float ec_fr   = voltageToEC(adcToVoltage(analogRead(EC_FR_PIN)));
  float ec_rl   = voltageToEC(adcToVoltage(analogRead(EC_RL_PIN)));
  float ec_rr   = ec_rl; // or 4th dedicated channel
  float meanEc  = (ec_fl + ec_fr + ec_rl + ec_rr) / 4.0f;

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  float accelMag = sqrt(sq(ax/16384.0f) + sq(ay/16384.0f) + sq(az/16384.0f));
  int activity = constrain((int)((accelMag - 1.0f) * 100), 0, 100);

  StaticJsonDocument<384> doc;
  doc["deviceId"] = "ESP32-WROOM32";
  doc["cowId"]    = currentRfidTag.length() > 0 ? currentRfidTag : "KA-001";
  doc["rfid"]     = currentRfidTag;
  doc["temp"]     = milkTemp;
  doc["ph"]       = phVal;
  doc["ec"]       = meanEc;
  doc["ec_fl"]    = ec_fl;
  doc["ec_fr"]    = ec_fr;
  doc["ec_rl"]    = ec_rl;
  doc["ec_rr"]    = ec_rr;
  doc["weight"]   = weightKg;
  doc["activity"] = activity;
  doc["shedTemp"] = shedTemp;
  doc["humidity"] = shedHum;
  doc["battery"]  = 95;
  doc["rssi"]     = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);
  Serial.println(payload);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.POST(payload);
    http.end();
  }
  delay(2500);
}`;
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(sketch);
  }

  // 8. TTS Proxy Route for Multilingual Voice Speech Synthesis
  if (reqPath === '/api/tts') {
    const tl = parsedUrl.query.tl || 'en';
    const text = parsedUrl.query.text || '';
    if (!text) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Missing text parameter');
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(tl)}&client=tw-ob&q=${encodeURIComponent(text.slice(0, 200))}`;
    
    https.get(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    }, (ttsRes) => {
      if (ttsRes.statusCode !== 200) {
        res.writeHead(ttsRes.statusCode, { 'Content-Type': 'text/plain' });
        return res.end(`TTS Error: ${ttsRes.statusCode}`);
      }
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      });
      ttsRes.pipe(res);
    }).on('error', (err) => {
      console.error('TTS Proxy Error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Proxy Error: ${err.message}`);
    });
    return;
  }

  // Static File Serving
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath === '/dashboard' || reqPath === '/app' || reqPath === '/app/' || reqPath === '/mobile' || reqPath === '/mobile/') reqPath = '/mobile.html';

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fallback);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 MooTracker Server Running at http://localhost:${PORT}`);
  console.log(`📡 SSE Stream: http://localhost:${PORT}/api/esp32/stream`);
  console.log(`🎮 Simulator Active: Auto-streaming herd telemetry`);
  console.log(`====================================================`);
});
