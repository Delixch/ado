-- ============================================================
-- 010_announcements.sql
-- Duyuru panosu / Schwarzes Brett
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_tr     TEXT NOT NULL,
  title_de     TEXT,
  content_tr   TEXT NOT NULL,
  content_de   TEXT,
  priority     TEXT NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  visible_to   TEXT NOT NULL DEFAULT 'all'
                 CHECK (visible_to IN ('all', 'managers', 'employees')),
  pinned       BOOLEAN NOT NULL DEFAULT false,
  expires_at   TIMESTAMPTZ,
  created_by   UUID REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active ON public.announcements(created_at)
  WHERE (expires_at IS NULL OR expires_at > now());

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users see announcements visible to them
CREATE POLICY "announcements_select_all_employees" ON public.announcements
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      visible_to = 'all'
      OR (
        visible_to = 'managers'
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "announcements_write_staff" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );

-- ============================================================
-- 011_documents.sql
-- File references for employee documents (stored in Supabase Storage)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category      TEXT NOT NULL
                  CHECK (category IN (
                    'id_copy', 'permit', 'health_insurance',
                    'haccp_cert', 'contract', 'other'
                  )),
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,   -- Supabase Storage bucket path
  mime_type     TEXT,
  size_bytes    INT,
  uploaded_by   UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_employee ON public.documents(employee_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
  );

CREATE POLICY "documents_all_staff" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('super_admin', 'manager')
    )
  );
