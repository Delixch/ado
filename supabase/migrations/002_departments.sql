-- ============================================================
-- 002_departments.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr     TEXT NOT NULL,
  name_de     TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3B82F6',
  icon        TEXT NOT NULL DEFAULT '🍽️',
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_read_all_authenticated" ON public.departments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "departments_write_admin" ON public.departments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Seed: Default departments
INSERT INTO public.departments (name_tr, name_de, color, icon, sort_order) VALUES
  ('Mutfak',            'Küche',              '#EF4444', '🍳', 1),
  ('Servis',            'Service',            '#3B82F6', '🍽️', 2),
  ('Bar & Lounge',      'Bar & Lounge',       '#8B5CF6', '🍸', 3),
  ('Depo & Lojistik',   'Lager & Logistik',   '#F59E0B', '📦', 4),
  ('Temizlik & Hijyen', 'Reinigung & Hygiene','#10B981', '🧹', 5);
