-- ============================================================================
-- MooTracker · Supabase Database Schema
-- Organization: COw sensing
-- Project: cow-sensing-db / MooTracker-core
-- Problem Statement: #26109 (ICAR-NRC Bovine Mastitis Early Detection)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Farmers & Farm Organizations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL DEFAULT 'Ramesh Patel',
    phone_number TEXT NOT NULL DEFAULT '+919876543210',
    farm_name TEXT NOT NULL DEFAULT 'Shri Balaji Dairy Farm',
    organization TEXT NOT NULL DEFAULT 'COw sensing',
    location TEXT NOT NULL DEFAULT 'Anand, Gujarat, India',
    preferred_language TEXT NOT NULL DEFAULT 'Tamil',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── 2. Animals (Cattle Registry) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.animals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    age TEXT NOT NULL,
    lactation INTEGER NOT NULL DEFAULT 1,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('none', 'low', 'moderate', 'high')),
    trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
    scc INTEGER NOT NULL DEFAULT 100, -- Somatic Cell Count (thousands/mL)
    temperature NUMERIC(4,1) NOT NULL DEFAULT 38.5, -- Celsius
    activity TEXT NOT NULL CHECK (activity IN ('low', 'normal', 'high')),
    milk_yield NUMERIC(4,1) NOT NULL DEFAULT 12.0, -- Liters/day
    quarter TEXT NOT NULL DEFAULT 'All Clear',
    last_sync TEXT NOT NULL DEFAULT 'Just now',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── 3. IoT Sensor Devices ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sensors (
    id TEXT PRIMARY KEY,
    device_name TEXT NOT NULL,
    assigned_animal_id TEXT REFERENCES public.animals(id) ON DELETE SET NULL,
    battery_level INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'warning')),
    firmware_version TEXT NOT NULL DEFAULT 'v2.4.1-esp32',
    baud_rate INTEGER NOT NULL DEFAULT 115200,
    last_ping TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── 4. Live ESP32 Telemetry Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL DEFAULT 'ESP32-HARDWARE-WROOM32',
    cow_id TEXT NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    temperature NUMERIC(4,2) NOT NULL,
    conductivity NUMERIC(5,2) NOT NULL, -- Milk Electrical Conductivity in mS/cm
    scc BIGINT NOT NULL DEFAULT 2450000, -- Cells / mL
    humidity NUMERIC(4,1),
    battery INTEGER,
    rssi INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for high-throughput sensor telemetry queries
CREATE INDEX IF NOT EXISTS idx_telemetry_cow_id ON public.telemetry_logs(cow_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.telemetry_logs(created_at DESC);

-- ── 5. AI Risk Alerts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id TEXT NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    message TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'Immediate',
    recommended_action TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved', 'escalated')) DEFAULT 'active',
    whatsapp_notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_animal ON public.alerts(animal_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);

-- ── 6. Clinical Interventions & Protocols ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    animal_id TEXT NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    treatment_type TEXT NOT NULL,
    performed_by TEXT NOT NULL DEFAULT 'Farmer / Dr. Sharma',
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('completed', 'in_progress', 'scheduled')) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ── 7. Enable Row Level Security (RLS) ───────────────────────────────────────
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- ── 8. Public / Anon Access Policies (for Edge IoT & App Client) ───────────
CREATE POLICY "Allow anon read farmers" ON public.farmers FOR SELECT USING (true);
CREATE POLICY "Allow anon update farmers" ON public.farmers FOR UPDATE USING (true);

CREATE POLICY "Allow anon read animals" ON public.animals FOR SELECT USING (true);
CREATE POLICY "Allow anon insert animals" ON public.animals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update animals" ON public.animals FOR UPDATE USING (true);

CREATE POLICY "Allow anon read sensors" ON public.sensors FOR SELECT USING (true);
CREATE POLICY "Allow anon update sensors" ON public.sensors FOR UPDATE USING (true);

