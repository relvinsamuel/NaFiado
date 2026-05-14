-- ============================================
-- NAFIADO SaaS - Triggers para Workspaces
-- Ejecuta este script en el SQL Editor de Supabase
-- para solucionar el problema del workspace_id faltante.
-- ============================================

-- 1. Asegurarnos de que las tablas existan (por si acaso)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_negocio text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Limpiamos la columna "nombre" que agregamos por error en el intento anterior
ALTER TABLE public.workspaces DROP COLUMN IF EXISTS nombre;

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role varchar NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Limpiamos la columna 'rol' que agregamos por error
ALTER TABLE public.workspace_members DROP COLUMN IF EXISTS rol;

-- Habilitar RLS en estas tablas si no estaba habilitado
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Politicas basicas para que los usuarios vean su workspace
DROP POLICY IF EXISTS "Usuarios ven su propio workspace" ON public.workspaces;
CREATE POLICY "Usuarios ven su propio workspace"
  ON public.workspaces FOR SELECT
  USING (id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Usuarios ven su propia membresia" ON public.workspace_members;
CREATE POLICY "Usuarios ven su propia membresia"
  ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid());

-- 2. Crear la función que se ejecutará al crear un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_workspace_id uuid;
  empresa_name text;
BEGIN
  -- Intentar obtener el nombre de la empresa desde los metadatos (si viene del formulario de la app)
  empresa_name := COALESCE(new.raw_user_meta_data->>'empresa', 'Mi Empresa - ' || COALESCE(new.email, new.id::text));

  -- Insertar el workspace y capturar su ID
  INSERT INTO public.workspaces (nombre_negocio)
  VALUES (empresa_name)
  RETURNING id INTO new_workspace_id;

  -- Crear la relación en workspace_members
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, new.id, COALESCE(new.raw_user_meta_data->>'rol', 'owner'));

  RETURN new;
END;
$$;

-- 3. Crear (o reemplazar) el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_workspace ON auth.users;

CREATE TRIGGER on_auth_user_created_workspace
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_workspace();

-- 4. FIX: Asignar un workspace a usuarios existentes que no tienen uno
DO $$
DECLARE
  rec record;
  new_workspace_id uuid;
  empresa_name text;
BEGIN
  FOR rec IN 
    SELECT * FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = u.id
    )
  LOOP
    empresa_name := COALESCE(rec.raw_user_meta_data->>'empresa', 'Mi Empresa - ' || COALESCE(rec.email, rec.id::text));

    INSERT INTO public.workspaces (nombre_negocio)
    VALUES (empresa_name)
    RETURNING id INTO new_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, rec.id, COALESCE(rec.raw_user_meta_data->>'rol', 'owner'));
    
    RAISE NOTICE 'Workspace creado para el usuario: %', rec.email;
  END LOOP;
END;
$$;
