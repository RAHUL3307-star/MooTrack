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
  cowScanned?: boolean;   // true if an RFID card has been scanned on ESP32
  cowName?: string;       // Resolved cow name
  rfid_status?: string;   // "VERIFIED" | "WAITING_FOR_CARD"
  rfidTag?: string;       // RC522 RFID tag UID (cow identification)
  cowId: string;          // Resolved cow ID from RFID registry

  // Milk Quality Sensing Unit (GPIO 4, 32/33, 34, 35)
  temp: number;           // DS18B20 milk temperature °C (GPIO 4)
  ph?: number;            // pH electrode → interface board → GPIO 34
  conductivity: number;   // EC probe → interface board → GPIO 35 (mS/cm)
  scc?: number;           // Somatic Cell Count in cells/mL (Direct / Calculated)
  scs?: number;           // Somatic Cell Score (log2 scale)
  ec_fl?: number;         // Front Left Quarter EC (mS/cm)
  ec_fr?: number;         // Front Right Quarter EC (mS/cm)
  ec_rl?: number;         // Rear Left Quarter EC (mS/cm)
  ec_rr?: number;         // Rear Right Quarter EC (mS/cm)
  quarterRatio?: number;  // Max Quarter / Min Quarter EC ratio (alert > 1.15)
  thermalAsymmetry?: number; // Left vs Right udder skin temp diff °C
  weight?: number;        // HX711 load cell milk weight in kg (GPIO 32/33)

  // Animal & Environment Monitoring Unit (GPIO 21/22, 27)
  activity?: number;      // MPU6050 activity index 0–100 (GPIO 21/22)
  shedTemp?: number;      // DHT22 shed temperature °C (GPIO 27)
  humidity?: number;      // DHT22 shed humidity % (GPIO 27)

  // Device health & risk
  battery?: number;       // Battery % (0–100)
  rssi?: number;          // WiFi signal strength dBm
  riskScore?: number;     // 0-100 calculated risk score
  riskTier?: string;      // "Low" | "Watch" | "Elevated"

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

export interface ESP32GatewayState {
  gatewayDeviceId: string;
  gatewayLive: boolean;
  loraRssi: number;         // Signal strength dBm (e.g. -78 dBm)
  loraSnr: number;          // Signal-to-noise ratio dB (e.g. +9.2 dB)
  loraFrequency: string;    // "433 MHz" | "868 MHz" | "915 MHz"
  oledDisplay: {
    line1: string;          // e.g. "COW: Cow 1 (KA-001)"
    line2: string;          // e.g. "EC: 12.4 | pH: 6.1"
    line3: string;          // e.g. "TEMP: 39.4C | WT: 10.2kg"
    line4: string;          // e.g. "STATUS: CRITICAL ALERT"
  };
  ledStatus: {
    green: boolean;         // Normal (EC < 6.5)
    yellow: boolean;        // Subclinical watch (EC 6.5–10.0)
    red: boolean;           // Clinical mastitis alert (EC > 10.0)
  };
  buzzerActive: boolean;    // Active acoustic buzzer for acute mastitis
  packetsReceived: number;
  lastPacketTime: string;
}

export interface ESP32ContextType extends ESP32State {
  notification: ESP32Notification | null;
  dismissNotification: () => void;
  connectUsbSerial: () => Promise<void>;
  toggleEsp32: () => Promise<void>;
  dismissBanner: () => void;
  bannerDismissed: boolean;
  setBannerDismissed: (v: boolean) => void;
  // Dual ESP32 Gateway Brain controls
  gatewayState: ESP32GatewayState;
  triggerBuzzerTest: () => void;
  toggleGatewayLive: () => void;
}

export interface BiomarkerComparison {
  name: string;
  current: string;
  datasetNormal: string;
  status: "normal" | "elevated" | "critical";
  deviation: string;
}

export interface MLPredictionSummary {
  risk: "none" | "low" | "moderate" | "high";
  riskTierLabel: string;
  probability: number;       // 0–100%
  score: number;             // calibrated risk score
  hasMastitis: boolean;      // true if moderate or high risk
  verdict: string;
  hindiVerdict: string;
  tamilVerdict: string;
  reasons: string[];
  comparisons: BiomarkerComparison[];
}

