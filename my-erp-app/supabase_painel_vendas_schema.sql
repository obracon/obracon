-- SQL Schema for Painel de Vendas

-- Enum for Opportunity Status
CREATE TYPE public.opportunity_status AS ENUM (
    'Qualificação',
    'Proposta',
    'Negociação',
    'Fechada - Ganha',
    'Fechada - Perdida'
);

-- 1. Table for Clientes (Customers)
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    sector TEXT NULL, -- Sector this client is primarily associated with. Used for RLS.
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Vendedor who created
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.clientes IS 'Stores customer information.';
COMMENT ON COLUMN public.clientes.created_by IS 'Profile ID of the user (Vendedor) who created the customer.';
COMMENT ON COLUMN public.clientes.sector IS 'Sector this client might be associated with, relevant for "Todos do setor" access.';


-- 2. Table for Oportunidades (Opportunities)
CREATE TABLE public.oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    valor_estimado DECIMAL(15,2),
    status public.opportunity_status DEFAULT 'Qualificação' NOT NULL,
    data_fechamento_prevista DATE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Dono (Vendedor or Gerente)
    sector TEXT NOT NULL, -- Sector this opportunity belongs to, derived from owner or manually set
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.oportunidades IS 'Stores sales opportunities.';
COMMENT ON COLUMN public.oportunidades.owner_id IS 'Profile ID of the user who owns this opportunity.';
COMMENT ON COLUMN public.oportunidades.sector IS 'The sales sector this opportunity belongs to. Should align with owner_id''s sector.';


-- 3. Table for Metas (Sales Targets)
CREATE TABLE public.metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be for a specific Vendedor
    sector TEXT NULL, -- Or for a whole sector
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    valor_meta DECIMAL(15,2) NOT NULL,
    descricao TEXT,
    configurada_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Gerente who configured
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_meta_target CHECK (vendedor_id IS NOT NULL OR sector IS NOT NULL), -- Meta must be for a vendor or a sector
    CONSTRAINT chk_periodo CHECK (periodo_fim >= periodo_inicio)
);
COMMENT ON TABLE public.metas IS 'Stores sales targets for vendors or sectors.';
COMMENT ON COLUMN public.metas.configurada_por IS 'Profile ID of the Gerente who configured the target.';


-- 4. Table for Propostas (Proposals/Quotes)
-- Enum for Proposal Status (example)
CREATE TYPE public.proposal_status AS ENUM (
    'Pendente',
    'Enviada',
    'Aceita',
    'Rejeitada',
    'Cancelada'
);
CREATE TABLE public.propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oportunidade_id UUID NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor_proposta DECIMAL(15,2) NOT NULL,
    data_envio DATE,
    data_validade DATE,
    status public.proposal_status DEFAULT 'Pendente' NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Vendedor who created
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Dono (Vendedor or Gerente who can update)
    sector TEXT NOT NULL, -- Sector this proposal belongs to, derived from opportunity or owner
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.propostas IS 'Stores sales proposals or quotes.';
COMMENT ON COLUMN public.propostas.created_by IS 'Profile ID of the Vendedor who created the proposal.';
COMMENT ON COLUMN public.propostas.owner_id IS 'Profile ID of the user who owns this proposal (can update).';
COMMENT ON COLUMN public.propostas.sector IS 'The sales sector this proposal belongs to. Should align with owner_id''s sector.';


-- 5. Table for Relatorios de Fechamento (Sales Reports - simple version)
CREATE TYPE public.closing_report_result AS ENUM ('Ganha', 'Perdida', 'Cancelada');
CREATE TABLE public.relatorios_fechamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oportunidade_id UUID UNIQUE NOT NULL REFERENCES public.oportunidades(id) ON DELETE CASCADE, -- One report per opportunity
    resultado public.closing_report_result NOT NULL,
    valor_fechado DECIMAL(15,2),
    data_fechamento DATE NOT NULL,
    notas TEXT,
    gerado_em TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    gerado_por UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL, -- User who triggered/confirmed generation
    sector TEXT NOT NULL -- Sector this report belongs to, derived from opportunity
);
COMMENT ON TABLE public.relatorios_fechamento IS 'Stores sales closing reports.';
COMMENT ON COLUMN public.relatorios_fechamento.sector IS 'The sales sector this report belongs to.';
COMMENT ON COLUMN public.relatorios_fechamento.gerado_por IS 'User who confirmed or triggered the report generation.';


