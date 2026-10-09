# Marfa – evidență financiară

Aplicație web pentru evidența încasărilor și cheltuielilor unei firme care vinde la târguri (Bacău, Suceava) și online. Planul, schema și regulile de calcul sunt în [docs/PLAN.md](docs/PLAN.md).

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, RLS, Storage) · Zod · Vitest · Playwright.

## Rulare locală

Cerințe: Node 22+, Docker (pentru Supabase local).

```bash
npm install
npx supabase start            # pornește Postgres, Auth, Storage, Mailpit; aplică migrațiile
cp .env.example .env.local    # completați cheile afișate de `supabase start`
npm run create-admin -- --business "Firma SRL" --email admin@firma.ro --name "Nume" --password 'minim-10-caractere'
npm run dev                   # http://localhost:3000
```

Emailurile locale (resetare parolă, invitații) se văd în Mailpit: http://127.0.0.1:54324.

Import din CSV (de exemplu o pagină de caiet copiată): coloanele sunt descrise în `scripts/import-csv.ts`.
Fără `--apply` doar arată ce ar importa; rulat de două ori nu dublează rândurile.

```bash
npm run import-csv -- --file caiet.csv --email admin@firma.ro          # verificare
npm run import-csv -- --file caiet.csv --email admin@firma.ro --apply  # import
```

## Variabile de mediu

| Variabilă | Unde | Descriere |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | URL-ul proiectului Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | Cheia publică (publishable/anon). Accesul la date e controlat de RLS |
| `NEXT_PUBLIC_SITE_URL` | browser + server | Adresa publică a aplicației, folosită în emailuri |
| `SUPABASE_SECRET_KEY` | **doar server** | Cheia secretă (service role). Nu primește niciodată prefixul `NEXT_PUBLIC_` |

## Teste și verificări

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm test              # teste unitare
npm run test:db       # RLS, roluri, izolarea între firme, reguli financiare (necesită `supabase start`)
npm run build && npm run test:e2e   # login, logout, resetare parolă, acces pe roluri, în browser
```

`test:db` și `test:e2e` creează utilizatori și firme de test în baza locală. Nu le rulați pe baza de producție.

## Migrații

Migrațiile sunt în `supabase/migrations/` și se aplică în ordine.

- Local: `npx supabase db reset` (recreează baza și aplică toate migrațiile).
- Producție: `npx supabase link --project-ref <ref>` apoi `npx supabase db push`.

## Configurare Supabase (proiect online)

1. Creați un proiect în regiunea **Frankfurt (eu-central-1)**.
2. Aplicați migrațiile (`supabase link` + `supabase db push`). Bucket-ul privat `attachments` este creat de migrație.
3. **Authentication → Sign In / Providers**: dezactivați „Allow new users to sign up”. Lăsați Email activ. Parolă minimă: 10 caractere.
4. **Authentication → URL Configuration**: Site URL = adresa Vercel (ex. `https://marfa.vercel.app`); adăugați `https://marfa.vercel.app/**` la Redirect URLs.
5. **Authentication → Emails → Templates**: copiați conținutul din `supabase/templates/recovery.html` (Reset password) și `supabase/templates/invite.html` (Invite user). Link-urile trec prin `/auth/confirm`.
6. **Authentication → Emails → SMTP**: configurați un SMTP propriu (ex. Resend, Brevo). Serverul implicit Supabase trimite doar câteva emailuri pe oră.
7. Creați primul administrator: `npm run create-admin` cu `.env.local` setat pe proiectul online.

## Publicare pe Vercel

1. Importați repository-ul în Vercel (framework: Next.js, fără setări speciale).
2. Adăugați cele 4 variabile de mai sus în Settings → Environment Variables (Production și Preview). `SUPABASE_SECRET_KEY` doar ca variabilă server (fără `NEXT_PUBLIC_`).
3. Deploy. Actualizați Site URL în Supabase dacă domeniul s-a schimbat.

## Copii de siguranță

- Supabase Pro face backup zilnic automat (7 zile); Point-in-Time Recovery se poate activa separat.
- Pe planul gratuit nu există backup descărcabil: rulați periodic `npx supabase db dump --data-only -f backup-AAAA-LL-ZZ.sql` și păstrați fișierul în afara Supabase.
- Fișierele din Storage nu sunt incluse în dump-ul bazei; descărcați-le separat dacă e nevoie.

## Stare

Etapele 1 (proiect, schemă, RLS, audit, autentificare) și 2 (setări, utilizatori, istoric) sunt gata și testate pe un Supabase local. Din etapele 3–5 sunt gata formularele de încasări și cheltuieli, raportul lunar cu selector de lună și exportul CSV; vezi tabelul din plan pentru ce lipsește. Restul etapelor sunt în [docs/PLAN.md](docs/PLAN.md). Publicarea online nu a fost încă făcută.
