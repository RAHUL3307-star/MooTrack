export type Screen =
  | "splash" | "language" | "login" | "home" | "animals" | "animal-profile"
  | "ai-risk" | "alerts" | "recommendations" | "analytics" | "sensors"
  | "gis" | "interventions" | "profile" | "ml-lab";

export type RiskLevel = "none" | "low" | "moderate" | "high";

export type Tab = "home" | "animals" | "alerts" | "analytics" | "profile";

export interface Animal {
  id: string;
  name: string;
  breed: string;
  age: string;
  ageYears?: number;
  ageMonths?: number;
  rfidTag?: string;
  lactation: number;
  risk: RiskLevel;
  trend: "up" | "down" | "stable";
  scc: number;
  temp: number;
  activity: "low" | "normal" | "high";
  milk: number;
  lastSync: string;
  quarter: string;
}

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
  { id: "KA-001", name: "Cow 1", breed: "HF Cross",    age: "5y 3m", ageYears: 5, ageMonths: 3,  rfidTag: "RFID-001", lactation: 3, risk: "high",     trend: "up",     scc: 485, temp: 39.4, activity: "low",    milk: 10.2, lastSync: "8 min ago",  quarter: "Front-Right" },
  { id: "KA-007", name: "Cow 2", breed: "Murrah Buf.", age: "4y 1m", ageYears: 4, ageMonths: 1,  rfidTag: "RFID-007", lactation: 2, risk: "moderate", trend: "up",     scc: 312, temp: 38.9, activity: "normal", milk: 14.8, lastSync: "12 min ago", quarter: "Rear-Left"   },
  { id: "KA-014", name: "Cow 3", breed: "Sahiwal",     age: "6y 8m", ageYears: 6, ageMonths: 8,  rfidTag: "RFID-014", lactation: 5, risk: "moderate", trend: "stable", scc: 248, temp: 38.7, activity: "normal", milk: 9.6,  lastSync: "5 min ago",  quarter: "All Clear"   },
  { id: "KA-022", name: "Cow 4", breed: "Jersey X",   age: "3y 2m", ageYears: 3, ageMonths: 2,  rfidTag: "RFID-022", lactation: 1, risk: "low",      trend: "down",   scc: 145, temp: 38.5, activity: "high",   milk: 18.4, lastSync: "3 min ago",  quarter: "All Clear"   },
  { id: "KA-031", name: "Cow 5", breed: "HF Cross",   age: "4y 6m", ageYears: 4, ageMonths: 6,  rfidTag: "RFID-031", lactation: 3, risk: "none",     trend: "stable", scc: 82,  temp: 38.4, activity: "normal", milk: 19.2, lastSync: "6 min ago",  quarter: "All Clear"   },
  { id: "KA-038", name: "Cow 6", breed: "Gir",         age: "7y 0m", ageYears: 7, ageMonths: 0,  rfidTag: "RFID-038", lactation: 6, risk: "low",      trend: "stable", scc: 178, temp: 38.6, activity: "normal", milk: 7.8,  lastSync: "15 min ago", quarter: "All Clear"   },
  { id: "KA-045", name: "Cow 7", breed: "Sahiwal",     age: "2y 9m", ageYears: 2, ageMonths: 9,  rfidTag: "RFID-045", lactation: 1, risk: "none",     trend: "stable", scc: 68,  temp: 38.3, activity: "high",   milk: 12.1, lastSync: "4 min ago",  quarter: "All Clear"   },
  { id: "KA-052", name: "Cow 8", breed: "HF Cross",   age: "5y 5m", ageYears: 5, ageMonths: 5,  rfidTag: "RFID-052", lactation: 4, risk: "high",     trend: "up",     scc: 620, temp: 39.6, activity: "low",    milk: 8.4,  lastSync: "22 min ago", quarter: "Rear-Right"  },
];