-- RLS Policies --
-- Helper: Get user's sector
CREATE OR REPLACE FUNCTION public.get_user_sector(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_sector_value TEXT;
BEGIN
  SELECT sector INTO user_sector_value FROM public.profiles WHERE id = user_id;
  RETURN user_sector_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
GRANT EXECUTE ON FUNCTION public.get_user_sector(UUID) TO authenticated;

-- Helper: Get user's role (re-declared if not in same script, ensure it exists)
-- Ensure public.user_role enum exists from prior scripts
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role AS $$
DECLARE
  user_role_value public.user_role;
BEGIN
  SELECT role INTO user_role_value FROM public.profiles WHERE id = user_id;
  RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;


-- RLS for Clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendedores (Usuário do Setor) can create clientes for their sector"
    ON public.clientes FOR INSERT
    WITH CHECK (
        get_user_role(auth.uid()) = 'Usuário do Setor' AND
        created_by = auth.uid() AND
        sector = get_user_sector(auth.uid()) -- Client sector must match creator's sector
    );
CREATE POLICY "Diretoria, AdminGeral, and sector members can read clientes"
    ON public.clientes FOR SELECT
    USING (
        ( (get_user_role(auth.uid()) = 'Usuário do Setor' OR get_user_role(auth.uid()) = 'Gerente de Setor') AND
          get_user_sector(auth.uid()) = sector
        ) OR
        get_user_role(auth.uid()) = 'Diretoria' OR
        get_user_role(auth.uid()) = 'Admin Geral'
    );
CREATE POLICY "Gerentes can update clientes in their sector"
    ON public.clientes FOR UPDATE
    USING (get_user_role(auth.uid()) = 'Gerente de Setor' AND get_user_sector(auth.uid()) = sector);
CREATE POLICY "Admin Geral can delete clientes"
    ON public.clientes FOR DELETE
    USING (get_user_role(auth.uid()) = 'Admin Geral');

-- RLS for Oportunidades
ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendedores and Gerentes can create oportunidades in their sector"
    ON public.oportunidades FOR INSERT
    WITH CHECK (
        ( (get_user_role(auth.uid()) = 'Usuário do Setor' OR get_user_role(auth.uid()) = 'Gerente de Setor') AND
          owner_id = auth.uid() AND
          get_user_sector(auth.uid()) = sector
        )
    );
CREATE POLICY "Sector members, Diretoria, AdminGeral can read oportunidades"
    ON public.oportunidades FOR SELECT
    USING (
        ( (get_user_role(auth.uid()) = 'Usuário do Setor' OR get_user_role(auth.uid()) = 'Gerente de Setor') AND
          get_user_sector(auth.uid()) = sector
        ) OR
        get_user_role(auth.uid()) = 'Diretoria' OR
        get_user_role(auth.uid()) = 'Admin Geral'
    );
CREATE POLICY "Owner or Gerente (of sector) can update oportunidades"
    ON public.oportunidades FOR UPDATE
    USING (
        (auth.uid() = owner_id) OR -- Owner can always update
        (get_user_role(auth.uid()) = 'Gerente de Setor' AND get_user_sector(auth.uid()) = sector) -- Manager of the sector
    );
CREATE POLICY "Gerentes can delete oportunidades in their sector"
    ON public.oportunidades FOR DELETE
    USING (get_user_role(auth.uid()) = 'Gerente de Setor' AND get_user_sector(auth.uid()) = sector);


-- RLS for Metas
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gerentes can create metas for their sector or its vendors"
    ON public.metas FOR INSERT
    WITH CHECK (
        get_user_role(auth.uid()) = 'Gerente de Setor' AND
        configurada_por = auth.uid() AND
        ( (sector IS NOT NULL AND get_user_sector(auth.uid()) = sector) OR -- Meta for the manager's sector
          (vendedor_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles vp WHERE vp.id = vendedor_id AND vp.sector = get_user_sector(auth.uid()))) -- Meta for a vendor in manager's sector
        )
    );
CREATE POLICY "Sector members, Diretoria, AdminGeral can read metas"
    ON public.metas FOR SELECT
    USING (
        ( (get_user_role(auth.uid()) = 'Usuário do Setor' OR get_user_role(auth.uid()) = 'Gerente de Setor') AND
          ( (sector IS NOT NULL AND get_user_sector(auth.uid()) = sector) OR -- Meta is for their sector
            (vendedor_id IS NOT NULL AND vendedor_id = auth.uid()) OR -- Meta is for the Vendedor themselves
            (vendedor_id IS NOT NULL AND get_user_role(auth.uid()) = 'Gerente de Setor' AND EXISTS (SELECT 1 FROM public.profiles vp WHERE vp.id = vendedor_id AND vp.sector = get_user_sector(auth.uid()))) -- Gerente viewing meta of a Vendedor in their sector
          )
        ) OR
        get_user_role(auth.uid()) = 'Diretoria' OR
        get_user_role(auth.uid()) = 'Admin Geral'
    );
CREATE POLICY "Gerentes can update metas they configured for their sector/vendors"
    ON public.metas FOR UPDATE
    USING (get_user_role(auth.uid()) = 'Gerente de Setor' AND configurada_por = auth.uid());
CREATE POLICY "Admin Geral can delete metas"
    ON public.metas FOR DELETE
    USING (get_user_role(auth.uid()) = 'Admin Geral');


-- RLS for Propostas
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendedores can create propostas in their sector"
    ON public.propostas FOR INSERT
    WITH CHECK (
        get_user_role(auth.uid()) = 'Usuário do Setor' AND
        created_by = auth.uid() AND
        owner_id = auth.uid() AND
        get_user_sector(auth.uid()) = sector
    );
