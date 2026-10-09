# Plan de implementare

Aplicație simplă de evidență a încasărilor și cheltuielilor pentru o firmă care cumpără marfă în vrac din străinătate și o vinde la târgurile din Bacău și Suceava și online (OLX, Vinted, Facebook Marketplace). **Nu** este o aplicație de gestiune a stocurilor: nu există produse, loturi, mișcări de stoc sau costuri pe produs.

## Arhitectură

| Strat | Alegere | De ce |
|---|---|---|
| Interfață | Next.js 16 (App Router), React 19, Tailwind 4 | Pagini randate pe server, rapide pe telefon |
| Validare | Zod pe server (în server actions) | Mesaje de eroare în română, nimic nu se salvează nevalidat |
| Date | Supabase PostgreSQL | Toate datele în baza de date, nimic în browser |
| Autentificare | Supabase Auth (email + parolă) | Înregistrare publică dezactivată; utilizatorii sunt invitați |
| Autorizare | RLS în Postgres + verificări pe server | Regulile sunt în baza de date, deci nu pot fi ocolite din browser |
| Fișiere | Supabase Storage, bucket privat `attachments` | Bonuri și facturi, separate pe firmă |
| Găzduire | Vercel | URL public; datele rămân private |

Cheia `SUPABASE_SECRET_KEY` este folosită doar pe server (invitare/dezactivare utilizatori), după ce s-a verificat că cel care face acțiunea este administrator.

```
src/
  app/(auth)/        login, resetare parolă, server actions de autentificare
  app/(app)/         paginile aplicației (Dashboard, Încasări, Cheltuieli, Rapoarte, Setări)
  app/auth/confirm   link-urile din emailuri (resetare, invitație)
  lib/auth/          sesiune, membru activ, permisiuni
  lib/supabase/      clienți Supabase (browser, server, admin, proxy)
  lib/validation/    scheme Zod
  components/        componente UI reutilizabile
supabase/migrations  schema, RLS, triggere
tests/db             teste pe un Supabase real (RLS, roluri, izolare, reguli financiare)
tests/e2e            teste în browser (login, logout, resetare parolă, acces pe roluri)
```

## Schema bazei de date

Toate tabelele de business au `business_id`. Legăturile între tabele folosesc chei compuse `(business_id, id)`, deci o cheltuială nu poate indica o categorie a altei firme.

| Tabel | Conținut |
|---|---|
| `businesses` | Firma: nume, CUI, adresă, monedă de raportare (RON), monede folosite |
| `profiles` | Nume și email pentru fiecare cont (creat automat) |
| `business_memberships` | Utilizator ↔ firmă, rol (`admin`/`operator`), acces la rapoarte, activ/dezactivat |
| `income_categories` | Tipuri de încasări (Vânzări marfă, Alte venituri) |
| `expense_categories` | Categorii de cheltuieli + grupa de raportare |
| `sales_channels` | Târg Bacău, Târg Suceava, OLX, Vinted, Facebook Marketplace, … (tip: târg/online/altele) |
| `market_locations` | Locațiile târgurilor |
| `exchange_rates` | Cursuri salvate pe monedă și zi (pentru precompletare) |
| `income_entries` | Încasări: total pe zi/perioadă (`aggregate`) sau vânzare individuală (`sale`) |
| `expenses` | Cheltuieli |
| `attachments` | Fișiere atașate unei cheltuieli sau încasări |
| `audit_logs` | Cine, ce, când și ce s-a schimbat (scris doar de triggere) |

Sume: `NUMERIC(14,2)`. Cursuri: `NUMERIC(18,6)` = lei pentru 1 unitate de valută. Echivalentul în RON este o coloană calculată de Postgres: `round(sumă × curs, 2)`. Se păstrează moneda originală, cursul și suma în RON.

Ștergerea este „soft” (`deleted_at`): rândul rămâne, apare în istoricul de audit și dispare din rapoarte. Ștergerea definitivă nu este permisă prin aplicație.

