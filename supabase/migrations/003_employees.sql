-- ============================================================
-- 003_employees.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  department_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  employee_number TEXT UNIQUE,
  status          TEXT NOT NULL DEFAULT 'onboarding'
                    CHECK (status IN ('onboarding','active','inactive','terminated')),
  pin             TEXT,  -- Hashed 4-6 digit kiosk PIN
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Çalışan sadece kendi kaydını görür
CREATE POLICY "employees_select_own" ON public.employees
  FOR SELECT USING (user_id = auth.uid());

-- Admin/Manager herkesi görebilir
CREATE POLICY "employees_select_staff" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

-- Sadece admin yazar
CREATE POLICY "employees_write_admin" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

-- Auto employee number generator
CREATE OR REPLACE FUNCTION public.generate_employee_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.employee_number IS NULL THEN
    NEW.employee_number := 'EMP-' || LPAD((
      SELECT COUNT(*) + 1 FROM public.employees
    )::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_auto_number
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.generate_employee_number();
