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
src/lib/store.jsx        App state (saved in browser localStorage)
src/data/seed.js         Realistic demo data, generated relative to today
src/data/sampleNotes.js  Demo-mode results for the sample delivery notes
src/pages/               Home, Stock In/Out, New Product, Snap, History, Inventory, Statistics, Account
src/components/          Layout, scanner, reorder modal, shared UI
```

Tech: React 18, Vite, React Router, Recharts, lucide-react icons, html5-qrcode, Express.

## Next steps after the hackathon
- Move data from localStorage to a database (e.g. Supabase / PostgreSQL) for multi-device sync.
- Real authentication and per-role permissions.
- Printable QR label sheets for new products.
