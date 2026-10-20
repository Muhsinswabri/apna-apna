# Apna Apna

Every Trip. Every Expense. Sorted.

Mobile-first PWA for splitting group trip expenses. Local only: no backend, no accounts. Data lives in the browser's `localStorage`.

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server (service worker is off in dev)
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173 (test install + offline here)
npm test           # unit tests (calculations, settlement, storage, validation)
npm run icons      # regenerate PNG icons in public/icons from the logo geometry
```

## How the money works

- All amounts are integer paise. Parsing and formatting live in `src/lib/currency.js`.
- An expense is split equally among its participants. Leftover paise go one each to the first participants in trip-member order, so shares always add up to the exact amount.
- Totals, per-member figures and settlements are never stored. They are recomputed from saved expenses (`src/lib/calculations.js`).
- **Final balance = amount paid − overall equal share**, where the overall equal share is the trip total divided across *all* members (leftover paise distributed deterministically). Balances always sum to exactly zero.
- Per-expense participants are shown as the "allocated expense share". They do not change the final settlement, as specified.
- Settlement is greedy (largest debtor pays largest creditor) in `src/lib/settlement.js`. It is practical, not guaranteed to be the minimum number of transfers.

## Storage

- Key `apna_apna_trips`, value `{ version, trips }`.
- Unreadable data is copied to `apna_apna_trips_corrupt_<time>` before anything is replaced. Trips that cannot be repaired are dropped; expense allocations that do not add up are recomputed.
- Add schema upgrade steps in `migrate()` in `src/lib/storage.js`.
- Backup import adds trips as new entries. Existing trips are never overwritten.

## Structure

```
src/
  App.jsx, main.jsx, index.css
  pages/        Home, CreateTrip, Dashboard, ExpenseForm, ExpenseDetail, Settlement, Settings
  components/   ui, Sheet (dialogs), Toast, PageHeader, ExpenseItem, EmptyState, InstallCard, TripNotices
  hooks/        useTrips (persisted store), useRoute (hash router), useTheme, useInstall
  lib/          currency, calculations, settlement, validation, storage, model, dates, exporters (+ tests)
public/icons/   favicon.svg, PWA PNG icons
scripts/        make-icons.mjs
```
