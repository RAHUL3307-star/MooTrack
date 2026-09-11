export type Screen =
  | "splash" | "language" | "login" | "home" | "animals" | "animal-profile"
  | "ai-risk" | "alerts" | "recommendations" | "analytics" | "sensors"
  | "gis" | "interventions" | "profile" | "ml-lab" | "visual-ai";

export type RiskLevel = "none" | "low" | "moderate" | "high";

export type Tab = "home" | "animals" | "alerts" | "analytics" | "profile";

export interface VisualScanResult {
  erythemaScore: number;       // 0-100% (Redness / Acute inflammation)
  asymmetryRatio: number;      // 1.0 (symmetric) to 2.5+ (severe asymmetry)
  teatGrade: number;           // 1 (normal) to 4 (severe hyperkeratosis / cracks)
  bcs: number;                 // Body Condition Score (1.0 to 5.0)
  visualRisk: number;          // 0-100% visual mastitis risk
  riskLevel: RiskLevel;
  affectedQuarter: string;
  clinicalNotes: string;
  timestamp: string;
  imagePreviewUrl?: string;
  matchedDatasetCase?: string;
  matchedDatasetImage?: string;
  datasetMatchSimilarity?: number;
  bovineConfidence?: number;
}

export interface Animal {
  id: string;
  name: string;
  species?: "Cow" | "Goat" | "Buffalo";
  herdId?: string;              // Which herd this animal belongs to
  breed: string;
  age: string;
  ageYears?: number;
  ageMonths?: number;
  rfidTag?: string;
  lactation: number;
  risk: RiskLevel;
  trend: "up" | "down" | "stable";
  // Real sensor readings & Somatic Cell Count
  temp: number;           // DS18B20 milk temperature °C
  ph?: number;            // pH electrode reading
  conductivity: number;   // EC probe mS/cm
  scc?: number;           // Somatic Cell Count (cells/mL)
  scs?: number;           // Somatic Cell Score (log2 scale)
  weight?: number;        // HX711 milk weight kg
  activity: "low" | "normal" | "high"; // MPU6050 movement
  milk: number;
  // Extended health & environment parameters
  rumination?: number;    // Rumination time (minutes/day)
  feeding?: number;       // Feeding time (minutes/day)
  ambientTemp?: number;   // Ambient temperature (°C)
  humidity?: number;      // Humidity (%)
  lastSync: string;
  quarter: string;
  lastVisualScan?: VisualScanResult;
}

// ── Multi-Herd Support ────────────────────────────────────────────────────────

export interface Herd {
  id: string;
  name: string;
  location: string;
  description?: string;
}

export const HERDS: Herd[] = [
  { id: "HERD_A", name: "Herd A \u2013 Main Barn",    location: "Anand, Gujarat",       description: "Primary lactating herd" },
  { id: "HERD_B", name: "Herd B \u2013 East Field",   location: "Karnal, Haryana",      description: "Mixed breed herd" },
  { id: "HERD_C", name: "Herd C \u2013 Young Stock",  location: "Bengaluru, Karnataka", description: "Heifers & dry cows" },
];

// ─────────────────────────────────────────────────────────────────────────────

