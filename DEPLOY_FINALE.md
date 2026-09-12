# Deploy — Aura Clinic (guida completa, in ordine)

Stack: GitHub (codice) → Vercel (deploy automatico) → Supabase (database).

---

## PARTE 1 — Caricare il codice su GitHub

1. Vai su `https://github.com/MariannaOliviero/auraclinicmed`
2. Clicca **"Add file" → "Upload files"**
3. Trascina dentro la cartella con i file aggiornati (mantiene le sottocartelle automaticamente)
4. Scorri in basso, scrivi un messaggio di commit (es. "Aggiornamento funzionalità gestionale")
5. Clicca il pulsante verde **"Commit changes"**

## PARTE 2 — Deploy su Vercel

Se Vercel è collegato al repository (deploy automatico da GitHub), il push su `main` avvia
da solo un nuovo deploy — non serve nessuna azione manuale. Puoi seguirne l'avanzamento dalla
dashboard di Vercel, sezione "Deployments" del progetto.

## PARTE 3 — Attivare il database (Supabase SQL Editor, una tantum)

Vai sulla dashboard di **Supabase** → il tuo progetto → **SQL Editor**. Esegui i blocchi
**in ordine**, uno alla volta: incolla, **Run**, aspetta il successo, poi passa al successivo.

### 3.1 — Nuove tabelle/migrazioni
Le migrazioni sono nella cartella `supabase/migrations` del repository: apri ciascun file
`.sql` in ordine di data (dal nome del file) e incollalo nello SQL Editor, Run per ciascuno.
Per sicurezza, verifica poi da **Database → Tables** che le tabelle attese esistano davvero.

### 3.2 — Il tuo account come admin (se non l'hai già fatto)
Sostituisci l'email con la tua:
```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'TUA-EMAIL@gmail.com'
on conflict (user_id, role) do nothing;
```

## PARTE 4 — Attivare gli SMS reali (Twilio)

Senza questo passaggio, i pulsanti "Invia SMS" restano visibili ma non mandano nulla.

1. Crea un account su [twilio.com](https://www.twilio.com/), recupera **Account SID**,
   **Auth Token** e attiva un **numero di telefono Twilio**
2. Vercel → progetto → **Settings → Environment Variables**, aggiungi tre variabili
   (ambiente Production, e Preview se vuoi testarle anche lì):
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` (es. `+390212345678`)
3. Dopo averle aggiunte, serve un nuovo deploy perché Vercel le legga (basta un redeploy
   dall'ultimo commit, anche senza modifiche al codice — pulsante "Redeploy" su Vercel).

## PARTE 5 — Collaudo finale (checklist)

Spunta uno per uno, con un account di prova:

- [ ] Registrazione nuova → entra subito nel gestionale (niente "in attesa di autorizzazione")
- [ ] Menu laterale mostra: Panoramica, Lead, Pazienti, Agenda, Turni, Documenti, Team
- [ ] "Turni" → se sei admin, vedi il modulo per aggiungere un turno, con il ruolo del
      membro dello staff mostrato in automatico (non più da scrivere a mano)
- [ ] "Pazienti" → un paziente ha il pulsante "Fissa appuntamento" e ti porta in Agenda
      con il paziente già selezionato
- [ ] "Lead" → dopo "Converti in paziente" compare anche "Fissa appuntamento"
- [ ] "Agenda" → un appuntamento con paziente che ha un telefono mostra i pulsanti
      "Invia conferma SMS" / "Invia promemoria SMS" (funzionano solo dopo la Parte 4)
- [ ] Da Chrome desktop: compare l'icona di installazione nella barra indirizzi, oppure
      il pulsante "Installa app" in fondo alla sidebar del gestionale
- [ ] La favicon (icona nella scheda del browser) è visibile correttamente

Se un punto della checklist non torna, mandami uno screenshot e sistemiamo subito.
