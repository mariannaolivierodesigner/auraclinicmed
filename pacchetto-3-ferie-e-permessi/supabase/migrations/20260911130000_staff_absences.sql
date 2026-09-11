-- Ferie, malattia e permessi dello staff. Stessa logica di permessi di staff_shifts:
-- tutto lo staff legge (serve per sapere chi è assente), solo gli admin gestiscono.

CREATE TYPE public.absence_type AS ENUM ('ferie', 'malattia', 'permesso');

CREATE TABLE public.staff_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.absence_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  -- Orari usati solo per "permesso" (assenza di poche ore in un giorno);
  -- per ferie/malattia restano NULL (assenza sull'intera giornata).
  start_time time,
  end_time time,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_absences_valid_range CHECK (end_date >= start_date),
  CONSTRAINT staff_absences_partial_day_only_permesso CHECK (
    type = 'permesso' OR (start_time IS NULL AND end_time IS NULL)
  ),
  CONSTRAINT staff_absences_time_range CHECK (
    start_time IS NULL OR end_time IS NULL OR end_time > start_time
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_absences TO authenticated;
GRANT ALL ON public.staff_absences TO service_role;
ALTER TABLE public.staff_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read absences" ON public.staff_absences
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins manage absences" ON public.staff_absences
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER staff_absences_updated_at
  BEFORE UPDATE ON public.staff_absences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX staff_absences_start_date_idx ON public.staff_absences (start_date);
CREATE INDEX staff_absences_staff_id_idx ON public.staff_absences (staff_id);
