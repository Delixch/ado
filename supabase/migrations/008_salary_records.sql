-- ============================================================
-- 008_salary_records.sql
-- GAV Gastrosuisse / CHF / AHV / ALV / BVG / Quellensteuer
-- ============================================================

CREATE TABLE IF NOT EXISTS public.salary_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  year            INT NOT NULL,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  pensum          INT NOT NULL DEFAULT 100 CHECK (pensum BETWEEN 1 AND 100),
  hourly_rate     NUMERIC(8,2) NOT NULL,
  target_hours    NUMERIC(6,2),              -- Soll-Stunden
  actual_hours    NUMERIC(6,2),              -- Ist-Stunden (from time_records)
  overtime_hours  NUMERIC(6,2)               -- actual - target (kann negativ sein)
    GENERATED ALWAYS AS (
      CASE WHEN actual_hours IS NOT NULL AND target_hours IS NOT NULL
           THEN ROUND(actual_hours - target_hours, 2)
           ELSE NULL END
    ) STORED,
  gross_salary    NUMERIC(10,2),             -- Bruttolohn
  -- Swiss deductions
  ahv_deduction   NUMERIC(8,2),             -- 5.3%
  alv_deduction   NUMERIC(8,2),             -- 1.1%
  bvg_deduction   NUMERIC(8,2),             -- ~7.5% (age-dependent)
  quellensteuer   NUMERIC(8,2),             -- Tariff A/B/C
  -- Net
  net_salary      NUMERIC(10,2),
  -- Metadata
  tax_tariff      TEXT CHECK (tax_tariff IN ('A', 'B', 'C', 'none')),
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'ready', 'exported')),
  exported_at     TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year, month)
);

CREATE INDEX idx_salary_employee_period ON public.salary_records(employee_id, year, month);

CREATE TRIGGER salary_records_updated_at
  BEFORE UPDATE ON public.salary_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

-- Çalışan kendi maaş kaydını GÖREMEZ (sadece saatler başka tablodan)
-- Sadece admin/manager görebilir
CREATE POLICY "salary_admin_only" ON public.salary_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

-- ============================================================
-- Helper view: monthly hours summary per employee (çalışan da görebilir)
-- ============================================================
CREATE OR REPLACE VIEW public.monthly_hours_summary AS
SELECT
  e.id AS employee_id,
  e.user_id,
  EXTRACT(YEAR FROM tr.clock_in)::INT AS year,
  EXTRACT(MONTH FROM tr.clock_in)::INT AS month,
  ROUND(SUM(tr.net_hours)::NUMERIC, 2) AS total_hours,
  COUNT(tr.id) AS session_count
FROM public.time_records tr
JOIN public.employees e ON e.id = tr.employee_id
WHERE tr.status IN ('closed', 'approved')
  AND tr.net_hours IS NOT NULL
GROUP BY e.id, e.user_id, year, month;
