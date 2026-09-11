# Aura Clinic

Sito web e gestionale per cliniche di chirurgia plastica e medicina estetica.

## Stack

- [TanStack Start](https://tanstack.com/start) + TypeScript + React
- Tailwind CSS
- [Supabase](https://supabase.com) (database, autenticazione, storage)
- Deploy su [Vercel](https://vercel.com)

## Sviluppo locale

Serve Node.js e npm ([installa con nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <url-di-questo-repository>
cd <nome-repository>
npm i
npm run dev
```

Le variabili d'ambiente Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`) vanno impostate in un file `.env` locale e, per la produzione,
nelle Environment Variables del progetto su Vercel.
