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

-- ── 2. Animals (Cattle, Goat & Buffalo Multi-Herd Registry) ─────────────────
CREATE TABLE IF NOT EXISTS public.animals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species TEXT NOT NULL DEFAULT 'Cow' CHECK (species IN ('Cow', 'Goat', 'Buffalo')),
    herd_id TEXT DEFAULT 'HERD_A',
    breed TEXT NOT NULL,
    age TEXT NOT NULL,
    age_years INTEGER,
    age_months INTEGER,
    rfid_tag TEXT,
    lactation INTEGER NOT NULL DEFAULT 1,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('none', 'low', 'moderate', 'high')),
    trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
    ph NUMERIC(3,1) DEFAULT 6.6,
    conductivity NUMERIC(5,2) DEFAULT 5.2,
    scc BIGINT DEFAULT 100000, -- Somatic Cell Count (cells/mL)
    scs NUMERIC(3,1) DEFAULT 3.0, -- Somatic Cell Score
    weight NUMERIC(5,2) DEFAULT 12.0, -- kg
    temperature NUMERIC(4,1) NOT NULL DEFAULT 38.5, -- Celsius
    activity TEXT NOT NULL CHECK (activity IN ('low', 'normal', 'high')),
    milk_yield NUMERIC(4,1) NOT NULL DEFAULT 12.0, -- Liters/day
    rumination INTEGER, -- min/day
    feeding INTEGER, -- min/day
    ambient_temp NUMERIC(4,1), -- Celsius
    humidity NUMERIC(4,1), -- %
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
    ph NUMERIC(3,1),
    scc BIGINT, -- Cells / mL
    scs NUMERIC(3,1),
    ec_fl NUMERIC(5,2),
    ec_fr NUMERIC(5,2),
    ec_rl NUMERIC(5,2),
    ec_rr NUMERIC(5,2),
    quarter_ratio NUMERIC(4,2),
    thermal_asymmetry NUMERIC(4,2),
    weight NUMERIC(5,2),
    activity NUMERIC(5,2),
    shed_temp NUMERIC(4,1),
    humidity NUMERIC(4,1),
    battery INTEGER,
    rssi INTEGER,
    risk_score NUMERIC(5,2),
    risk_tier TEXT,
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

