// ESP32 DevKit V1 — MooTracker Hardware Telemetry Types
// Pin Map:
//   RC522 RFID  : SDA→GPIO5, SCK→18, MOSI→23, MISO→19, RST→2
//   MPU6050     : SDA→GPIO21, SCL→22
//   DS18B20     : Data→GPIO4  (milk temperature, 4.7kΩ pull-up)
//   DHT22       : Data→GPIO27 (shed temp + humidity)
//   HX711       : DOUT→GPIO32, SCK→33  (load cell / milk weight)
//   pH module   : AO→GPIO34 (ADC1, max 3.3V via voltage divider)
//   EC module   : AO→GPIO35 (ADC1, max 3.3V via voltage divider)

export interface ESP32Telemetry {
  // Identity
  rfidTag?: string;       // RC522 RFID tag UID (cow identification)
  cowId: string;          // Resolved cow ID from RFID registry

  // Milk Quality Sensing Unit (GPIO 4, 32/33, 34, 35)
  temp: number;           // DS18B20 milk temperature °C (GPIO 4)
  ph?: number;            // pH electrode → interface board → GPIO 34
  conductivity: number;   // EC probe → interface board → GPIO 35 (mS/cm)
  weight?: number;        // HX711 load cell milk weight in kg (GPIO 32/33)

  // Animal & Environment Monitoring Unit (GPIO 21/22, 27)
  activity?: number;      // MPU6050 activity index 0–100 (GPIO 21/22)
  shedTemp?: number;      // DHT22 shed temperature °C (GPIO 27)
  humidity?: number;      // DHT22 shed humidity % (GPIO 27)

  // Device health
  battery?: number;       // Battery % (0–100)
  rssi?: number;          // WiFi signal strength dBm

  timestamp: string;
}

export interface ESP32State {
  isLive: boolean;
  connected: boolean;
  deviceId: string;
  baudRate: number;
  source: string;
  lastTelemetry: ESP32Telemetry | null;
}

export interface ESP32Notification {
  id: number;
  type: "connected" | "disconnected" | "rfid_scan";
  deviceId: string;
  source?: string;
  cowId?: string;
  rfidTag?: string;
  temp?: number;
  ph?: number;
  conductivity?: number;
  weight?: number;
  message?: string;
}

export interface ESP32ContextType extends ESP32State {
  notification: ESP32Notification | null;
  dismissNotification: () => void;
  connectUsbSerial: () => Promise<void>;
  toggleEsp32: () => Promise<void>;
  dismissBanner: () => void;
  bannerDismissed: boolean;
  setBannerDismissed: (v: boolean) => void;
}

// ─── Risk computation based on real milk sensor readings ──────────────────────
export function computeMilkRisk(t: ESP32Telemetry): {
  risk: "none" | "low" | "moderate" | "high";
  score: number;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // pH: Normal 6.4–6.8. Mastitis → <6.3 or >7.0
  if (t.ph !== undefined) {
    if (t.ph < 6.0 || t.ph > 7.2) { score += 40; reasons.push(`pH ${t.ph.toFixed(2)} (critical)`); }
    else if (t.ph < 6.3 || t.ph > 7.0) { score += 25; reasons.push(`pH ${t.ph.toFixed(2)} (abnormal)`); }
    else if (t.ph < 6.4 || t.ph > 6.8) { score += 10; reasons.push(`pH ${t.ph.toFixed(2)} (borderline)`); }
  }

  // Conductivity: Normal 4–8 mS/cm. Mastitis → >10 mS/cm
  if (t.conductivity !== undefined) {
    if (t.conductivity > 14) { score += 35; reasons.push(`EC ${t.conductivity} mS/cm (critical)`); }
    else if (t.conductivity > 10) { score += 25; reasons.push(`EC ${t.conductivity} mS/cm (elevated)`); }
    else if (t.conductivity > 8.5) { score += 10; reasons.push(`EC ${t.conductivity} mS/cm (borderline)`); }
  }

  // Milk Temperature: Normal 36–38°C. Mastitis → >39°C
  if (t.temp !== undefined) {
    if (t.temp > 40.5) { score += 35; reasons.push(`Temp ${t.temp}°C (critical fever)`); }
    else if (t.temp > 39.2) { score += 20; reasons.push(`Temp ${t.temp}°C (elevated)`); }
    else if (t.temp > 38.8) { score += 8; reasons.push(`Temp ${t.temp}°C (borderline)`); }
    else if (t.temp < 35.5) { score += 15; reasons.push(`Temp ${t.temp}°C (low, check probe)`); }
  }

  // Activity: Low activity may indicate illness
  if (t.activity !== undefined) {
    if (t.activity < 20) { score += 15; reasons.push(`Activity ${t.activity}% (very low)`); }
    else if (t.activity < 35) { score += 8; reasons.push(`Activity ${t.activity}% (low)`); }
  }

  const risk =
    score >= 65 ? "high" :
    score >= 35 ? "moderate" :
    score >= 15 ? "low" :
    "none";

  return { risk, score: Math.min(score, 100), reasons };
}
