-- ============================================================
-- 005_shifts.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shifts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  date          DATE NOT NULL,
  shift_type    TEXT NOT NULL DEFAULT 'custom'
                  CHECK (shift_type IN ('morning', 'evening', 'custom')),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  break_minutes INT NOT NULL DEFAULT 30,
  notes         TEXT,
  created_by    UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shifts_employee_date ON public.shifts(employee_id, date);
CREATE INDEX idx_shifts_date ON public.shifts(date);

CREATE TRIGGER shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_select_own" ON public.shifts
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "shifts_select_staff" ON public.shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

CREATE POLICY "shifts_write_staff" ON public.shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );
