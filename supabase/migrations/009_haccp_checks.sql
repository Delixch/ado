-- ============================================================
-- 009_haccp_checks.sql
-- Daily temperature checks (morning + evening)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.haccp_checks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  check_time   TEXT NOT NULL CHECK (check_time IN ('morning', 'evening')),
  location     TEXT NOT NULL,   -- e.g. "Kühlschrank 1", "Tiefkühler"
  temperature  NUMERIC(4,1) NOT NULL,
  min_temp     NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  max_temp     NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  in_range     BOOLEAN GENERATED ALWAYS AS (
                 temperature >= min_temp AND temperature <= max_temp
               ) STORED,
  notes        TEXT,
  checked_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, check_time, location)
);

CREATE INDEX idx_haccp_date ON public.haccp_checks(date);

-- Default locations (can be managed from admin)
CREATE TABLE IF NOT EXISTS public.haccp_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  min_temp    NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  max_temp    NUMERIC(4,1) NOT NULL DEFAULT 5.0,
  sort_order  INT DEFAULT 0
);

INSERT INTO public.haccp_locations (name, min_temp, max_temp, sort_order) VALUES
  ('Kühlschrank 1',     1.0,   5.0,  1),
  ('Kühlschrank 2',     1.0,   5.0,  2),
  ('Tiefkühler',       -22.0, -18.0, 3),
  ('Salatkühlschrank',  1.0,   4.0,  4);

ALTER TABLE public.haccp_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haccp_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "haccp_read_staff" ON public.haccp_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

CREATE POLICY "haccp_write_staff" ON public.haccp_checks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

CREATE POLICY "haccp_locations_read_all" ON public.haccp_locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "haccp_locations_write_admin" ON public.haccp_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin')
  );
