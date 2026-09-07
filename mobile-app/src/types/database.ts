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
          breed: string;
          age: string;
          lactation: number;
          risk_level: "none" | "low" | "moderate" | "high";
          trend: "up" | "down" | "stable";
          scc: number;
          temperature: number;
          activity: "low" | "normal" | "high";
          milk_yield: number;
          quarter: string;
          last_sync: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["animals"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["animals"]["Insert"]>;
      };
      telemetry_logs: {
        Row: {
          id: string;
          device_id: string;
          cow_id: string;
          temperature: number;
          conductivity: number;
          scc: number;
          humidity: number | null;
          battery: number | null;
          rssi: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["telemetry_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["telemetry_logs"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["interventions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["interventions"]["Insert"]>;
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
        Insert: Database["public"]["Tables"]["sensors"]["Row"];
        Update: Partial<Database["public"]["Tables"]["sensors"]["Insert"]>;
      };
    };
  };
}
