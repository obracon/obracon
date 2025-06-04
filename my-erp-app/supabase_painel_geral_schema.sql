-- SQL Schema for Painel Geral

-- 0. Ensure necessary extensions are enabled (usually default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For gen_random_uuid() if not available by default

-- 1. Table for General KPIs
CREATE TABLE public.general_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL UNIQUE,
    kpi_value DECIMAL(15, 2) NOT NULL, -- Using DECIMAL for precision, adjust as needed
    target_value DECIMAL(15, 2) NULL,
    unit TEXT NULL, -- e.g., %, $, items
    last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.general_kpis IS 'Stores general Key Performance Indicators for the company.';
COMMENT ON COLUMN public.general_kpis.kpi_name IS 'Unique name of the KPI.';
COMMENT ON COLUMN public.general_kpis.kpi_value IS 'Current value of the KPI.';
COMMENT ON COLUMN public.general_kpis.target_value IS 'Target value for the KPI, if applicable.';
COMMENT ON COLUMN public.general_kpis.unit IS 'Unit of measurement for the KPI value.';

-- 2. Table for KPI Historical Data (Comparisons)
CREATE TABLE public.kpi_historical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES public.general_kpis(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(kpi_id, record_date) -- Ensure one record per KPI per day
);

COMMENT ON TABLE public.kpi_historical_data IS 'Stores historical data points for KPIs for trend analysis and comparisons.';
COMMENT ON COLUMN public.kpi_historical_data.kpi_id IS 'Foreign key to the general_kpis table.';
COMMENT ON COLUMN public.kpi_historical_data.record_date IS 'The date for which the KPI value was recorded.';

-- 3. Table for System Alerts
CREATE TYPE public.alert_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE public.alert_status AS ENUM ('new', 'acknowledged', 'resolved');

CREATE TABLE public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_message TEXT NOT NULL,
    severity public.alert_severity NOT NULL DEFAULT 'warning',
    status public.alert_status NOT NULL DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ NULL,
    acknowledged_by UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL, -- User who acknowledged
    details JSONB NULL -- For any extra structured data about the alert
);

COMMENT ON TABLE public.system_alerts IS 'Stores system-generated alerts and critical indicators.';
COMMENT ON COLUMN public.system_alerts.acknowledged_by IS 'User ID from profiles table who acknowledged the alert. Set to NULL if profile is deleted.';
COMMENT ON COLUMN public.system_alerts.details IS 'Additional structured information about the alert.';

-- 4. Table for KPI Configurations (Admin Geral only)
CREATE TABLE public.kpi_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_name TEXT NOT NULL UNIQUE, -- Could also be FK to general_kpis.kpi_name or general_kpis.id if KPIs are pre-defined
                                   -- If using general_kpis.id, change type to UUID and add REFERENCES constraint.
    config_details JSONB NOT NULL, -- e.g., thresholds for alerts, calculation formulas, data sources
    last_updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Prevent deleting profile of admin who configured
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.kpi_configurations IS 'Allows Admin Geral to configure aspects of KPIs, like alert thresholds or data sources.';
COMMENT ON COLUMN public.kpi_configurations.kpi_name IS 'Name of the KPI being configured. Should match a kpi_name in general_kpis.';
COMMENT ON COLUMN public.kpi_configurations.last_updated_by IS 'User ID of the admin who last updated the configuration.';

-- Helper function to check user role (reusable for RLS)
-- This function assumes 'role' column exists in 'public.profiles' table and is of type public.user_role (enum)
-- Ensure public.user_role enum is created (from previous `supabase_schema.sql`)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role AS $$ -- Return type is the enum itself for type safety
DECLARE
  user_role_value public.user_role;
BEGIN
  SELECT role INTO user_role_value FROM public.profiles WHERE id = user_id;
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE; -- STABLE because it doesn't modify DB and returns same result for same input within a transaction

-- RLS Policies

-- RLS for general_kpis
ALTER TABLE public.general_kpis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Diretoria and Admin Geral can read KPIs"
    ON public.general_kpis FOR SELECT
    USING (
        (public.get_user_role(auth.uid()) = 'Diretoria') OR
        (public.get_user_role(auth.uid()) = 'Admin Geral')
    );
CREATE POLICY "Admin Geral can manage KPIs"
    ON public.general_kpis FOR ALL -- Covers INSERT, UPDATE, DELETE
    USING (public.get_user_role(auth.uid()) = 'Admin Geral')
    WITH CHECK (public.get_user_role(auth.uid()) = 'Admin Geral');


-- RLS for kpi_historical_data
ALTER TABLE public.kpi_historical_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Diretoria and Admin Geral can read historical KPI data"
    ON public.kpi_historical_data FOR SELECT
    USING (
        (public.get_user_role(auth.uid()) = 'Diretoria') OR
        (public.get_user_role(auth.uid()) = 'Admin Geral')
    );
CREATE POLICY "Admin Geral can manage historical KPI data"
    ON public.kpi_historical_data FOR ALL
    USING (public.get_user_role(auth.uid()) = 'Admin Geral')
    WITH CHECK (public.get_user_role(auth.uid()) = 'Admin Geral');


