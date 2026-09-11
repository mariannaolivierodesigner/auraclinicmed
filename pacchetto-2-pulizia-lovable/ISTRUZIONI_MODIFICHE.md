# Note sulle funzionalità del gestionale

Riferimento su cosa fa ciascuna funzionalità aggiunta. Per i passaggi di pubblicazione
(GitHub → Vercel → Supabase) vedi `DEPLOY_FINALE.md`.

## Invio SMS appuntamenti
Il pulsante "Invia conferma SMS" / "Invia promemoria SMS" in Agenda chiama una funzione
server integrata nell'app (`src/lib/sms.functions.ts`), non una funzione separata: va
comunque configurato Twilio (variabili d'ambiente su Vercel, vedi `DEPLOY_FINALE.md` Parte 4).

**Nota su "invio automatico"**: quello attuale è l'invio **manuale con un click** dallo
staff. Per renderlo automatico (es. promemoria inviato da solo 24h prima), serve uno
scheduler esterno (es. un Cron Job su Vercel, o `pg_cron`/`pg_net` lato Supabase) che
chiami periodicamente questa stessa funzione.

## Turni staff
Sezione "Turni" nel gestionale: gli **admin** assegnano turni ai membri dello staff
(data/ora inizio-fine); il ruolo mostrato accanto al turno viene letto automaticamente
dal ruolo clinico assegnato alla persona nella scheda Team (non si scrive più a mano).

## Documenti: archivio reale
"Documenti" è un archivio vero: lo staff carica il file (PDF o foto della scansione) di
un documento già firmato dal paziente. Il file è conservato in un bucket privato
(`documenti-pazienti`, visibile solo allo staff), collegato al paziente. Gli admin
possono eliminare un documento caricato per errore.

## Eliminazione dati (Lead, Pazienti, Risultati)
Per gli **admin**, ogni scheda Lead/Paziente/Caso in Risultati ha un pulsante per
eliminarla in modo permanente (con richiesta di conferma). Eliminare un paziente elimina
automaticamente anche i suoi appuntamenti e documenti collegati; eliminare un caso in
Risultati rimuove anche le foto dallo storage.

## App installabile su desktop e smartphone (PWA)
Il sito è installabile come un'app, senza passare da App Store/Play Store
(`public/manifest.webmanifest`, `public/sw.js`, icone in `public/icons/`). Le icone
segnaposto vanno sostituite con il logo reale del cliente quando si personalizza il
prodotto (stessi nomi/dimensioni: 192×192, 512×512, versioni "maskable" per Android,
apple-touch-icon 180×180).

## "Fissa appuntamento" diretto da Lead e Pazienti
Sia in Pazienti che in Lead (dopo la conversione) c'è un pulsante "Fissa appuntamento"
che porta in Agenda con il paziente già selezionato.

## ⚠️ Registrazione automatica come "admin" — SOLO per la demo pubblica
La migrazione `20260904210000_demo_auto_admin_role.sql` fa sì che chiunque si registri
sul sito demo pubblico riceva subito il ruolo **admin** — comodo per far provare la demo
ai potenziali clienti, ma **da disattivare obbligatoriamente prima di consegnare il
prodotto a un cliente reale**, altrimenti chiunque si registrasse sul sito del cliente
otterrebbe accesso completo ai dati reali dei pazienti. Per disattivarla: creare una
nuova migrazione che rimette la funzione `handle_new_user` alla versione originale
(senza la riga che inserisce in `user_roles`) — se serve, la preparo io al momento
della consegna.
