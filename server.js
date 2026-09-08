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
  '.ico': 'image/x-icon'
};

let esp32State = {
  connected: false,
  isLive: false,
  deviceId: "ESP32-WROOM32",
  mac: "24:6F:28:B2:7D:9A",
  ip: "192.168.1.104",
  firmware: "v2.5.0-masti",
  baudRate: 115200,
  connectionType: "USB-Serial / WiFi",
  rssi: -58,
  packetCount: 0,
  lastPing: null,
  lastTelemetry: {
    cowId: "KA-001",
    rfidTag: "RFID-001",
    temp: 38.5,
    ph: 6.7,
    conductivity: 5.0,
    weight: 0,
    activity: 55,
    shedTemp: 32.4,
    humidity: 68,
    battery: 94,
    voltage: 3.3
  }
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let reqPath = parsedUrl.pathname;

  // CORS headers helper
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // ESP32 Status API Endpoint
  if (reqPath === '/api/esp32/status') {
    const isLive = esp32State.connected && esp32State.lastPing && (Date.now() - esp32State.lastPing < 60000);
    const statePayload = {
      ...esp32State,
      isLive: !!isLive,
      serverTime: Date.now()
    };
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    });
    return res.end(JSON.stringify(statePayload));
  }

  // ESP32 Connect Toggle (Simulate or Register Real Hardware Connection)
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: "ESP32 is live and connected", state: esp32State }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ESP32 Disconnect Endpoint
  if (reqPath === '/api/esp32/disconnect' && req.method === 'POST') {
    esp32State.connected = false;
    esp32State.isLive = false;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: "ESP32 disconnected", state: esp32State }));
  }

  // ESP32 Telemetry Ingestion Endpoint (POST from real hardware via WiFi)
  if (reqPath === '/api/esp32/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        esp32State.connected = true;
        esp32State.isLive = true;
        esp32State.lastPing = Date.now();
        esp32State.packetCount += 1;
        esp32State.connectionType = "WiFi Direct";
        if (data.deviceId) esp32State.deviceId = data.deviceId;
        if (data.rssi) esp32State.rssi = data.rssi;

        const phVal = data.ph !== undefined ? data.ph : data.pH;
        const ecVal = data.conductivity !== undefined ? data.conductivity : data.ec;
        const rfid = data.rfidTag || data.rfid;
        const cowId = data.cowId || rfid || esp32State.lastTelemetry?.cowId || "KA-001";

        esp32State.lastTelemetry = {
          ...esp32State.lastTelemetry,
          cowId,
          rfidTag: rfid || esp32State.lastTelemetry?.rfidTag,
          temp: data.temp !== undefined ? data.temp : esp32State.lastTelemetry?.temp,
          ph: phVal !== undefined ? phVal : esp32State.lastTelemetry?.ph,
          conductivity: ecVal !== undefined ? ecVal : esp32State.lastTelemetry?.conductivity,
          weight: data.weight !== undefined ? data.weight : esp32State.lastTelemetry?.weight,
          activity: data.activity !== undefined ? data.activity : esp32State.lastTelemetry?.activity,
          shedTemp: data.shedTemp !== undefined ? data.shedTemp : esp32State.lastTelemetry?.shedTemp,
          humidity: data.humidity !== undefined ? data.humidity : esp32State.lastTelemetry?.humidity,
          battery: data.battery !== undefined ? data.battery : esp32State.lastTelemetry?.battery,
          rssi: data.rssi !== undefined ? data.rssi : esp32State.rssi,
          timestamp: new Date().toLocaleTimeString()
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "ESP32 telemetry ingested", state: esp32State }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Invalid JSON", message: err.message }));
      }
    });
    return;
  }

  // ESP32 Arduino Sketch Code endpoint for user
  if (reqPath === '/api/esp32/sketch') {
    const sketch = `// MooTracker ESP32 Clinical Telemetry Firmware
// Hardware Pin Map:
// RC522 RFID:   SDA/SS -> GPIO 5, SCK -> GPIO 18, MOSI -> GPIO 23, MISO -> GPIO 19, RST -> GPIO 2
// MPU6050:       SDA -> GPIO 21, SCL -> GPIO 22
// DS18B20 Temp:  Data -> GPIO 4 (with 4.7k pullup)
// DHT22 Shed:    Data -> GPIO 27
// HX711 Scale:   DOUT -> GPIO 32, SCK -> GPIO 33
// pH Board:      Analog Out -> GPIO 34 (ADC1_CH6)
// EC Board:      Analog Out -> GPIO 35 (ADC1_CH7)

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
const char* serverUrl = "http://192.168.1.100:3000/api/esp32/telemetry";

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

#define PH_PIN  34
#define EC_PIN  35

float adcToVoltage(int raw) { return raw * 3.3f / 4095.0f; }
float voltageToPH(float v)  { return 7.0f + (2.5f - v) / 0.18f; }
float voltageToEC(float v)  { return v * 2.8f; }

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

  int   phRaw  = analogRead(PH_PIN);
  int   ecRaw  = analogRead(EC_PIN);
  float phVal  = voltageToPH(adcToVoltage(phRaw));
  float ecVal  = voltageToEC(adcToVoltage(ecRaw));

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
  float accelMag = sqrt(sq(ax/16384.0f) + sq(ay/16384.0f) + sq(az/16384.0f));
  int activity = constrain((int)((accelMag - 1.0f) * 100), 0, 100);

  StaticJsonDocument<256> doc;
  doc["deviceId"] = "ESP32-WROOM32";
  doc["cowId"]    = currentRfidTag.length() > 0 ? currentRfidTag : "KA-001";
  doc["rfid"]     = currentRfidTag;
  doc["temp"]     = milkTemp;
  doc["ph"]       = phVal;
  doc["ec"]       = ecVal;
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
  delay(3000);
}`;
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(sketch);
  }

  // TTS Proxy Route for Multilingual Voice Speech Synthesis
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
  console.log(`🚀 MooTracker Web App Running at http://localhost:${PORT}`);
  console.log(`====================================================`);
});
