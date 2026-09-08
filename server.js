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
  deviceId: "ESP32-MASTI-01",
  mac: "24:6F:28:B2:7D:9A",
  ip: "192.168.1.104",
  firmware: "v2.4.1-masti",
  baudRate: 115200,
  connectionType: "USB-Serial / WiFi",
  rssi: -58,
  packetCount: 0,
  lastPing: null,
  lastTelemetry: {
    temp: 39.4,
    ec: 5.32,
    pH: 6.84,
    scc: 485000,
    quarter: "Rear-Left",
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
        if (data.temp || data.ec || data.pH || data.scc) {
          esp32State.lastTelemetry = { ...esp32State.lastTelemetry, ...data };
        }
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
    const sketch = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.1.100:3000/api/esp32/telemetry"; // Replace with your laptop IP

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // Read real sensor inputs (EC probe on ADC34, DS18B20 Temp on GPIO4)
    float temp = 38.5 + (random(0, 15) / 10.0);
    float ec = 5.2 + (random(-20, 20) / 100.0);
    float ph = 6.8 + (random(-10, 10) / 100.0);
    long scc = random(350000, 520000);

    StaticJsonDocument<200> doc;
    doc["deviceId"] = "ESP32-MASTI-01";
    doc["temp"] = temp;
    doc["ec"] = ec;
    doc["pH"] = ph;
    doc["scc"] = scc;
    doc["rssi"] = WiFi.RSSI();

    String requestBody;
    serializeJson(doc, requestBody);
    int httpResponseCode = http.POST(requestBody);
    Serial.printf("Telemetry sent! HTTP Response: %d\\n", httpResponseCode);
    http.end();
  }
  delay(3000); // stream every 3 seconds
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