-- RLS for system_alerts
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Diretoria and Admin Geral can read system alerts"
    ON public.system_alerts FOR SELECT
    USING (
        (public.get_user_role(auth.uid()) = 'Diretoria') OR
        (public.get_user_role(auth.uid()) = 'Admin Geral')
    );
CREATE POLICY "Admin Geral can manage system alerts"
    ON public.system_alerts FOR ALL
    USING (public.get_user_role(auth.uid()) = 'Admin Geral')
    WITH CHECK (public.get_user_role(auth.uid()) = 'Admin Geral');
-- Example for specific update actions (e.g., acknowledging an alert by specific roles)
-- CREATE POLICY "Gerente de Setor or Admin can acknowledge/resolve alerts"
--     ON public.system_alerts FOR UPDATE
--     USING (
--         (get_user_role(auth.uid()) = 'Gerente de Setor') OR
--         (get_user_role(auth.uid()) = 'Admin Geral')
--     )
--     WITH CHECK ( -- Optional: Can add checks on which fields can be updated
--         (get_user_role(auth.uid()) = 'Gerente de Setor') OR
--         (get_user_role(auth.uid()) = 'Admin Geral')
--     );


-- RLS for kpi_configurations
ALTER TABLE public.kpi_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Geral can manage KPI configurations"
    ON public.kpi_configurations FOR ALL
    USING (public.get_user_role(auth.uid()) = 'Admin Geral')
    WITH CHECK (public.get_user_role(auth.uid()) = 'Admin Geral');

-- Grant usage on enum types to authenticated users if not already available
-- Supabase usually handles this for types in public schema.
-- GRANT USAGE ON TYPE public.alert_severity TO authenticated;
-- GRANT USAGE ON TYPE public.alert_status TO authenticated;
-- GRANT USAGE ON TYPE public.user_role TO authenticated; -- (if not already done)

-- Grant execute on helper function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;


-- Seed some sample data (optional, for easier development)
-- This should be run AFTER RLS is enabled and by a user with 'Admin Geral' role,
-- or temporarily disable RLS for the tables during seeding.
-- E.g., by wrapping with: SET session_replication_role = replica; ...SQL...; SET session_replication_role = DEFAULT;
-- Or, as superuser: ALTER TABLE public.general_kpis DISABLE ROW LEVEL SECURITY; ... INSERT ... ; ALTER TABLE public.general_kpis ENABLE ROW LEVEL SECURITY;

/*
-- Ensure you are connected as a user that passes the RLS policies (e.g., an Admin Geral)
-- or temporarily disable RLS for seeding.

-- Example of how an Admin Geral would insert data (if RLS is active):
-- (Assuming the current Supabase user has 'Admin Geral' role in their profile)

-- 1. Get the ID of an 'Admin Geral' user to use for last_updated_by fields
-- This step is manual or should be replaced by a known Admin Geral UUID in your seed script.
-- For example: SELECT id FROM public.profiles WHERE role = 'Admin Geral' LIMIT 1;
-- Let's assume 'your_admin_geral_profile_id_here' is a placeholder for that UUID.

INSERT INTO public.general_kpis (kpi_name, kpi_value, target_value, unit, description) VALUES
('Receita Mensal', 120000.00, 110000.00, 'BRL', 'Receita total do mês atual'),
('Novos Clientes', 85, 70, 'count', 'Número de novos clientes adquiridos este mês'),
('Taxa de Satisfação', 92.5, 90.0, '%', 'Índice de satisfação do cliente (NPS ou similar)');

-- Assuming the above KPIs were inserted and generated UUIDs...
-- For kpi_historical_data, reference the actual kpi_id:
-- Example: With kpi_id for 'Receita Mensal' (replace with actual UUID after insertion)
-- INSERT INTO public.kpi_historical_data (kpi_id, record_date, value)
-- VALUES ((SELECT id FROM public.general_kpis WHERE kpi_name = 'Receita Mensal'), '2023-10-01', 115000.00);
-- INSERT INTO public.kpi_historical_data (kpi_id, record_date, value)
-- VALUES ((SELECT id FROM public.general_kpis WHERE kpi_name = 'Receita Mensal'), '2023-09-01', 105000.00);

INSERT INTO public.system_alerts (alert_message, severity, status, details) VALUES
('Servidor de Pagamentos Lento', 'warning', 'new', '{"response_time_ms": 1200, "threshold_ms": 800}'),
('Estoque Baixo: Produto X', 'critical', 'new', '{"product_id": "P123", "current_stock": 5, "min_stock": 10}');

-- For kpi_configurations, reference a valid profile ID for last_updated_by:
-- Example: With last_updated_by as your_admin_geral_profile_id_here (replace with actual UUID)
-- INSERT INTO public.kpi_configurations (kpi_name, config_details, last_updated_by)
-- VALUES ('Receita Mensal', '{"alert_threshold_low": 100000.00, "alert_threshold_high": 150000.00}', 'your_admin_geral_profile_id_here');

*/
