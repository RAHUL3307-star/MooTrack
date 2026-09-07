import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { ANIMALS } from "../types/index";
import type { Animal, RiskLevel } from "../types/index";

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
      .order("name");

    if (error || !data || data.length === 0) {
      console.warn("[animalService] Supabase query failed or empty — falling back to local data:", error?.message);
      return ANIMALS;
    }

    // Map Supabase rows to app Animal interface
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      breed: row.breed,
      age: row.age,
      lactation: row.lactation,
      risk: row.risk_level as RiskLevel,
      trend: row.trend,
      scc: row.scc,
      temp: row.temperature,
      activity: row.activity,
      milk: row.milk_yield,
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
  scc: number,
  temp: number
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from("animals")
    .update({
      risk_level: risk,
      scc,
      temperature: temp,
      last_sync: new Date().toLocaleTimeString("en-IN"),
    })
    .eq("id", animalId);

  if (error) {
    console.error("[animalService] updateAnimalRisk failed:", error.message);
    return false;
  }
  return true;
}

// ─── Seed Animals (first-time setup) ─────────────────────────────────────────
export async function seedAnimals(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const { data: existing } = await supabase.from("animals").select("id").limit(1);
  if (existing && existing.length > 0) return; // already seeded

  const rows = ANIMALS.map((a) => ({
    id: a.id,
    name: a.name,
    breed: a.breed,
    age: a.age,
    lactation: a.lactation,
    risk_level: a.risk,
    trend: a.trend,
    scc: a.scc,
    temperature: a.temp,
    activity: a.activity,
    milk_yield: a.milk,
    last_sync: a.lastSync,
    quarter: a.quarter,
  }));

  const { error } = await supabase.from("animals").insert(rows);
  if (error) console.error("[animalService] Seed failed:", error.message);
  else console.info("[animalService] Animals seeded to Supabase.");
}
