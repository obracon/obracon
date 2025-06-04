-- supabase_schema.sql

-- First, create an enum type for user roles
CREATE TYPE public.user_role AS ENUM (
  'Admin Geral',
  'Diretoria',
  'Gerente de Setor',
  'Usuário do Setor',
  'Visitante'
);

-- Create the profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'Visitante', -- Default role
  sector TEXT NULL -- Optional: To specify department for 'Gerente de Setor' or 'Usuário do Setor'

  -- Add other profile-specific columns here if needed in the future
  -- E.g., phone_number, department_id (if using a separate department table), etc.
);

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'Visitante'); -- Or another default role like 'Usuário do Setor' if more appropriate
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Optional: Add comments to tables and columns for better understanding
COMMENT ON TABLE public.profiles IS 'Stores public user profile information and their role within the application.';
COMMENT ON COLUMN public.profiles.id IS 'References the user in auth.users.';
COMMENT ON COLUMN public.profiles.role IS 'The role assigned to the user, determining their permissions.';
COMMENT ON COLUMN public.profiles.sector IS 'The specific sector/department the user belongs to, relevant for sector-specific roles.';

-- RLS Policies for profiles table

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile (specific columns).
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
-- Note: To restrict which columns can be updated by non-admins (e.g., 'role'),
-- this policy should be combined with column-level privileges or application-level checks.
-- For example, you might grant UPDATE permission only on specific columns:
-- REVOKE UPDATE ON public.profiles FROM authenticated; -- Revoke general update
-- GRANT UPDATE(full_name, avatar_url, sector) ON public.profiles TO authenticated; -- Grant specific column updates
-- Admins would bypass this through their broader policy.

-- Policy: Admin Geral can manage all profiles.
-- This policy assumes that an admin user will have the 'Admin Geral' role in their own profile.
CREATE POLICY "Admin Geral can manage all profiles"
ON public.profiles FOR ALL -- SELECT, INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'Admin Geral'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'Admin Geral'
  )
);

-- Make sure that the default 'public' role cannot access the table at all.
-- Supabase does this by default (empty default privileges for new tables in public schema),
-- but it's good to be explicit or verify.
REVOKE ALL ON TABLE public.profiles FROM public;
GRANT ALL ON TABLE public.profiles TO supabase_admin; -- Or whatever your admin role is, Supabase handles this.

-- For the `handle_new_user` function, ensure it's executable by the `anon` role or `authenticated` role
-- as it's triggered by user creation. Supabase typically sets this up, but explicitly:
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated; (or anon if signup doesn't require immediate auth)
-- SECURITY DEFINER functions run with the permissions of the user who defined them (usually a superuser),
-- so the function itself has rights to insert into public.profiles.

-- Consider table public.users from auth schema to not be directly publicly selectable beyond what Supabase defaults
-- (typically, users can only see their own auth.user row).
-- Supabase default RLS on auth.users usually covers this.
-- If you need users to be able to see other users' emails for example (not usually recommended),
-- you would need to adjust RLS on auth.users or provide a specific view/function.
