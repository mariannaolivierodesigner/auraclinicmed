-- Catalogo trattamenti (categorie + trattamenti): prima erano scritti fissi nel
-- codice (src/lib/treatments.ts), ora diventano gestibili dal pannello e il sito
-- pubblico li legge da qui. Tutti i contenuti già pubblicati vengono trasferiti
-- in fondo a questo file, senza perdere nulla.

CREATE TABLE public.treatment_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  blurb text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.treatment_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  summary text,
  what text,
  who text,
  duration text,
  anesthesia text,
  recovery text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

GRANT SELECT ON public.treatment_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_categories TO authenticated;
GRANT ALL ON public.treatment_categories TO service_role;
GRANT SELECT ON public.treatments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;

ALTER TABLE public.treatment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Il sito pubblico (anon) vede solo le categorie/trattamenti attivi;
-- lo staff, da autenticato, vede anche quelli non ancora pubblicati.
CREATE POLICY "Tutti leggono le categorie attive" ON public.treatment_categories
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));

CREATE POLICY "Admin gestisce le categorie" ON public.treatment_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Tutti leggono i trattamenti attivi" ON public.treatments
  FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));

CREATE POLICY "Admin gestisce i trattamenti" ON public.treatments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER treatment_categories_updated_at BEFORE UPDATE ON public.treatment_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER treatments_updated_at BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX treatments_category_idx ON public.treatments (category_id, sort_order);

-- ============================================================
-- Dati già pubblicati sul sito (4 categorie, 14 trattamenti)
-- ============================================================
-- Seed: contenuti già pubblicati sul sito, spostati dal file statico src/lib/treatments.ts
-- al database, così restano identici per il pubblico ma diventano gestibili dal pannello.

INSERT INTO public.treatment_categories (name, slug, blurb, sort_order) VALUES
  ('Chirurgia del viso', 'viso', 'Armonia dei tratti, senza mai perdere la tua identità.', 0),
  ('Chirurgia del seno', 'seno', 'Proporzione e naturalezza, calibrate sul tuo corpo.', 1),
  ('Chirurgia del corpo', 'corpo', 'Linee più definite, con un recupero seguito passo dopo passo.', 2),
  ('Medicina estetica', 'medicina-estetica', 'Trattamenti non chirurgici, risultati misurati e reversibili.', 3);

