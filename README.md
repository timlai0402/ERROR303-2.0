# StockWise

AI inventory web app for small and medium-sized businesses. Simple enough to use with no training.

**Pitch features**
- **Snap Delivery Note** — photograph a supplier invoice / delivery order; AI reads every line, matches items to your products, and adds them all as stock-in batches with one tap.
- **"Days until empty" + one-tap reorder** — StockWise learns how fast each item moves, warns before it runs out (accounting for supplier lead time), and drafts the reorder message for WhatsApp or email.

**Core**
- FIFO batches: every stock-in is a dated batch; stock-out always takes from the oldest batch and tells staff which batch to pick.
- QR / barcode scanning in the browser (phone or laptop camera), with manual entry fallback.
- AI-assisted product matching when adding new items, so duplicates get grouped instead of created.
- Full audit trail: who, what, how many, date and time. Filter history by type, date and staff.
- Custom low-stock alert level per product.
- Responsive: bottom tab bar on mobile, sidebar on desktop.

## Run it

Requires Node.js 18+.

```bash
npm install
cp .env.example .env      # optional: add your AI key for live delivery-note reading
npm run dev               # web on http://localhost:5173, API on :3001
```

Production (single server on port 3001):

```bash
npm start
```

**AI key:** in `.env` set `AI_API_KEY`, plus `AI_BASE_URL` and `AI_MODEL` from your provider (any OpenAI-compatible API, or Anthropic). The model must support images. Restart `npm run dev` after editing.

**Demo Mode:** without an API key the app still works end to end. The three sample delivery notes (in `public/samples/`) use pre-extracted results, so the Snap feature can be demoed live. Add a key to read real photos.

Demo accounts: Aisyah (Owner), Daniel and Priya (Staff). Demo codes for scanning: `SW-1001` to `SW-1021`. Reset sample data anytime from **Account → Reset demo data**.

## Shared database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard open **SQL Editor → New query**, paste `supabase/schema.sql`, and click **Run**.
3. From **Project Settings → API**, copy the Project URL and the `anon` public key into `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart `npm run dev`. On first run the demo data is uploaded automatically. **Account → Database** shows "Supabase connected", and changes sync live across every device.

Leave these blank to keep data in the browser only. The schema's open access policies are for the hackathon demo; switch to Supabase Auth policies before real use.

## Push to GitHub

```bash
git remote add origin https://github.com/<your-username>/stockwise.git
git branch -M main
git push -u origin main
```

`.env` is git-ignored, so your API key stays private.

## Project structure

```
server/index.js          Express API — proxies delivery-note photos to Claude (vision)
src/lib/inventory.js     FIFO allocation, forecasting, product matching
src/lib/store.jsx        App state (Supabase when configured, otherwise browser storage)
src/lib/db.js            Supabase load, save and live sync
supabase/schema.sql      Database tables, policies and realtime setup
src/data/seed.js         Realistic demo data, generated relative to today
src/data/sampleNotes.js  Demo-mode results for the sample delivery notes
src/pages/               Home, Stock In/Out, New Product, Snap, History, Inventory, Statistics, Account
src/components/          Layout, scanner, reorder modal, shared UI
```

Tech: React 18, Vite, React Router, Recharts, lucide-react icons, html5-qrcode, Express.

## Next steps after the hackathon
- Real authentication and per-role permissions.
- Printable QR label sheets for new products.