## Roluri

| Acțiune | Admin | Operator |
|---|---|---|
| Adaugă încasări și cheltuieli | da | da |
| Modifică înregistrări | toate | doar ale lui, neșterse |
| Șterge (soft) / restaurează | da | nu |
| Vede toate înregistrările, Dashboard, Rapoarte | da | doar dacă are bifat „acces la rapoarte”; altfel doar ce a introdus el |
| Setări, categorii, canale, utilizatori | da | nu |
| Istoric de audit | da | nu |

O firmă păstrează mereu cel puțin un administrator activ. Un membru dezactivat pierde imediat accesul.

## Reguli de calcul

Toate totalurile se calculează în Postgres pe sumele în RON, nu în JavaScript.

**Încasare netă** = preț/total − reducere − rambursare − comision − transport plătit de firmă.
Comisionul și transportul trecute pe o vânzare sunt deja scăzute; nu se mai trec și la Cheltuieli (formularul va avertiza).

**Încasări de la târg**: un singur rând cu totalul zilei (de ex. Târg Suceava, 5.000 lei). Se pot adăuga mai multe rânduri pentru aceeași zi. Defalcarea numerar/card este opțională, dar dacă există, trebuie să dea exact totalul; nu este venit în plus.

**Nicio încasare numărată de două ori**:
- pe același canal, un total pe perioadă și vânzări individuale în acea perioadă nu pot coexista (blocat în baza de date);
- același număr de comandă nu poate fi introdus de două ori pe același canal;
- formularul trimite un cod unic, deci un dublu-click nu creează două rânduri.

**Flux de numerar** = încasări primite (după data încasării) − cheltuieli plătite (după data plății). Încasările în așteptare și cheltuielile neplătite apar separat.

**Rezultat financiar simplificat** = încasări nete înregistrate − cheltuieli înregistrate, în perioada aleasă.
Nu este profit contabil: firma nu ține stoc, deci marfa cumpărată într-o lună poate fi vândută în lunile următoare. Rezultatul este afișat mereu cu această explicație și cu defalcarea pe grupe:

| Grupă | Categorii implicite |
|---|---|
| Achiziții marfă | Achiziții marfă |
| Transport, combustibil și import | Combustibil drumuri import, Transport internațional, Taxe de drum, Viniete, Taxe vamale, Alte cheltuieli de import, Combustibil drumuri târg |
| Târguri | Taxe Târg Bacău, Taxe Târg Suceava, Parcare, Cazare |
| Operaționale | Ambalaje, Comisioane online, Expediere, Rambursări și retururi, Reparații, Alte cheltuieli operaționale |
| Amenzi | Amenzi (mereu separat) |

Nu se calculează profit pe produs sau pe categorie de produs și nu se inventează costuri sau marje.

## Etape

| Etapă | Conținut | Stare |
|---|---|---|
| 1 | Proiect, schema Supabase + RLS + audit, autentificare (login, logout, resetare parolă), structura aplicației | **gata, testată local** |
| 2 | Setări: utilizatori (invitare, rol, dezactivare), categorii, canale, locații, cursuri, date firmă, istoric modificări | **gata, testată local** (preluarea cursului BNR nu a putut fi testată live) |
| 3 | Încasări și Cheltuieli: formulare rapide, listă, căutare, editare, ștergere cu confirmare, atașamente | **parțial**: formulare (târg, vânzare, cheltuială, motorină), liste pe lună, ștergere cu confirmare, import CSV. Lipsesc: căutare, editare, atașamente |
| 4 | Dashboard: filtre de perioadă, indicatori, comparații, grafic lunar | **parțial**: raportul lunii cu selector de lună și grafic pe canale. Lipsesc: comparații între luni, grafic pe mai multe luni |
| 5 | Rapoarte și export CSV/Excel | **parțial**: raport lunar și export CSV. Lipsește Excel |
| 6 | Publicare pe Vercel + Supabase, verificare finală | |
