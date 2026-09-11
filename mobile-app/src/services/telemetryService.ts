import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { ESP32Telemetry } from "../types/esp32";

export async function logTelemetry(
  deviceId: string,
  telemetry: ESP32Telemetry
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true; // silent pass in offline mode

  const { error } = await supabase.from("telemetry_logs").insert({
    device_id: deviceId,
    cow_id: telemetry.cowId ?? "unknown",
    temperature: telemetry.temp,
    ph: telemetry.ph ?? null,
    conductivity: telemetry.conductivity ?? 0,
    scc: telemetry.scc ?? null,
    scs: telemetry.scs ?? null,
    ec_fl: telemetry.ec_fl ?? null,
    ec_fr: telemetry.ec_fr ?? null,
    ec_rl: telemetry.ec_rl ?? null,
    ec_rr: telemetry.ec_rr ?? null,
    quarter_ratio: telemetry.quarterRatio ?? null,
    thermal_asymmetry: telemetry.thermalAsymmetry ?? null,
    weight: telemetry.weight ?? null,
    activity: telemetry.activity ?? null,
    shed_temp: telemetry.shedTemp ?? null,
    humidity: telemetry.humidity ?? null,
    battery: telemetry.battery ?? null,
    rssi: telemetry.rssi ?? null,
    risk_score: telemetry.riskScore ?? null,
    risk_tier: telemetry.riskTier ?? null,
  });

  if (error) {
    console.warn("[telemetryService] logTelemetry failed:", error.message);
    return false;
  }
  return true;
}

export async function fetchRecentTelemetry(
  cowId: string,
  limit = 20
): Promise<object[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from("telemetry_logs")
    .select("*")
    .eq("cow_id", cowId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}
