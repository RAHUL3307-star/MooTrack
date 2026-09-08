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
          age_years: number | null;
          age_months: number | null;
          rfid_tag: string | null;
          lactation: number;
          risk_level: "none" | "low" | "moderate" | "high";
          trend: "up" | "down" | "stable";

          ph?: number | null;
          conductivity?: number | null;
          weight?: number | null;
          temperature: number;
          activity: "low" | "normal" | "high";
          milk_yield: number;
          quarter: string;
          last_sync: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          name: string;
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
          weight?: number | null;
          temperature: number;
          activity: "low" | "normal" | "high";
          milk_yield: number;
          quarter: string;
          last_sync: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
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
          weight?: number | null;
          temperature?: number;
          activity?: "low" | "normal" | "high";
          milk_yield?: number;
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
          weight?: number | null;

          humidity: number | null;
          battery: number | null;
          rssi: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          cow_id: string;
          temperature: number;
          conductivity: number;
          ph?: number | null;
          weight?: number | null;

          humidity?: number | null;
          battery?: number | null;
          rssi?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          cow_id?: string;
          temperature?: number;
          conductivity?: number;
          ph?: number | null;
          weight?: number | null;

          humidity?: number | null;
          battery?: number | null;
          rssi?: number | null;
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