// ─── Trained ML Risk Computation (30,000 Veterinary Records Baseline) ────────
export function computeMilkRisk(t: ESP32Telemetry): MLPredictionSummary {
  const ec = t.conductivity ?? 5.0;
  const temp = t.temp ?? 38.5;
  const ph = t.ph ?? 6.65;
  const qRatio = t.quarterRatio ?? (t.ec_fr && t.ec_fl ? Math.max(t.ec_fr, t.ec_fl) / Math.min(t.ec_fr, t.ec_fl) : 1.02);
  const thermAsym = t.thermalAsymmetry ?? 0.15;
  const activity = t.activity ?? 55;

  // Somatic Cell Score & Count Calculation (Veterinary Standard Model)
  // SCS = 3.0 + 1.8*(EC - 5.0) + 2.2*(pH - 6.65) + 1.2*max(0, temp - 38.5)
  const computedSCS = Math.min(9.5, Math.max(1.5, 3.0 + 1.8 * (ec - 5.0) + 2.2 * (ph - 6.65) + 1.2 * Math.max(0, temp - 38.5)));
  const scc = t.scc ?? Math.round(100000 * Math.pow(2, computedSCS - 3.0));
  const normSCC = (Math.log10(Math.max(scc, 10000)) - 5.0) / 0.45;

  // Normalized ML Features against 30,000 dataset records
  const normEC = (ec - 5.291) / 0.461;
  const normRatio = (qRatio - 1.399) / 0.359;
  const normPH = (ph - 6.862) / 0.279;
  const normTemp = (temp - 39.187) / 0.706;
  const normTherm = (thermAsym - 0.774) / 0.664;
  const normAct = (activity - 50.0) / 15.0;

  // Weighted Logit from trained ensemble (incorporating Somatic Cell Count weight)
  const rawScore = 3.9028 + (
    2.1144 * normEC +
    2.8500 * normSCC +
    3.6761 * normRatio +
    3.2591 * normPH +
    2.2757 * normTemp +
    4.5945 * normTherm -
    2.1636 * normAct
  );

  // Scaled probability
  const scaledScore = (rawScore - 3.9028) / 4.8 + (rawScore >= 0 ? 0.8 : -0.8);
  const rawProb = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, scaledScore))));
  const probability = Math.round(Math.min(99.4, Math.max(0.6, rawProb * 100)));

  const reasons: string[] = [];
  const comparisons: BiomarkerComparison[] = [];

  // 1. Somatic Cell Count (SCC) Comparison
  const sccDev = scc > 200000 ? `+${((scc - 100000) / 100000 * 100).toFixed(0)}%` : "Normal";
  const sccStatus: BiomarkerComparison["status"] = scc > 500000 ? "critical" : scc > 200000 ? "elevated" : "normal";
  if (sccStatus !== "normal") reasons.push(`Somatic Cell Count ${scc.toLocaleString()} cells/mL (${sccStatus === "critical" ? "Acute Leukocyte Surge >500k" : "Subclinical Threshold 200k–500k"})`);
  comparisons.push({
    name: "Somatic Cell Count (SCC)",
    current: `${(scc / 1000).toFixed(0)}k cells/mL`,
    datasetNormal: "< 200k cells/mL (Healthy)",
    status: sccStatus,
    deviation: sccDev,
  });

  // 2. Conductivity Comparison
  const ecDev = ec > 6.0 ? `+${((ec - 5.2) / 5.2 * 100).toFixed(0)}%` : "Normal";
  const ecStatus: BiomarkerComparison["status"] = ec > 9.0 ? "critical" : ec > 6.2 ? "elevated" : "normal";
  if (ecStatus !== "normal") reasons.push(`Milk EC ${ec.toFixed(1)} mS/cm (${ecDev} vs normal <5.5)`);
  comparisons.push({
    name: "Conductivity (EC)",
    current: `${ec.toFixed(1)} mS/cm`,
    datasetNormal: "4.0 – 5.5 mS/cm",
    status: ecStatus,
    deviation: ecDev,
  });

  // 3. Quarter EC Differential Ratio
  const qDev = qRatio > 1.15 ? `${qRatio.toFixed(2)}x` : "Symmetric";
  const qStatus: BiomarkerComparison["status"] = qRatio > 1.30 ? "critical" : qRatio > 1.15 ? "elevated" : "normal";
  if (qStatus !== "normal") reasons.push(`Quarter Asymmetry ${qRatio.toFixed(2)}x (differential alert >1.15x)`);
  comparisons.push({
    name: "Quarter Differential",
    current: `${qRatio.toFixed(2)}x`,
    datasetNormal: "< 1.15x (Balanced)",
    status: qStatus,
    deviation: qDev,
  });

  // 4. Milk Temperature
  const tempDev = temp > 39.0 ? `+${(temp - 38.5).toFixed(1)}°C` : "Normal";
  const tempStatus: BiomarkerComparison["status"] = temp > 40.0 ? "critical" : temp > 39.2 ? "elevated" : "normal";
  if (tempStatus !== "normal") reasons.push(`Milk Temp ${temp.toFixed(1)}°C (fever alert >39.0°C)`);
  comparisons.push({
    name: "Milk Temperature",
    current: `${temp.toFixed(1)}°C`,
    datasetNormal: "38.0 – 38.8°C",
    status: tempStatus,
    deviation: tempDev,
  });

  // 5. Milk pH
  const phStatus: BiomarkerComparison["status"] = (ph < 6.2 || ph > 7.1) ? "critical" : (ph < 6.4 || ph > 6.9) ? "elevated" : "normal";
  if (phStatus !== "normal") reasons.push(`Milk pH ${ph.toFixed(2)} (abnormal vs normal 6.5–6.8)`);
  comparisons.push({
    name: "Milk pH",
    current: ph.toFixed(2),
    datasetNormal: "6.50 – 6.80",
    status: phStatus,
    deviation: phStatus !== "normal" ? (ph > 6.8 ? "Alkaline" : "Acidic") : "Normal",
  });

  // 6. Thermal Asymmetry
  const thermStatus: BiomarkerComparison["status"] = thermAsym > 0.8 ? "critical" : thermAsym > 0.4 ? "elevated" : "normal";
  comparisons.push({
    name: "Udder Temp ΔT",
    current: `${thermAsym.toFixed(2)}°C`,
    datasetNormal: "< 0.35°C",
    status: thermStatus,
    deviation: thermStatus !== "normal" ? `+${thermAsym.toFixed(2)}°C` : "Normal",
  });

  // Risk Classification (Factoring Somatic Cell Count)
  let risk: "none" | "low" | "moderate" | "high" = "none";
  let riskTierLabel = "No Risk (Healthy Baseline)";
  let verdict = "Normal & Healthy · No Signs of Mastitis";
  let hindiVerdict = "सामान्य और स्वस्थ · थनैला का कोई लक्षण नहीं";
  let tamilVerdict = "இயல்பு & ஆரோக்கியம் · மடிநோய் அறிகுறிகள் இல்லை";
  let hasMastitis = false;

  if (scc > 500000 || probability >= 75 || ec > 9.5 || (temp > 39.8 && qRatio > 1.25)) {
    risk = "high";
    riskTierLabel = "High Risk (Clinical Acute)";
    verdict = "🚨 Acute Clinical Mastitis Detected (High Risk / Critical SCC)";
    hindiVerdict = "🚨 तीव्र नैदानिक थनैला पाया गया (उच्च सोमैटिक सेल काउंट)";
    tamilVerdict = "🚨 தீவிர மடிநோய் பாதிப்பு கண்டறியப்பட்டது (உயர் SCC)";
    hasMastitis = true;
  } else if (scc > 200000 || probability >= 45 || ec > 6.8 || qRatio > 1.18 || ph > 6.95) {
    risk = "moderate";
    riskTierLabel = "Moderate Risk (Subclinical Mastitis)";
    verdict = "⚠️ Subclinical Mastitis Detected (7–14 Day High Chance / Elevated SCC)";
    hindiVerdict = "⚠️ उप-नैदानिक थनैला का जोखिम (7–14 दिनों में होने की संभावना / बढ़ा हुआ SCC)";
    tamilVerdict = "⚠️ உள்ளுறை மடிநோய் எச்சரிக்கை (7–14 நாட்களில் தாக்கும் வாய்ப்பு / அதிகரித்த SCC)";
    hasMastitis = true;
  } else if (scc > 120000 || probability >= 18 || ec > 5.8 || temp > 38.9) {
    risk = "low";
    riskTierLabel = "Low Risk (Early Warning)";
    verdict = "⚡ Early Warning / Minor Parameter Drift";
    hindiVerdict = "⚡ प्रारंभिक चेतावनी / हल्का बदलाव";
    tamilVerdict = "⚡ ஆரம்ப எச்சரிக்கை / லேசான மாறுபாடு";
    hasMastitis = false;
  }

  return {
    risk,
    riskTierLabel,
    probability,
    score: probability,
    hasMastitis,
    verdict,
    hindiVerdict,
    tamilVerdict,
    reasons,
    comparisons,
  };
}
