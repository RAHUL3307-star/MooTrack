import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface InterventionRecord {
  id: string;
  animal_id: string;
  treatment_type: string;
  performed_by: string;
  notes: string | null;
  status: "completed" | "in_progress" | "scheduled";
  created_at: string;
}

const LOCAL_INTERVENTIONS: InterventionRecord[] = [
  {
    id: "int-001",
    animal_id: "KA-001",
    treatment_type: "CMT Test",
    performed_by: "Dr. Sharma",
    notes: "Lab results pending. Rear-right quarter showed strong positive.",
    status: "in_progress",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "int-002",
    animal_id: "KA-052",
    treatment_type: "Isolation + Iodine Teat Dip",
    performed_by: "Ramesh Patel",
    notes: "Isolated to Pen B. Iodine dipping 3x daily.",
    status: "in_progress",
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "int-003",
    animal_id: "KA-014",
    treatment_type: "Recovery Monitoring",
    performed_by: "Dr. Sharma",
    notes: "SCC reduced by 52%. Full recovery confirmed.",
    status: "completed",
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export async function fetchInterventions(animalId?: string): Promise<InterventionRecord[]> {
  if (!isSupabaseConfigured || !supabase) {
    return animalId
      ? LOCAL_INTERVENTIONS.filter((i) => i.animal_id === animalId)
      : LOCAL_INTERVENTIONS;
  }

  try {
    let query = supabase.from("interventions").select("*").order("created_at", { ascending: false });
    if (animalId) query = query.eq("animal_id", animalId);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return LOCAL_INTERVENTIONS;
    return data as InterventionRecord[];
  } catch {
    return LOCAL_INTERVENTIONS;
  }
}

export async function logIntervention(
  animalId: string,
  treatmentType: string,
  performedBy: string,
  notes: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return true;

  const { error } = await supabase.from("interventions").insert({
    animal_id: animalId,
    treatment_type: treatmentType,
    performed_by: performedBy,
    notes,
    status: "completed",
  });

  return !error;
}