CREATE POLICY "Allow anon read telemetry_logs" ON public.telemetry_logs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert telemetry_logs" ON public.telemetry_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon read alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow anon insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update alerts" ON public.alerts FOR UPDATE USING (true);

CREATE POLICY "Allow anon read interventions" ON public.interventions FOR SELECT USING (true);
CREATE POLICY "Allow anon insert interventions" ON public.interventions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update interventions" ON public.interventions FOR UPDATE USING (true);

-- ── 9. Seed Initial Data (COw sensing Organization) ─────────────────────────
INSERT INTO public.farmers (full_name, phone_number, farm_name, organization, location, preferred_language)
VALUES ('Ramesh Patel', '+919876543210', 'Shri Balaji Dairy Farm', 'COw sensing', 'Anand, Gujarat, India', 'Tamil')
ON CONFLICT DO NOTHING;

INSERT INTO public.animals (id, name, breed, age, lactation, risk_level, trend, scc, temperature, activity, milk_yield, last_sync, quarter) VALUES
('KA-001', 'Ganga', 'HF Cross', '5y 3m', 3, 'high', 'up', 485, 39.4, 'low', 10.2, '8 min ago', 'Front-Right'),
('KA-007', 'Kaveri', 'Murrah Buf.', '4y 1m', 2, 'moderate', 'up', 312, 38.9, 'normal', 14.8, '12 min ago', 'Rear-Left'),
('KA-014', 'Saraswati', 'Sahiwal', '6y 8m', 5, 'moderate', 'stable', 248, 38.7, 'normal', 9.6, '5 min ago', 'All Clear'),
('KA-022', 'Narmada', 'Jersey X', '3y 2m', 1, 'low', 'down', 145, 38.5, 'high', 18.4, '3 min ago', 'All Clear'),
('KA-031', 'Yamuna', 'HF Cross', '4y 6m', 3, 'none', 'stable', 82, 38.4, 'normal', 19.2, '6 min ago', 'All Clear'),
('KA-038', 'Godavari', 'Gir', '7y 0m', 6, 'low', 'stable', 178, 38.6, 'normal', 7.8, '15 min ago', 'All Clear'),
('KA-045', 'Chambal', 'Sahiwal', '2y 9m', 1, 'none', 'stable', 68, 38.3, 'high', 12.1, '4 min ago', 'All Clear'),
('KA-052', 'Betwa', 'HF Cross', '5y 5m', 4, 'high', 'up', 620, 39.6, 'low', 8.4, '22 min ago', 'Rear-Right')
ON CONFLICT (id) DO UPDATE SET
    risk_level = EXCLUDED.risk_level,
    scc = EXCLUDED.scc,
    temperature = EXCLUDED.temperature,
    milk_yield = EXCLUDED.milk_yield;

INSERT INTO public.sensors (id, device_name, assigned_animal_id, battery_level, status, baud_rate) VALUES
('ESP32-DEV-001', 'ESP32 WROOM32 #1', 'KA-001', 94, 'online', 115200),
('ESP32-DEV-002', 'ESP32 WROOM32 #2', 'KA-052', 88, 'online', 115200),
('ESP32-DEV-003', 'ESP32 WROOM32 #3', 'KA-007', 91, 'online', 115200)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.alerts (animal_id, risk_level, message, urgency, recommended_action, status) VALUES
('KA-001', 'high', 'SCC 485k + Conductivity 14.2 mS/cm Front-Right — Mastitis suspected', 'Immediate', 'Vet exam required today. Apply 1.0% iodine barrier dip.', 'active'),
('KA-052', 'high', 'SCC 620k — Clinical mastitis suspected in Rear-Right quarter', 'Immediate', 'Isolate in clean stall and contact Dr. Sharma.', 'active'),
('KA-007', 'moderate', 'SCC trending up 25% over 3 days (312k)', 'Today', 'Increase monitoring frequency and strip test before milking.', 'active')
ON CONFLICT DO NOTHING;
