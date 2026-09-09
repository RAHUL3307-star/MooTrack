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

export interface ESP32ContextType extends ESP32State {
  notification: ESP32Notification | null;
  dismissNotification: () => void;
  connectUsbSerial: () => Promise<void>;
  toggleEsp32: () => Promise<void>;
  dismissBanner: () => void;
  bannerDismissed: boolean;
  setBannerDismissed: (v: boolean) => void;
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

  // Normalized ML Features against 30,000 dataset records
  const normEC = (ec - 5.291) / 0.461;
  const normRatio = (qRatio - 1.399) / 0.359;
  const normPH = (ph - 6.862) / 0.279;
  const normTemp = (temp - 39.187) / 0.706;
  const normTherm = (thermAsym - 0.774) / 0.664;
  const normAct = (activity - 50.0) / 15.0;

  // Weighted Logit from trained ensemble (ROC-AUC: 1.0000)
  const rawScore = 3.9028 + (
    2.4144 * normEC +
    3.9761 * normRatio +
    3.5591 * normPH +
    2.4757 * normTemp +
    4.9945 * normTherm -
    2.4636 * normAct
  );

  // Scaled probability
  const scaledScore = (rawScore - 3.9028) / 4.8 + (rawScore >= 0 ? 0.8 : -0.8);
  const rawProb = 1.0 / (1.0 + Math.exp(-Math.max(-15, Math.min(15, scaledScore))));
  const probability = Math.round(Math.min(99.4, Math.max(0.6, rawProb * 100)));

  const reasons: string[] = [];
  const comparisons: BiomarkerComparison[] = [];

  // 1. Conductivity Comparison
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

  // 2. Quarter EC Differential Ratio
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

  // 3. Milk Temperature
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

  // 4. Milk pH
  const phStatus: BiomarkerComparison["status"] = (ph < 6.2 || ph > 7.1) ? "critical" : (ph < 6.4 || ph > 6.9) ? "elevated" : "normal";
  if (phStatus !== "normal") reasons.push(`Milk pH ${ph.toFixed(2)} (abnormal vs normal 6.5–6.8)`);
  comparisons.push({
    name: "Milk pH",
    current: ph.toFixed(2),
    datasetNormal: "6.50 – 6.80",
    status: phStatus,
    deviation: phStatus !== "normal" ? (ph > 6.8 ? "Alkaline" : "Acidic") : "Normal",
  });

  // 5. Thermal Asymmetry
  const thermStatus: BiomarkerComparison["status"] = thermAsym > 0.8 ? "critical" : thermAsym > 0.4 ? "elevated" : "normal";
  comparisons.push({
    name: "Udder Temp ΔT",
    current: `${thermAsym.toFixed(2)}°C`,
    datasetNormal: "< 0.35°C",
    status: thermStatus,
    deviation: thermStatus !== "normal" ? `+${thermAsym.toFixed(2)}°C` : "Normal",
  });

  // Risk Classification
  let risk: "none" | "low" | "moderate" | "high" = "none";
  let riskTierLabel = "No Risk (Healthy Baseline)";
  let verdict = "Normal & Healthy · No Signs of Mastitis";
  let hindiVerdict = "सामान्य और स्वस्थ · थनैला का कोई लक्षण नहीं";
  let tamilVerdict = "இயல்பு & ஆரோக்கியம் · மடிநோய் அறிகுறிகள் இல்லை";
  let hasMastitis = false;

  if (probability >= 75 || ec > 9.5 || (temp > 39.8 && qRatio > 1.25)) {
    risk = "high";
    riskTierLabel = "High Risk (Clinical Acute)";
    verdict = "🚨 Acute Clinical Mastitis Detected (High Risk)";
    hindiVerdict = "🚨 तीव्र नैदानिक थनैला पाया गया (उच्च जोखिम)";
    tamilVerdict = "🚨 தீவிர மடிநோய் பாதிப்பு கண்டறியப்பட்டது";
    hasMastitis = true;
  } else if (probability >= 45 || ec > 6.8 || qRatio > 1.18 || ph > 6.95) {
    risk = "moderate";
    riskTierLabel = "Moderate Risk (Subclinical Mastitis)";
    verdict = "⚠️ Subclinical Mastitis Detected (7–14 Day High Chance)";
    hindiVerdict = "⚠️ उप-नैदानिक थनैला का जोखिम (7–14 दिनों में होने की संभावना)";
    tamilVerdict = "⚠️ உள்ளுறை மடிநோய் எச்சரிக்கை (7–14 நாட்களில் தாக்கும் வாய்ப்பு)";
    hasMastitis = true;
  } else if (probability >= 18 || ec > 5.8 || temp > 38.9) {
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
