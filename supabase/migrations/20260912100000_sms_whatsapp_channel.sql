-- Aggiunge il canale di invio (SMS o WhatsApp) al log dei messaggi già esistente.
ALTER TABLE public.sms_log
  ADD COLUMN channel text NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'whatsapp'));
