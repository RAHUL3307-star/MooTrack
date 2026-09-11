import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ANIMALS } from "../types/index";
import type { Animal, RiskLevel } from "../types/index";

// Bump this version whenever ANIMALS data changes — forces a reseed
const DATA_VERSION = "v5-multi-herd-scc";

const OLD_NAME_MAP: Record<string, string> = {
  "Ganga": "Cow 1 (Gauri)",
  "Kaveri": "Cow 2 (Kamdhenu)",
  "Saraswati": "Cow 3 (Lakshmi)",
  "Narmada": "Cow 4 (Nandini)",
  "Yamuna": "Cow 5 (Shanti)",
  "Godavari": "Cow 6 (Kalyani)",
  "Chambal": "Cow 7",
  "Betwa": "Cow 8",
};

export function normalizeCowName(id: string, name?: string): string {
  if (name && OLD_NAME_MAP[name]) return OLD_NAME_MAP[name];
  const standard = ANIMALS.find((a) => a.id === id);
  if (standard) return standard.name;
  if (OLD_NAME_MAP[id]) return OLD_NAME_MAP[id];
  return name || id;
}

// ─── Fetch Animals ────────────────────────────────────────────────────────────
export async function fetchAnimals(): Promise<Animal[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.info("[animalService] Supabase not configured — using local seed data.");
    return ANIMALS;
  }

  try {
    const { data, error } = await supabase
      .from("animals")
      .select("*")
      .order("id");

    if (error || !data || data.length === 0) {
      console.warn("[animalService] Supabase query failed or empty — falling back to local data:", error?.message);
      return ANIMALS;
    }

    // Map Supabase rows to app Animal interface with normalized names
    return data.map((row) => ({
      id: row.id,
      name: normalizeCowName(row.id, row.name),
      species: (row.species as "Cow" | "Goat" | "Buffalo") || (row.id.startsWith("GT") ? "Goat" : row.id.startsWith("BF") ? "Buffalo" : "Cow"),
      herdId: row.herd_id ?? undefined,
      breed: row.breed,
      age: row.age,
      ageYears: row.age_years ?? undefined,
      ageMonths: row.age_months ?? undefined,
      rfidTag: row.rfid_tag ?? undefined,
      lactation: row.lactation,
      risk: row.risk_level as RiskLevel,
      trend: row.trend,
      ph: row.ph ?? 6.6,
      conductivity: row.conductivity ?? 5.2,
      scc: row.scc ?? undefined,
      scs: row.scs ?? undefined,
      weight: row.weight ?? 12.0,
      temp: row.temperature,
      activity: row.activity,
      milk: row.milk_yield,
      rumination: row.rumination ?? undefined,
      feeding: row.feeding ?? undefined,
      ambientTemp: row.ambient_temp ?? undefined,
      humidity: row.humidity ?? undefined,
      lastSync: row.last_sync,
      quarter: row.quarter,
    }));
  } catch (err) {
    console.warn("[animalService] Network error — falling back to local data:", err);
    return ANIMALS;
  }
}

// ─── Update Animal Risk ───────────────────────────────────────────────────────
export async function updateAnimalRisk(
  animalId: string,
  risk: RiskLevel,
  conductivity: number,
  temp: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("animals")
    .update({
      risk_level: risk,
      conductivity,
      temperature: temp,
      last_sync: new Date().toLocaleTimeString("en-IN"),
    })
    .eq("id", animalId);

  if (error) {
    console.error("[animalService] updateAnimalRisk error:", error.message);
    return false;
  }
  return true;
}

// ─── Seed Initial Animals (Cow / Goat / Buffalo Multi-Herd) ──────────────────
export async function seedAnimals(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const storedVersion = localStorage.getItem("mootracker_data_version");

  // If already seeded with an older version, wipe and re-seed to ensure clean names
  if (storedVersion !== DATA_VERSION) {
    console.info(`[animalService] Upgrading data to ${DATA_VERSION}: resetting names and herds...`);

    for (const a of ANIMALS) {
      await supabase
        .from("animals")
        .upsert({
          id: a.id,
          name: a.name,
          species: a.species ?? "Cow",
          herd_id: a.herdId ?? null,
          breed: a.breed,
          age: a.age,
          age_years: a.ageYears ?? null,
          age_months: a.ageMonths ?? null,
          rfid_tag: a.rfidTag ?? null,
          lactation: a.lactation,
          risk_level: a.risk,
          trend: a.trend,
          ph: a.ph ?? 6.6,
          conductivity: a.conductivity ?? 5.2,
          scc: a.scc ?? null,
          scs: a.scs ?? null,
          weight: a.weight ?? 12.0,
          temperature: a.temp,
          activity: a.activity,
          milk_yield: a.milk,
          rumination: a.rumination ?? null,
          feeding: a.feeding ?? null,
          ambient_temp: a.ambientTemp ?? null,
          humidity: a.humidity ?? null,
          last_sync: a.lastSync,
          quarter: a.quarter,
        }, { onConflict: "id" });
    }

    localStorage.setItem("mootracker_data_version", DATA_VERSION);
    console.info("[animalService] Animal records updated in Supabase.");
    return;
  }

  // First time setup — insert if table is empty
  const { data: existing } = await supabase.from("animals").select("id").limit(1);
  if (existing && existing.length > 0) return;

  const rows = ANIMALS.map((a) => ({
    id: a.id,
    name: a.name,
    species: a.species ?? "Cow",
    herd_id: a.herdId ?? null,
    breed: a.breed,
    age: a.age,
    age_years: a.ageYears ?? null,
    age_months: a.ageMonths ?? null,
    rfid_tag: a.rfidTag ?? null,
    lactation: a.lactation,
    risk_level: a.risk,
    trend: a.trend,
    ph: a.ph ?? 6.6,
    conductivity: a.conductivity ?? 5.2,
    scc: a.scc ?? null,
    scs: a.scs ?? null,
    weight: a.weight ?? 12.0,
    temperature: a.temp,
    activity: a.activity,
    milk_yield: a.milk,
    rumination: a.rumination ?? null,
    feeding: a.feeding ?? null,
    ambient_temp: a.ambientTemp ?? null,
    humidity: a.humidity ?? null,
    last_sync: a.lastSync,
    quarter: a.quarter,
  }));

  const { error } = await supabase.from("animals").insert(rows);
  if (error) console.error("[animalService] Seed failed:", error.message);
  else {
    localStorage.setItem("mootracker_data_version", DATA_VERSION);
    console.info("[animalService] Animals seeded to Supabase.");
  }
}