INSERT INTO public.animals (id, name, species, herd_id, breed, age, age_years, age_months, rfid_tag, lactation, risk_level, trend, ph, conductivity, scc, scs, temperature, activity, milk_yield, rumination, feeding, ambient_temp, humidity, last_sync, quarter) VALUES
('KA-001', 'Cow 1 (Gauri)',     'Cow',     'HERD_A', 'HF Cross',  '5y 3m', 5, 3, 'RFID-001', 3, 'high',     'up',     6.1, 12.4, 1850000, 7.2, 39.4, 'low',    10.2, 210, 140, 28.4, 72.0, '8 min ago',  'Front-Right'),
('KA-007', 'Cow 2 (Kamdhenu)',  'Cow',     'HERD_A', 'Sahiwal',   '4y 1m', 4, 1, 'RFID-007', 2, 'moderate', 'up',     6.3,  9.8,  480000, 5.3, 38.9, 'normal', 14.8, 285, 185, 27.9, 69.0, '12 min ago', 'Rear-Left'),
('GT-001', 'Goat 1 (Chandani)', 'Goat',    'HERD_B', 'Jamnapari', '3y 0m', 3, 0, 'RFID-G01', 2, 'high',     'up',     7.1, 13.8, 1650000, 7.0, 40.1, 'low',     1.4, 195, 125, 29.2, 75.0, '3 min ago',  'Right Half'),
('GT-002', 'Goat 2 (Roshni)',   'Goat',    'HERD_B', 'Sirohi',    '2y 4m', 2, 4, 'RFID-G02', 1, 'low',      'stable', 6.6,  5.1,  480000, 4.2, 38.8, 'high',    2.8, 340, 215, 28.1, 68.0, '5 min ago',  'Both Clear'),
('KA-014', 'Cow 3 (Lakshmi)',   'Cow',     'HERD_A', 'Jersey X',  '6y 8m', 6, 8, 'RFID-014', 5, 'moderate', 'stable', 6.5,  8.9,  360000, 4.8, 38.7, 'normal',  9.6, 310, 195, 28.0, 70.0, '5 min ago',  'All Clear'),
('BF-001', 'Buffalo 1 (Durga)', 'Buffalo', 'HERD_A', 'Murrah',    '6y 0m', 6, 0, 'RFID-B01', 4, 'high',     'up',     7.1, 14.0, 1950000, 7.4, 39.8, 'low',     9.8, 205, 130, 28.8, 74.0, '1 min ago',  'Front-Right'),
('KA-022', 'Cow 4 (Nandini)',   'Cow',     'HERD_B', 'Gir Cow',   '3y 2m', 3, 2, 'RFID-022', 1, 'low',      'down',   6.6,  6.2,  140000, 3.5, 38.5, 'high',   18.4, 355, 220, 27.5, 65.0, '3 min ago',  'All Clear'),
('GT-003', 'Goat 3 (Heera)',    'Goat',    'HERD_C', 'Beetal',    '4y 2m', 4, 2, 'RFID-G03', 3, 'moderate', 'up',     6.9,  9.2,  920000, 5.8, 39.5, 'normal',  2.1, 265, 165, 29.0, 73.0, '9 min ago',  'Left Half'),
('KA-031', 'Cow 5 (Shanti)',    'Cow',     'HERD_B', 'Sahiwal',   '4y 6m', 4, 6, 'RFID-031', 3, 'none',     'stable', 6.7,  5.1,   65000, 2.7, 38.4, 'normal', 19.2, 370, 230, 27.2, 63.0, '6 min ago',  'All Clear'),
('KA-052', 'Cow 6 (Kalyani)',   'Cow',     'HERD_C', 'HF Cross',  '5y 5m', 5, 5, 'RFID-052', 4, 'high',     'up',     5.9, 14.2, 2200000, 7.5, 39.6, 'low',     8.4, 190, 120, 29.5, 77.0, '22 min ago', 'Rear-Right')
ON CONFLICT (id) DO UPDATE SET
    risk_level = EXCLUDED.risk_level,
    species = EXCLUDED.species,
    herd_id = EXCLUDED.herd_id,
    scc = EXCLUDED.scc,
    scs = EXCLUDED.scs,
    conductivity = EXCLUDED.conductivity,
    temperature = EXCLUDED.temperature,
    milk_yield = EXCLUDED.milk_yield;

INSERT INTO public.sensors (id, device_name, assigned_animal_id, battery_level, status, baud_rate) VALUES
('ESP32-DEV-001', 'ESP32 WROOM32 #1', 'KA-001', 94, 'online', 115200),
('ESP32-DEV-002', 'ESP32 WROOM32 #2', 'KA-052', 88, 'online', 115200),
('ESP32-DEV-003', 'ESP32 WROOM32 #3', 'KA-007', 91, 'online', 115200),
('ESP32-DEV-004', 'ESP32 WROOM32 #4', 'BF-001', 97, 'online', 115200),
('ESP32-DEV-005', 'ESP32 WROOM32 #5', 'GT-001', 89, 'online', 115200)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.alerts (animal_id, risk_level, message, urgency, recommended_action, status) VALUES
('KA-001', 'high', 'SCC 1,850,000 cells/mL + EC 12.4 mS/cm Front-Right — Clinical Mastitis Alert', 'Immediate', 'Vet exam required today. Apply 1.0% iodine barrier dip.', 'active'),
('KA-052', 'high', 'SCC 2,200,000 cells/mL — Acute mastitis detected in Rear-Right quarter', 'Immediate', 'Isolate in clean stall and contact Dr. Sharma.', 'active'),
('BF-001', 'high', 'Buffalo 1: SCC 1,950,000 cells/mL + EC 14.0 mS/cm in Front-Right quarter', 'Immediate', 'Isolate from milking line and perform CMIR strip test.', 'active'),
('GT-001', 'high', 'Goat 1: SCC 1,650,000 cells/mL + Temp 40.1°C — Right Half Inflammation', 'Immediate', 'Administer prescribed anti-inflammatory and isolate.', 'active'),
('KA-007', 'moderate', 'SCC 480,000 cells/mL trending up 25% over 3 days in Rear-Left quarter', 'Today', 'Increase monitoring frequency and strip test before milking.', 'active')
ON CONFLICT DO NOTHING;
