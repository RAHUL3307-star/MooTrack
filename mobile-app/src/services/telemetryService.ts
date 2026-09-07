import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { ESP32Telemetry } from "../types/esp32";

export async function logTelemetry(
  deviceId: string,
  telemetry: ESP32Telemetry
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true; // silent pass in offline mode

  const { error } = await supabase.from("telemetry_logs").insert({
    device_id: deviceId,
    cow_id: telemetry.cowId,
    temperature: telemetry.temp,
    conductivity: telemetry.conductivity,
    scc: telemetry.scc,
    humidity: telemetry.humidity ?? null,
    battery: telemetry.battery ?? null,
    rssi: telemetry.rssi ?? null,
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