CREATE POLICY "Sector members, Diretoria, AdminGeral can read propostas"
    ON public.propostas FOR SELECT
    USING (
        ( (get_user_role(auth.uid()) = 'Usuário do Setor' OR get_user_role(auth.uid()) = 'Gerente de Setor') AND
          get_user_sector(auth.uid()) = sector
        ) OR
        get_user_role(auth.uid()) = 'Diretoria' OR
        get_user_role(auth.uid()) = 'Admin Geral'
    );
CREATE POLICY "Owner or Gerente (of sector) can update propostas"
    ON public.propostas FOR UPDATE
    USING (
        (auth.uid() = owner_id) OR
        (get_user_role(auth.uid()) = 'Gerente de Setor' AND get_user_sector(auth.uid()) = sector)
    );
CREATE POLICY "Gerentes can delete propostas in their sector"
    ON public.propostas FOR DELETE
    USING (get_user_role(auth.uid()) = 'Gerente de Setor' AND get_user_sector(auth.uid()) = sector);


-- RLS for Relatorios_Fechamento
ALTER TABLE public.relatorios_fechamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Geral can manage relatorios de fechamento" -- Covers create, update, delete
    ON public.relatorios_fechamento FOR ALL
    USING (get_user_role(auth.uid()) = 'Admin Geral')
    WITH CHECK (get_user_role(auth.uid()) = 'Admin Geral');
-- Read access for Relatorios (similar to others)
CREATE POLICY "Sector members, Diretoria, AdminGeral can read relatorios"
    ON public.relatorios_fechamento FOR SELECT
    USING (
        ( (get_user_role(auth.uid()) = 'Usuário do Setor' OR get_user_role(auth.uid()) = 'Gerente de Setor') AND
          get_user_sector(auth.uid()) = sector
        ) OR
        get_user_role(auth.uid()) = 'Diretoria' OR
        get_user_role(auth.uid()) = 'Admin Geral'
    );

-- Grant usage on new enum types
GRANT USAGE ON TYPE public.opportunity_status TO authenticated;
GRANT USAGE ON TYPE public.proposal_status TO authenticated;
GRANT USAGE ON TYPE public.closing_report_result TO authenticated;

-- Note: `public.user_role` enum usage should have been granted in a previous script.
-- Ensure all tables are owned by appropriate roles, Supabase handles this well by default.
-- REVOKE ALL ON TABLE public.clientes FROM public; (example if default privileges were different)
-- GRANT SELECT ON public.clientes TO authenticated; -- (then RLS policies apply on top of this)
-- Supabase's default is that tables are not accessible unless RLS policy grants access.
-- The `authenticated` role needs `SELECT` grant on tables to be able to read, even with RLS.
-- This is usually implicitly handled by Supabase when RLS is enabled and policies are for `auth.uid()`.

-- For all tables, ensure the `authenticated` role has basic permissions that RLS policies will then filter.
-- Supabase typically grants SELECT, INSERT, UPDATE, DELETE to `authenticated` on new tables in `public` schema.
-- If not, you might need to add them:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.oportunidades TO authenticated;
-- ... and so on for other tables.
-- Then RLS policies correctly restrict these operations.
-- However, it's also common to grant only SELECT and then have specific policies for INSERT/UPDATE/DELETE
-- that also check `auth.role() = 'authenticated'` or more specific user roles.
-- The current approach of defining policies directly for roles like 'Usuário do Setor' using `get_user_role()`
-- assumes the underlying table grants are sufficient for `authenticated` users to attempt the action.Successfully created `my-erp-app/supabase_painel_vendas_schema.sql`.

I've reviewed the generated SQL and made the following refinements based on the prompt and best practices:
*   Added `NOT NULL` to status columns where appropriate (e.g., `oportunidades.status`, `propostas.status`).
*   Used `ON DELETE RESTRICT` or `ON DELETE SET NULL` for foreign keys where appropriate, instead of the default `ON DELETE NO ACTION` or `ON DELETE CASCADE` if the behavior is more desirable (e.g., restricting deletion of a customer if they have opportunities, or setting an owner to null if their profile is deleted from `metas.vendedor_id`). The prompt mostly used `CASCADE` or `RESTRICT` which I've kept or adjusted.
*   Added `CONSTRAINT chk_periodo CHECK (periodo_fim >= periodo_inicio)` to `metas` table.
*   Created specific enums for `proposal_status` and `closing_report_result`.
*   Clarified RLS policies with more specific conditions, especially for INSERT operations to ensure the creator's sector matches the entity's sector.
*   Ensured the `get_user_role` function is re-declared (or assumed to exist from previous scripts) and granted execute permission.
*   Added `GRANT USAGE ON TYPE ... TO authenticated;` for the new enum types.
*   Included comments about base table grants for the `authenticated` role, which are necessary for RLS policies to function correctly. Supabase usually handles these defaults well, but it's an important consideration.

The SQL script is now ready for the user to apply to their Supabase project. This completes the objective for this subtask.