export interface RiskColorMap {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const RISK_COLOR: Record<RiskLevel, RiskColorMap> = {
  none:     { bg: "#E6F4E4", text: "#2D7A26", border: "#B8DBBA", dot: "#2D7A26" },
  low:      { bg: "#EEF6E4", text: "#4F8823", border: "#C4DDA0", dot: "#5E9E2A" },
  moderate: { bg: "#FEF3E2", text: "#C47A10", border: "#F0C882", dot: "#C47A10" },
  high:     { bg: "#FCE8E5", text: "#B83220", border: "#F0B4AA", dot: "#B83220" },
};

export const ANIMALS: Animal[] = [
  { id: "KA-001", name: "Cow 1 (Gauri)",      species: "Cow",     herdId: "HERD_A", breed: "HF Cross",  age: "5y 3m", ageYears: 5, ageMonths: 3, rfidTag: "RFID-001", lactation: 3, risk: "high",     trend: "up",     temp: 39.4, ph: 6.1, conductivity: 12.4, scc: 1850000, scs: 7.2, activity: "low",    milk: 10.2, rumination: 210, feeding: 140, ambientTemp: 28.4, humidity: 72, lastSync: "8 min ago",  quarter: "Front-Right" },
  { id: "KA-007", name: "Cow 2 (Kamdhenu)",   species: "Cow",     herdId: "HERD_A", breed: "Sahiwal",   age: "4y 1m", ageYears: 4, ageMonths: 1, rfidTag: "RFID-007", lactation: 2, risk: "moderate", trend: "up",     temp: 38.9, ph: 6.3, conductivity: 9.8,  scc: 480000,  scs: 5.3, activity: "normal", milk: 14.8, rumination: 285, feeding: 185, ambientTemp: 27.9, humidity: 69, lastSync: "12 min ago", quarter: "Rear-Left"   },
  { id: "GT-001", name: "Goat 1 (Chandani)",  species: "Goat",    herdId: "HERD_B", breed: "Jamnapari", age: "3y 0m", ageYears: 3, ageMonths: 0, rfidTag: "RFID-G01", lactation: 2, risk: "high",     trend: "up",     temp: 40.1, ph: 7.1, conductivity: 13.8, scc: 1650000, scs: 7.0, activity: "low",    milk: 1.4,  rumination: 195, feeding: 125, ambientTemp: 29.2, humidity: 75, lastSync: "3 min ago",  quarter: "Right Half"  },
  { id: "GT-002", name: "Goat 2 (Roshni)",    species: "Goat",    herdId: "HERD_B", breed: "Sirohi",    age: "2y 4m", ageYears: 2, ageMonths: 4, rfidTag: "RFID-G02", lactation: 1, risk: "low",      trend: "stable", temp: 38.8, ph: 6.6, conductivity: 5.1,  scc: 480000,  scs: 4.2, activity: "high",   milk: 2.8,  rumination: 340, feeding: 215, ambientTemp: 28.1, humidity: 68, lastSync: "5 min ago",  quarter: "Both Clear"  },
  { id: "KA-014", name: "Cow 3 (Lakshmi)",    species: "Cow",     herdId: "HERD_A", breed: "Jersey X",  age: "6y 8m", ageYears: 6, ageMonths: 8, rfidTag: "RFID-014", lactation: 5, risk: "moderate", trend: "stable", temp: 38.7, ph: 6.5, conductivity: 8.9,  scc: 360000,  scs: 4.8, activity: "normal", milk: 9.6,  rumination: 310, feeding: 195, ambientTemp: 28.0, humidity: 70, lastSync: "5 min ago",  quarter: "All Clear"   },
  { id: "BF-001", name: "Buffalo 1 (Durga)",  species: "Buffalo", herdId: "HERD_A", breed: "Murrah",    age: "6y 0m", ageYears: 6, ageMonths: 0, rfidTag: "RFID-B01", lactation: 4, risk: "high",     trend: "up",     temp: 39.8, ph: 7.1, conductivity: 14.0, scc: 1950000, scs: 7.4, activity: "low",    milk: 9.8,  rumination: 205, feeding: 130, ambientTemp: 28.8, humidity: 74, lastSync: "1 min ago",  quarter: "Front-Right" },
  { id: "KA-022", name: "Cow 4 (Nandini)",    species: "Cow",     herdId: "HERD_B", breed: "Gir Cow",   age: "3y 2m", ageYears: 3, ageMonths: 2, rfidTag: "RFID-022", lactation: 1, risk: "low",      trend: "down",   temp: 38.5, ph: 6.6, conductivity: 6.2,  scc: 140000,  scs: 3.5, activity: "high",   milk: 18.4, rumination: 355, feeding: 220, ambientTemp: 27.5, humidity: 65, lastSync: "3 min ago",  quarter: "All Clear"   },
  { id: "GT-003", name: "Goat 3 (Heera)",     species: "Goat",    herdId: "HERD_C", breed: "Beetal",    age: "4y 2m", ageYears: 4, ageMonths: 2, rfidTag: "RFID-G03", lactation: 3, risk: "moderate", trend: "up",     temp: 39.5, ph: 6.9, conductivity: 9.2,  scc: 920000,  scs: 5.8, activity: "normal", milk: 2.1,  rumination: 265, feeding: 165, ambientTemp: 29.0, humidity: 73, lastSync: "9 min ago",  quarter: "Left Half"   },
  { id: "KA-031", name: "Cow 5 (Shanti)",     species: "Cow",     herdId: "HERD_B", breed: "Sahiwal",   age: "4y 6m", ageYears: 4, ageMonths: 6, rfidTag: "RFID-031", lactation: 3, risk: "none",     trend: "stable", temp: 38.4, ph: 6.7, conductivity: 5.1,  scc: 65000,   scs: 2.7, activity: "normal", milk: 19.2, rumination: 370, feeding: 230, ambientTemp: 27.2, humidity: 63, lastSync: "6 min ago",  quarter: "All Clear"   },
  { id: "KA-052", name: "Cow 6 (Kalyani)",    species: "Cow",     herdId: "HERD_C", breed: "HF Cross",  age: "5y 5m", ageYears: 5, ageMonths: 5, rfidTag: "RFID-052", lactation: 4, risk: "high",     trend: "up",     temp: 39.6, ph: 5.9, conductivity: 14.2, scc: 2200000, scs: 7.5, activity: "low",    milk: 8.4,  rumination: 190, feeding: 120, ambientTemp: 29.5, humidity: 77, lastSync: "22 min ago", quarter: "Rear-Right"  },
];
