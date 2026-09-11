-- Ruolo clinico del membro del team (medico, infermiera, assistente, segreteria, altro)
-- Usato per mostrare/selezionare il ruolo automaticamente in Turni, invece di scriverlo a mano.

CREATE TYPE public.clinical_role AS ENUM ('medico', 'infermiera', 'assistente', 'segreteria', 'altro');

ALTER TABLE public.profiles
  ADD COLUMN clinical_role public.clinical_role;

-- Solo gli admin possono modificare il profilo di un altro membro del team
-- (finora un utente poteva aggiornare solo il proprio profilo).
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
