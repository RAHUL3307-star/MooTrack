export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      animals: {
        Row: {
          id: string;
          name: string;
          species?: "Cow" | "Goat" | "Buffalo";
          herd_id?: string | null;
          breed: string;
          age: string;
          age_years: number | null;
          age_months: number | null;
          rfid_tag: string | null;
          lactation: number;
          risk_level: "none" | "low" | "moderate" | "high";
          trend: "up" | "down" | "stable";

          ph?: number | null;
          conductivity?: number | null;
          scc?: number | null;
          scs?: number | null;
          weight?: number | null;
          temperature: number;
          activity: "low" | "normal" | "high";
          milk_yield: number;
          rumination?: number | null;
          feeding?: number | null;
          ambient_temp?: number | null;
          humidity?: number | null;
          quarter: string;
          last_sync: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          name: string;
          species?: "Cow" | "Goat" | "Buffalo";
          herd_id?: string | null;
          breed: string;
          age: string;
          age_years?: number | null;
          age_months?: number | null;
          rfid_tag?: string | null;
          lactation: number;
          risk_level: "none" | "low" | "moderate" | "high";
          trend: "up" | "down" | "stable";

          ph?: number | null;
          conductivity?: number | null;
          scc?: number | null;
          scs?: number | null;
          weight?: number | null;
          temperature: number;
          activity: "low" | "normal" | "high";
          milk_yield: number;
          rumination?: number | null;
          feeding?: number | null;
          ambient_temp?: number | null;
          humidity?: number | null;
          quarter: string;
          last_sync: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          species?: "Cow" | "Goat" | "Buffalo";
          herd_id?: string | null;
          breed?: string;
          age?: string;
          age_years?: number | null;
          age_months?: number | null;
          rfid_tag?: string | null;
          lactation?: number;
          risk_level?: "none" | "low" | "moderate" | "high";
          trend?: "up" | "down" | "stable";

          ph?: number | null;
          conductivity?: number | null;
          scc?: number | null;
          scs?: number | null;
          weight?: number | null;
          temperature?: number;
          activity?: "low" | "normal" | "high";
          milk_yield?: number;
          rumination?: number | null;
          feeding?: number | null;
          ambient_temp?: number | null;
          humidity?: number | null;
          quarter?: string;
          last_sync?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      telemetry_logs: {
        Row: {
          id: string;
          device_id: string;
          cow_id: string;
          temperature: number;
          conductivity: number;
          ph?: number | null;
          scc?: number | null;
          scs?: number | null;
          ec_fl?: number | null;
          ec_fr?: number | null;
          ec_rl?: number | null;
          ec_rr?: number | null;
          quarter_ratio?: number | null;
          thermal_asymmetry?: number | null;
          weight?: number | null;
          activity?: number | null;
          shed_temp?: number | null;
          humidity: number | null;
          battery: number | null;
          rssi: number | null;
          risk_score?: number | null;
          risk_tier?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          cow_id: string;
          temperature: number;
          conductivity: number;
          ph?: number | null;
          scc?: number | null;
          scs?: number | null;
          ec_fl?: number | null;
          ec_fr?: number | null;
          ec_rl?: number | null;
          ec_rr?: number | null;
          quarter_ratio?: number | null;
          thermal_asymmetry?: number | null;
          weight?: number | null;
          activity?: number | null;
          shed_temp?: number | null;
          humidity?: number | null;
          battery?: number | null;
          rssi?: number | null;
          risk_score?: number | null;
          risk_tier?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          cow_id?: string;
          temperature?: number;
          conductivity?: number;
          ph?: number | null;
          scc?: number | null;
          scs?: number | null;
          ec_fl?: number | null;
          ec_fr?: number | null;
          ec_rl?: number | null;
          ec_rr?: number | null;
          quarter_ratio?: number | null;
          thermal_asymmetry?: number | null;
          weight?: number | null;
          activity?: number | null;
          shed_temp?: number | null;
          humidity?: number | null;
          battery?: number | null;
          rssi?: number | null;
          risk_score?: number | null;
          risk_tier?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          animal_id: string;
          risk_level: string;
          message: string;
          status: "active" | "acknowledged" | "resolved" | "escalated";
          urgency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          risk_level: string;
          message: string;
          status?: "active" | "acknowledged" | "resolved" | "escalated";
          urgency: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          risk_level?: string;
          message?: string;
          status?: "active" | "acknowledged" | "resolved" | "escalated";
          urgency?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      interventions: {
        Row: {
          id: string;
          animal_id: string;
          treatment_type: string;
          performed_by: string;
          notes: string | null;
          status: "completed" | "in_progress" | "scheduled";
          created_at: string;
        };
        Insert: {
          id?: string;
          animal_id: string;
          treatment_type: string;
          performed_by: string;
          notes?: string | null;
          status?: "completed" | "in_progress" | "scheduled";
          created_at?: string;
        };
        Update: {
          id?: string;
          animal_id?: string;
          treatment_type?: string;
          performed_by?: string;
          notes?: string | null;
          status?: "completed" | "in_progress" | "scheduled";
          created_at?: string;
        };
        Relationships: [];
      };
      sensors: {
        Row: {
          id: string;
          device_name: string;
          assigned_animal_id: string | null;
          battery_level: number;
          status: "online" | "offline" | "warning";
          last_ping: string;
        };
        Insert: {
          id: string;
          device_name: string;
          assigned_animal_id?: string | null;
          battery_level: number;
          status: "online" | "offline" | "warning";
          last_ping: string;
        };
        Update: {
          id?: string;
          device_name?: string;
          assigned_animal_id?: string | null;
          battery_level?: number;
          status?: "online" | "offline" | "warning";
          last_ping?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
