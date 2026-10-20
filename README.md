# Apna Apna

Every Trip. Every Expense. Sorted.

Mobile-first PWA for splitting group trip expenses. Local only: no backend, no accounts. Data lives in the browser's `localStorage`.

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server (service worker is off in dev)
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173 (test install + offline here)
npm test           # unit tests (calculations, settlement, storage, members, currency, Title Case)
npm run icons      # regenerate PNG icons in public/icons from the logo geometry
```

## How the money works

- Each trip has one currency (default INR, picked from a searchable offline list in `src/lib/currencies.js`). Amounts are stored as integers in that currency's minor units (paise, cents, fils, whole yen). Parsing and formatting live in `src/lib/currency.js` and respect each currency's decimals.
- An expense is split equally among the participants chosen for it. Leftover minor units go one each to the first participants in trip-member order, so shares always add up to the exact amount.
- The payer and the participants are separate: the payer may be left out of the split.
- **Balance = total paid − allocated expense share**, where the share is the sum of the member's saved allocations. Balances always sum to exactly zero. An "overall equal share" is shown only as information, and only for groups where nobody joined late or left.
- Members can join and leave during a trip (`joinedAt` / `leftAt`). A new member only shares expenses recorded after joining; a departed member keeps their history and balance and is offered for no new expenses. See `src/lib/members.js` and `src/lib/model.js`.
- Totals, per-member figures and settlements are never stored. They are recomputed from saved expenses (`src/lib/calculations.js`). Current Status and Final Settlement run the same function.
- Settlement is greedy (largest debtor pays largest creditor) in `src/lib/settlement.js`. It is practical, not guaranteed to be the minimum number of transfers.
- User-entered names and titles are Title Cased (`src/lib/text.js`, `TitleInput`).

## Sharing the settlement summary

"Share Settlement Summary" (Current Status / Final Settlement screen) builds a standalone report from the saved trip, using the same `computeTripStats` as the screen.

- `settlementReport.js` turns the trip into plain, already-formatted data. `reportLayout.js` measures and places it: if everything fits one image of up to 620 x 1480 units it becomes a PNG, otherwise a multi-page A4 PDF with a repeated header, page numbers, and no member card or payment split across pages. Text is never shrunk to force a fit.
- `reportRender.jsx` draws the pages on a canvas (no screen capture, no network; fonts, logo, trip picture and avatars are bundled) and is loaded only when the button is used. `pdf.js` writes the PDF itself, so no library was added. The PDF holds page images, so its text is not selectable.
- `shareFile.js` uses `navigator.canShare({ files })` and the Web Share API. A cancelled share shows nothing. If the browser wants a fresh tap, or cannot share files, a sheet offers Share, Download and Copy text.

## Storage

- Key `apna_apna_trips`, value `{ version, trips }`. Current schema version is 2.
- v2 adds `currencyCode` on trips, `joinedAt`/`leftAt`/`status` on members, and `category` on expenses. Version 1 data is read with safe defaults (INR, members present from the start), and a copy of the original is kept under `apna_apna_trips_v1_<time>` before the first v2 save.
- Unreadable data is copied to `apna_apna_trips_corrupt_<time>` before anything is replaced. Trips that cannot be repaired are dropped; expense allocations that do not add up are recomputed.
- Add schema upgrade steps in `migrate()` / `sanitizeTrip()` in `src/lib/storage.js`.
- Backup import adds trips as new entries. Existing trips are never overwritten.

## Structure

```
src/
  App.jsx, main.jsx, index.css
  pages/        Home, CreateTrip, Dashboard, Members, ExpenseForm, ExpenseDetail, Settlement (Current Status + Final), Settings
  components/   ui, Sheet (dialogs), Toast, PageHeader, ExpenseItem, EmptyState, InstallCard, TripNotices, TitleInput, CurrencyPicker
  hooks/        useTrips (persisted store), useRoute (hash router), useTheme, useInstall
  lib/          currencies, currency, text, members, calculations, settlement, validation, storage, model, dates, exporters, settlementReport, reportLayout, reportRender, pdf, shareFile (+ tests)
public/icons/   favicon.svg, PWA PNG icons
scripts/        make-icons.mjs
```
