# KitaRadar

**KitaRadar** ist eine Next.js-Webanwendung für die Kita-Suche in Deutschland. Eltern finden freie Kita-Plätze auf einer interaktiven Karte, bewerben sich per KI-generiertem Anschreiben und verfolgen den Bewerbungsstatus.

## Tech Stack

- **Framework:** Next.js 16 (App Router, `src/app/`)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Backend/DB:** Supabase (PostgreSQL, Auth, RLS) — Schema `kitaradar-dev`
- **Karte:** MapLibre GL (WebGL, echte 3D-Gebäude) + OpenFreeMap Vector Tiles
- **KI:** OpenAI (Suchassistent, Bewerbungsgenerator, Empfehlungen)
- **Payments:** Stripe (Free / Pro / Family Pläne)
- **i18n:** next-intl (DE / EN)
- **Deployment:** Vercel (via GitHub Actions CI/CD)

## Features

| Bereich | Feature |
|---|---|
| **Suche** | Kartenbasierte Umkreissuche (OSM/Overpass), Radius-Auswahl 1–25 km, Träger-Filter |
| **Karte** | MapLibre GL mit 3 Modi: Normal (Vektor), Satellit (ESRI), 3D-Gebäude (fill-extrusion) |
| **KI-Suche** | Kontext-Filter per Freitext (OpenAI), KI-Empfehlungen nach Elternpräferenzen |
| **Bewerbung** | KI-generiertes Anschreiben, Bewerbungs-Tracker (Dashboard) |
| **Profil** | Erweitertes Elternprofil (Job, Familie, Sprachen, Budget, Betreuungsbedarf), 9-Tab Sidebar-Navigation (Desktop vertikal, Mobil horizontal), DSGVO-Einwilligung |
| **Community** | Feed mit Eltern-Posts, Upvoting, Report |
| **Admin** | Benutzer-Management, Statistiken (DB-Live-Daten), Enrichment-Cache-Verwaltung |
| **Legal** | Impressum, Datenschutz, AGB (DE/EN), DSGVO-konform |

## Quick Start

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen setzen
cp .env.example .env.local
# Supabase-Zugangsdaten in .env.local eintragen

# 3. Dev-Server starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Dev-Server starten (Turbopack) |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktionsserver starten |
| `npm run lint` | ESLint ausführen (0 Fehler, 0 Warnungen) |
| `npm run typecheck` | TypeScript-Typprüfung |
| `npx vitest run` | Tests ausführen (218 Tests, 24 Suiten) |
| `npx vitest run --coverage` | Tests mit Coverage-Bericht |

## Architektur

```
src/
  app/[locale]/          # Alle Seiten (Next.js App Router, i18n)
    search/              # Kita-Suche mit MapLibre GL Karte
    profile/             # Erweitertes Elternprofil + DSGVO
    dashboard/           # Bewerbungs-Tracker
    admin/               # Admin-Bereich (Statistiken, Nutzer, Cache)
    feed/                # Community-Feed
    recommendations/     # KI-Empfehlungen
    pricing/             # Stripe-Pläne
    legal/               # Impressum, Datenschutz, AGB
  components/
    search/              # SearchClient, KitaMapGL, KitaCard, ...
    profile/             # ProfileClient, DataPrivacyConsentDialog
    admin/               # AdminRefreshButtons, ...
    layout/              # Header, Footer, UserNav, NotificationBell
  lib/
    supabase/            # Client + Server Supabase-Helper
    overpass.ts          # OSM Overpass API
    openai.ts            # KI-Funktionen
    stripe.ts            # Stripe-Integration
  i18n/                  # next-intl Routing + Request-Config
messages/
  de.json                # Deutsche Übersetzungen
  en.json                # Englische Übersetzungen
supabase/
  migrations/            # Versionierte DB-Migrationen
```

## Umgebungsvariablen

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_SCHEMA=kitaradar-dev

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://kitaradar.de
```

## Code-Qualität

| Prüfung | Status |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ 0 Fehler |
| ESLint | ✅ 0 Fehler, 0 Warnungen |
| Vitest | ✅ 218/218 Tests, 24 Suiten |
| Next.js Build | ✅ Fehlerfrei |

Alle Checks werden bei jedem Push automatisch via GitHub Actions ausgeführt.

## Übersetzungen

Alle Nutzeroberflächen-Texte sind vollständig in **Deutsch (DE)** und **Englisch (EN)** übersetzt. Übersetzungsdateien:

- `messages/de.json` — Deutsch (vollständig, inkl. Profil, Feed, Suche, Admin, Legal)
- `messages/en.json` — Englisch (vollständig)

Sprachwechsel jederzeit über den Language Switcher im Header möglich.

## Karten-Implementierung

Die Karte verwendet **MapLibre GL** (kein API-Key notwendig):

| Modus | Tiles | Besonderheit |
|---|---|---|
| Normal | OpenFreeMap Positron / Dark-Matter | Auto Dark/Light je nach Theme |
| Satellit | ESRI World Imagery (Raster) | Echte Satellitenfotos |
| 3D-Gebäude | OpenFreeMap Liberty + `fill-extrusion` | OSM-Gebäudehöhen, Pitch 50°, Bearing -15° |

Fonts: `fonts.openmaptiles.org` (Open Sans, Noto Sans — kostenlos, kein Key)

## Datenbank-Migrationen

```bash
# Migration manuell im Supabase SQL Editor ausführen:
# https://supabase.com/dashboard/project/<project-ref>/sql/new
# Migrations-Dateien: supabase/migrations/
```

Ausstehende Migration (muss manuell ausgeführt werden):
- `20260509000005_extended_parent_profile.sql` — 17 neue Spalten für erweitertes Elternprofil

## Documentation

- **[HOWTO.md](HOWTO.md)** — Vollständige Setup- & Deployment-Anleitung (DE/EN)
- **[AGENTS.md](AGENTS.md)** — GitHub Copilot Agents, Skills & Instructions
- **[anforderungen/](anforderungen/)** — WAMOCON Anforderungsdokument
- **[legal-docs/](legal-docs/)** — Rechtsdokumente (DE/EN)
