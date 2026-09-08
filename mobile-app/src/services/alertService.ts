import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface AlertItem {
  id: string;
  animal_id: string;
  risk_level: string;
  message: string;
  status: "active" | "acknowledged" | "resolved" | "escalated";
  urgency: string;
  created_at: string;
}

// ─── Local Fallback ───────────────────────────────────────────────────────────
const LOCAL_ALERTS: AlertItem[] = [
  {
    id: "alert-001",
    animal_id: "KA-001",
    risk_level: "high",
    message: "Cow 1 — SCC critical: 485,000 cells/mL. Fever 39.4°C. Immediate teat inspection required.",
    status: "active",
    urgency: "Immediate",
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-002",
    animal_id: "KA-052",
    risk_level: "high",
    message: "Cow 8 — SCC 620,000 cells/mL. Rear-Right quarter affected. Veterinary escalation required.",
    status: "active",
    urgency: "Critical",
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: "alert-003",
    animal_id: "KA-007",
    risk_level: "moderate",
    message: "Cow 2 — Rising SCC trend. Pre-milking teat dipping recommended.",
    status: "active",
    urgency: "Monitor",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

// ─── Fetch Alerts ─────────────────────────────────────────────────────────────
export async function fetchAlerts(status?: string): Promise<AlertItem[]> {
  if (!isSupabaseConfigured || !supabase) return LOCAL_ALERTS;

  try {
    let query = supabase.from("alerts").select("*").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status as AlertItem["status"]);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      console.warn("[alertService] Fallback to local alerts:", error?.message);
      return LOCAL_ALERTS;
    }
    return data as AlertItem[];
  } catch {
    return LOCAL_ALERTS;
  }
}

// ─── Acknowledge Alert ────────────────────────────────────────────────────────
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true; // optimistic in offline mode

  const { error } = await supabase
    .from("alerts")
    .update({ status: "acknowledged" })
    .eq("id", alertId);

  return !error;
}

// ─── Escalate Alert ───────────────────────────────────────────────────────────
export async function escalateAlert(alertId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  const { error } = await supabase
    .from("alerts")
    .update({ status: "escalated" })
    .eq("id", alertId);

  return !error;
}

// ─── Create Alert ─────────────────────────────────────────────────────────────
export async function createAlert(
  animalId: string,
  riskLevel: string,
  message: string,
  urgency: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  const { error } = await supabase.from("alerts").insert({
    animal_id: animalId,
    risk_level: riskLevel,
    message,
    status: "active",
    urgency,
  });

  return !error;
}
