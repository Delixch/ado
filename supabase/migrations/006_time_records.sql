-- ============================================================
-- 006_time_records.sql
-- Stempel / clock-in-out records
-- ============================================================

CREATE TABLE IF NOT EXISTS public.time_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id    UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  clock_in    TIMESTAMPTZ,
  clock_out   TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end   TIMESTAMPTZ,
  method      TEXT NOT NULL DEFAULT 'app'
                CHECK (method IN ('app', 'kiosk_pin', 'qr')),
  net_hours   NUMERIC(5,2),
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'closed', 'approved', 'corrected')),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_time_records_employee ON public.time_records(employee_id);
CREATE INDEX idx_time_records_clock_in ON public.time_records(clock_in);

-- Auto-calculate net_hours on clock_out
CREATE OR REPLACE FUNCTION public.calculate_net_hours()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  total_minutes  NUMERIC;
  break_minutes  NUMERIC := 0;
BEGIN
  IF NEW.clock_out IS NOT NULL AND NEW.clock_in IS NOT NULL THEN
    total_minutes := EXTRACT(EPOCH FROM (NEW.clock_out - NEW.clock_in)) / 60;

    IF NEW.break_start IS NOT NULL AND NEW.break_end IS NOT NULL THEN
      break_minutes := EXTRACT(EPOCH FROM (NEW.break_end - NEW.break_start)) / 60;
    END IF;

    NEW.net_hours := ROUND(((total_minutes - break_minutes) / 60)::NUMERIC, 2);
    NEW.status := 'closed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER time_records_calc_hours
  BEFORE INSERT OR UPDATE ON public.time_records
  FOR EACH ROW EXECUTE FUNCTION public.calculate_net_hours();

ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_records_select_own" ON public.time_records
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "time_records_insert_own" ON public.time_records
  FOR INSERT WITH CHECK (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "time_records_update_own" ON public.time_records
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "time_records_all_staff" ON public.time_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );
