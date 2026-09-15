-- ============================================================
-- 007_absences.sql + leave_balances
-- ============================================================

CREATE TABLE IF NOT EXISTS public.absences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('vacation', 'sick', 'other')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days_count   INT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  document_url TEXT,
  notes        TEXT,
  reviewed_by  UUID REFERENCES public.users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT absences_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX idx_absences_employee ON public.absences(employee_id);
CREATE INDEX idx_absences_dates ON public.absences(start_date, end_date);

-- ============================================================
-- Leave Balances
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  year          INT NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INT,
  total_days    INT NOT NULL DEFAULT 25,
  used_days     INT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Computed column via view for remaining days
CREATE OR REPLACE VIEW public.leave_balances_view AS
SELECT
  *,
  (total_days - used_days) AS remaining_days
FROM public.leave_balances;

-- Deduct used days when absence approved
CREATE OR REPLACE FUNCTION public.update_leave_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.type = 'vacation' THEN
    UPDATE public.leave_balances
    SET used_days = used_days + NEW.days_count,
        updated_at = now()
    WHERE employee_id = NEW.employee_id;
  END IF;

  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'approved' AND NEW.type = 'vacation' THEN
    UPDATE public.leave_balances
    SET used_days = GREATEST(0, used_days - NEW.days_count),
        updated_at = now()
    WHERE employee_id = NEW.employee_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER absences_update_balance
  AFTER UPDATE OF status ON public.absences
  FOR EACH ROW EXECUTE FUNCTION public.update_leave_balance();

-- Auto-create leave balance for new employee
CREATE OR REPLACE FUNCTION public.create_leave_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.leave_balances (employee_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_create_leave_balance
  AFTER INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.create_leave_balance();

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "absences_select_own" ON public.absences
  FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "absences_insert_own" ON public.absences
  FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "absences_update_own" ON public.absences
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
    AND status IN ('pending', 'cancelled')
  );

CREATE POLICY "absences_all_staff" ON public.absences
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','manager'))
  );

CREATE POLICY "leave_balances_select_own" ON public.leave_balances
  FOR SELECT USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

CREATE POLICY "leave_balances_all_staff" ON public.leave_balances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('super_admin','manager'))
  );