INSERT INTO public.treatments (category_id, name, slug, summary, what, who, duration, anesthesia, recovery, steps, faq, sort_order) VALUES
  ((SELECT id FROM public.treatment_categories WHERE slug = 'viso'), 'Rinoplastica', 'rinoplastica', 'Riequilibrare il naso rispettando il carattere del volto.', 'Intervento che modifica struttura ossea e cartilaginea del naso per migliorarne forma, proporzioni e — quando necessario — la respirazione.', 'Indicata a chi percepisce una sproporzione tra naso e resto del volto, o convive con difficoltà respiratorie legate al setto.', '90-150 minuti', 'Generale', 'Rientro alla vita sociale in 10-14 giorni. Edema residuo in progressiva riduzione fino a 12 mesi.', '[{"title": "Consulenza e simulazione", "body": "Analisi del volto, ascolto delle aspettative e simulazione digitale del risultato."}, {"title": "Pianificazione chirurgica", "body": "Esami preoperatori e definizione della tecnica: aperta o chiusa, strutturata o conservativa."}, {"title": "Intervento", "body": "Durata media 90-150 minuti, in anestesia generale, con dimissione in giornata o dopo una notte."}, {"title": "Follow-up", "body": "Rimozione del tutore dopo 7 giorni, controlli programmati a 1, 3, 6 e 12 mesi."}]'::jsonb, '[{"q": "Resteranno cicatrici visibili?", "a": "Nella tecnica chiusa non ci sono cicatrici esterne. Nella tecnica aperta resta una cicatrice millimetrica alla base del naso, che diventa quasi impercettibile."}, {"q": "Quando vedrò il risultato definitivo?", "a": "Il risultato è già leggibile dopo un mese, ma la definizione finale arriva tra i 9 e i 12 mesi."}]'::jsonb, 0),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'viso'), 'Blefaroplastica', 'blefaroplastica', 'Uno sguardo riposato, senza cambiare espressione.', 'Rimodellamento della cute e del grasso delle palpebre superiori e/o inferiori per correggere pesantezza e borse.', 'Indicata a chi ha palpebre cadenti, borse o un''espressione percepita come stanca anche da riposato.', '45-90 minuti', 'Locale con sedazione', 'Ritorno al lavoro in 7 giorni, ecchimosi residue coperte con make-up.', '[{"title": "Valutazione", "body": "Studio della dinamica palpebrale e del rapporto con sopracciglio e zigomo."}, {"title": "Intervento", "body": "45-90 minuti, in anestesia locale con sedazione."}, {"title": "Prime 72 ore", "body": "Impacchi freddi e riposo. Gonfiore massimo in seconda giornata."}, {"title": "Controlli", "body": "Rimozione punti a 5-7 giorni, controllo a 1 e 6 mesi."}]'::jsonb, '[{"q": "Cambierà la forma dei miei occhi?", "a": "No. L''obiettivo è alleggerire, non modificare la forma dello sguardo."}]'::jsonb, 1),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'viso'), 'Lifting viso e collo', 'lifting-viso-collo', 'Ridefinire il contorno, mantenendo i movimenti naturali.', 'Riposizionamento dei tessuti profondi (SMAS) del terzo medio e inferiore del volto e del collo.', 'Indicato in presenza di lassità cutanea, perdita del profilo mandibolare e rilassamento del collo.', '3-4 ore', 'Generale', 'Vita sociale dopo 2-3 settimane. Risultato stabile a 3 mesi.', '[{"title": "Analisi dei volumi", "body": "Distinguere ciò che è lassità da ciò che è perdita di volume."}, {"title": "Intervento", "body": "3-4 ore, anestesia generale, una notte di ricovero."}, {"title": "Prima settimana", "body": "Medicazione elastica, riposo e alimentazione morbida."}, {"title": "Ripresa", "body": "Controlli settimanali per il primo mese."}]'::jsonb, '[{"q": "Avrò un aspetto ''tirato''?", "a": "No, se si agisce sui piani profondi e non sulla sola pelle. È esattamente la differenza tra un lifting fatto bene e uno mal calibrato."}]'::jsonb, 2),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'viso'), 'Otoplastica', 'otoplastica', 'Riportare le orecchie in armonia con il profilo.', 'Correzione delle orecchie prominenti tramite rimodellamento della cartilagine.', 'Indicata dall''età scolare in poi, sia in età pediatrica sia adulta.', '60-90 minuti', 'Locale', 'Ripresa immediata delle attività leggere.', '[{"title": "Valutazione", "body": "Misurazione dell''angolo auricolo-cefalico."}, {"title": "Intervento", "body": "60-90 minuti, anestesia locale negli adulti."}, {"title": "Fascia elastica", "body": "Da indossare giorno e notte per 7 giorni, poi solo la notte per 3 settimane."}, {"title": "Controllo", "body": "A 7 giorni e a 3 mesi."}]'::jsonb, '[{"q": "È adatta ai bambini?", "a": "Sì, generalmente dai 6-7 anni, quando la cartilagine ha completato gran parte dello sviluppo."}]'::jsonb, 3),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'seno'), 'Mastoplastica additiva', 'mastoplastica-additiva', 'Volume proporzionato, scelto insieme prima dell''intervento.', 'Aumento del volume mammario con protesi anatomiche o rotonde, o con lipofilling nei casi selezionati.', 'Indicata a chi desidera più volume, maggiore simmetria o un ripristino dopo gravidanza e allattamento.', '60-90 minuti', 'Generale', 'Rientro al lavoro sedentario in 5-7 giorni.', '[{"title": "Scelta della protesi", "body": "Misurazioni toraciche e prova con simulatore per definire volume e proiezione."}, {"title": "Intervento", "body": "60-90 minuti, anestesia generale."}, {"title": "Prime settimane", "body": "Reggiseno contenitivo per 30 giorni, stop attività fisica per 6 settimane."}, {"title": "Follow-up", "body": "Controlli a 7 giorni, 1, 6 e 12 mesi, poi annuali."}]'::jsonb, '[{"q": "Le protesi vanno sostituite?", "a": "Non hanno una scadenza fissa, ma richiedono controlli periodici ed eventuale sostituzione nel corso della vita."}, {"q": "Potrò allattare?", "a": "Nella grande maggioranza dei casi sì: le vie di accesso utilizzate preservano la ghiandola."}]'::jsonb, 0),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'seno'), 'Mastopessi', 'mastopessi', 'Risollevare senza necessariamente aumentare.', 'Rimodellamento e riposizionamento del seno e del complesso areola-capezzolo.', 'Indicata in caso di ptosi mammaria dopo dimagrimenti, gravidanze o per naturale evoluzione.', '2-3 ore', 'Generale', 'Vita normale in 10-14 giorni.', '[{"title": "Valutazione del grado di ptosi", "body": "Definisce il tipo di cicatrice necessaria."}, {"title": "Intervento", "body": "2-3 ore, anestesia generale."}, {"title": "Recupero", "body": "Guaina contenitiva per 4-6 settimane."}, {"title": "Controlli", "body": "A 7 giorni, 1 e 6 mesi."}]'::jsonb, '[{"q": "Le cicatrici si vedranno?", "a": "Sono inevitabili ma pianificate lungo linee nascoste; maturano nell''arco di 12-18 mesi."}]'::jsonb, 1),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'seno'), 'Riduzione mammaria', 'riduzione-mammaria', 'Alleggerire, con un beneficio spesso anche posturale.', 'Riduzione del volume mammario con rimodellamento della forma.', 'Indicata in caso di ipertrofia con dolore cervicale, dorsale o limitazioni funzionali.', '2,5-3,5 ore', 'Generale', 'Ripresa graduale in 2-3 settimane.', '[{"title": "Inquadramento clinico", "body": "Spesso include valutazione senologica preoperatoria."}, {"title": "Intervento", "body": "2,5-3,5 ore, anestesia generale."}, {"title": "Degenza", "body": "Una notte di ricovero."}, {"title": "Controlli", "body": "Settimanali per il primo mese."}]'::jsonb, '[{"q": "È un intervento solo estetico?", "a": "Ha spesso una componente funzionale rilevante, che va documentata nella valutazione clinica."}]'::jsonb, 2),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'corpo'), 'Liposuzione', 'liposuzione', 'Rimodellare gli accumuli localizzati, non dimagrire.', 'Aspirazione del grasso localizzato tramite microcannule, con tecniche di rifinitura superficiale.', 'Indicata a chi ha peso stabile e accumuli resistenti a dieta e attività fisica.', '60-180 minuti', 'Locale con sedazione o generale', 'Ripresa in 7-10 giorni, risultato definito a 3 mesi.', '[{"title": "Mappatura", "body": "Disegno preoperatorio delle aree in piedi."}, {"title": "Intervento", "body": "60-180 minuti in base alle aree trattate."}, {"title": "Guaina elastica", "body": "Da indossare per 4 settimane."}, {"title": "Linfodrenaggio", "body": "Cicli consigliati dalla seconda settimana."}]'::jsonb, '[{"q": "Il grasso può tornare?", "a": "Le cellule rimosse non si riformano, ma quelle residue possono aumentare di volume con l''aumento di peso."}]'::jsonb, 0),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'corpo'), 'Addominoplastica', 'addominoplastica', 'Ricostruire la parete addominale dopo gravidanze o forti dimagrimenti.', 'Rimozione della cute in eccesso e riparazione della diastasi dei muscoli retti.', 'Indicata in presenza di lassità cutanea addominale e diastasi documentata.', '2,5-4 ore', 'Generale', 'Vita d''ufficio dopo 3 settimane.', '[{"title": "Valutazione", "body": "Ecografia della parete addominale quando indicata."}, {"title": "Intervento", "body": "2,5-4 ore, anestesia generale."}, {"title": "Degenza", "body": "1-2 notti, con mobilizzazione precoce."}, {"title": "Recupero", "body": "Guaina per 6 settimane, sport dopo 8-10 settimane."}]'::jsonb, '[{"q": "La cicatrice sarà nascosta?", "a": "È posizionata sotto la linea dell''intimo e concordata prima dell''intervento."}]'::jsonb, 1),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'corpo'), 'Body contouring', 'body-contouring', 'Un percorso combinato dopo grandi dimagrimenti.', 'Insieme di procedure (braccia, cosce, fianchi, addome) pianificate in più tempi chirurgici.', 'Indicato dopo chirurgia bariatrica o dimagrimenti importanti con peso stabile da almeno 12 mesi.', 'Variabile', 'Generale', 'Variabile in base ai distretti, 3-6 settimane per tempo chirurgico.', '[{"title": "Piano personalizzato", "body": "Definizione delle priorità e della sequenza degli interventi."}, {"title": "Primo tempo chirurgico", "body": "In genere il distretto con maggiore impatto funzionale."}, {"title": "Intervallo", "body": "3-6 mesi tra un tempo e l''altro."}, {"title": "Consolidamento", "body": "Follow-up nutrizionale e fisioterapico."}]'::jsonb, '[{"q": "Si può fare tutto in una volta?", "a": "Raramente. Frazionare gli interventi riduce i rischi e migliora la qualità del risultato."}]'::jsonb, 2),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'medicina-estetica'), 'Tossina botulinica', 'botox', 'Ammorbidire le rughe d''espressione mantenendo la mimica.', 'Micro-iniezioni che riducono la contrazione dei muscoli responsabili delle rughe dinamiche.', 'Indicata per rughe frontali, glabellari e perioculari.', '10-15 minuti', 'Nessuna', 'Nessun fermo. Evitare sport e posizione supina per 4 ore.', '[{"title": "Studio della mimica", "body": "Fotografie dinamiche per calibrare le unità."}, {"title": "Trattamento", "body": "10-15 minuti, senza anestesia."}, {"title": "Effetto", "body": "Visibile in 3-5 giorni, pieno a 14 giorni."}, {"title": "Mantenimento", "body": "Ogni 4-6 mesi."}]'::jsonb, '[{"q": "Avrò il viso immobile?", "a": "No, se il dosaggio è calibrato. L''obiettivo è ridurre la ruga, non la mimica."}]'::jsonb, 0),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'medicina-estetica'), 'Filler di acido ialuronico', 'filler', 'Restituire volume dove il tempo lo ha sottratto.', 'Iniezione di acido ialuronico reticolato per ripristinare volumi e definire profili.', 'Indicato per zigomi, solchi naso-genieni, labbra e profilo mandibolare.', '20-30 minuti', 'Topica', 'Immediato, con possibili lievi lividi.', '[{"title": "Analisi dei volumi", "body": "Valutazione del viso in tre dimensioni."}, {"title": "Trattamento", "body": "20-30 minuti con anestesia topica."}, {"title": "Assestamento", "body": "48-72 ore per il riassorbimento dell''edema."}, {"title": "Controllo", "body": "A 2 settimane per eventuali ritocchi."}]'::jsonb, '[{"q": "È reversibile?", "a": "Sì, l''acido ialuronico può essere sciolto con ialuronidasi."}]'::jsonb, 1),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'medicina-estetica'), 'Biorivitalizzazione', 'biorivitalizzazione', 'Qualità della pelle, prima ancora che volume.', 'Micro-iniezioni di acido ialuronico non reticolato, vitamine e aminoacidi.', 'Indicata per pelle disidratata, spenta o esposta a fumo e sole.', '20 minuti', 'Topica', 'Nessun fermo.', '[{"title": "Valutazione cutanea", "body": "Analisi di idratazione ed elasticità."}, {"title": "Ciclo iniziale", "body": "3-4 sedute a distanza di 2-3 settimane."}, {"title": "Mantenimento", "body": "1 seduta ogni 3-4 mesi."}, {"title": "Skincare", "body": "Protocollo domiciliare personalizzato."}]'::jsonb, '[{"q": "Da che età si può fare?", "a": "In genere dai 30 anni, ma dipende dalla qualità cutanea più che dall''età anagrafica."}]'::jsonb, 2),
  ((SELECT id FROM public.treatment_categories WHERE slug = 'medicina-estetica'), 'Fili di sospensione', 'fili-di-sospensione', 'Un sostegno leggero, quando il lifting non serve ancora.', 'Inserimento di fili riassorbibili che sostengono e stimolano il collagene.', 'Indicato in caso di lassità iniziale del terzo medio e del profilo mandibolare.', '40-60 minuti', 'Locale', '3-5 giorni di lieve gonfiore.', '[{"title": "Selezione del caso", "body": "Il filo non sostituisce il lifting: la selezione è decisiva."}, {"title": "Trattamento", "body": "40-60 minuti in anestesia locale."}, {"title": "Prime 2 settimane", "body": "Evitare masticazione intensa e massaggi del viso."}, {"title": "Durata", "body": "Effetto medio 12-18 mesi."}]'::jsonb, '[{"q": "Sostituisce il lifting?", "a": "No. Su lassità avanzate il risultato sarebbe insoddisfacente e di breve durata."}]'::jsonb, 3);
