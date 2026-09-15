-- ============================================================
-- 004_onboarding_sections.sql
-- 5-section employee onboarding with per-section approval
-- ============================================================

CREATE TABLE IF NOT EXISTS public.onboarding_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  section      INT NOT NULL CHECK (section BETWEEN 1 AND 5),
  status       TEXT NOT NULL DEFAULT 'empty'
                 CHECK (status IN ('empty','filled','pending_review','approved','revision_needed')),
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by  UUID REFERENCES public.users(id),
  reviewed_at  TIMESTAMPTZ,
  notes        TEXT,  -- Admin notu (düzeltme gerektiğinde)
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, section)
);

CREATE TRIGGER onboarding_sections_updated_at
  BEFORE UPDATE ON public.onboarding_sections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create empty sections when employee is created
CREATE OR REPLACE FUNCTION public.create_onboarding_sections()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.onboarding_sections (employee_id, section)
  VALUES
    (NEW.id, 1), (NEW.id, 2), (NEW.id, 3),
    (NEW.id, 4), (NEW.id, 5);
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_create_onboarding
  AFTER INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.create_onboarding_sections();

-- Auto-activate employee when all required sections approved
CREATE OR REPLACE FUNCTION public.check_employee_activation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  required_approved INT;
BEGIN
  SELECT COUNT(*) INTO required_approved
  FROM public.onboarding_sections
  WHERE employee_id = NEW.employee_id
    AND section IN (1, 2, 4, 5)
    AND status = 'approved';

  IF required_approved = 4 THEN
    UPDATE public.employees
    SET status = 'active'
    WHERE id = NEW.employee_id AND status = 'onboarding';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER onboarding_check_activation
  AFTER UPDATE OF status ON public.onboarding_sections
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.check_employee_activation();

ALTER TABLE public.onboarding_sections ENABLE ROW LEVEL SECURITY;

-- Çalışan kendi bölümlerini görür ve günceller
CREATE POLICY "onboarding_select_own" ON public.onboarding_sections
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "onboarding_update_own" ON public.onboarding_sections
  FOR UPDATE USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    -- Çalışan sadece 'filled' veya 'pending_review' yapabilir
    NEW.status IN ('filled', 'pending_review')
  );

-- Admin her şeyi görebilir ve onaylayabilir
CREATE POLICY "onboarding_admin_all" ON public.onboarding_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
