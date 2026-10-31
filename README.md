# StockWise

> An AI-assisted inventory web app for small businesses. Snap a supplier's delivery note to add stock in seconds, always use the oldest stock first, and get warned before items run out — with the reorder message already drafted.

---

## Team Information

| Field                  | Details                                         |
| ---------------------- | ----------------------------------------------- |
| **Team Name**          | ERROR 303                                       |
| **Team Domain**        | Domain 2                                        |
| **SDG Track (1–17)**   | SDG 9 — Industry, Innovation and Infrastructure |
| **Team Leader**        | Timothy Lai Yong Fong                           |
| **University**         | Taylor's University                             |
| **Number of Members**  | 3                                               |

## Links

| Resource          | Link                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| GitHub Repository | https://github.com/timlai0402/ERROR303-2.0                           |
| Live Demo         | https://stock-wise.replit.app                                        |
| Slide Deck        | [SDC2026_ERROR 303_Slide_Desk.pdf](<submission/SDC2026_ERROR 303_Slide_Desk.pdf>) |
| Demo Video        | [https://youtu.be/QjNjUeEtulU](https://youtu.be/QjNjUeEtulU)         |
| Pitch Video       | [https://youtu.be/PdYZQNNhst0](https://youtu.be/PdYZQNNhst0)         |

---

## Overview

### Problem

Small businesses such as hardware shops, workshops and retail stores still track stock with paper logs or spreadsheets. Every day they struggle to answer three questions:

1. **What do I have right now?**
2. **What came in, what went out, and who recorded it?**
3. **What do I need to reorder — before it runs out?**

Two jobs eat the most time and cause the most mistakes:

- **Receiving deliveries.** Staff type every line of a supplier's delivery order into a spreadsheet by hand — around 10 minutes per delivery, with frequent typos and missed items.
- **Reordering too late.** A fixed "minimum stock" number does not account for how fast an item sells or how long the supplier takes to deliver. Items run out mid-job, work stalls, and owners make rushed purchases at higher prices.

### Solution

StockWise turns these into a few taps, in plain language, with no training needed:

- **Snap Delivery Note (AI):** photograph the supplier's delivery order or invoice. AI reads every line, matches each item to your products, and adds them all as stock in one tap — after staff review and confirm.
- **"Days until empty" alerts with one-tap reorder:** StockWise learns how fast each item moves and warns *before* it runs out ("Gloves: ~4 days left"), taking supplier delivery time into account. One tap drafts the reorder message to the right supplier on WhatsApp or email for the owner to approve and send.
- **First in, first out (FIFO):** every delivery is saved as a dated batch. When stock goes out, the app tells staff exactly which batch to take from — oldest first.

### 6-Step Operational Journey (Live Demo)

1. **Trigger:** Staff record a stock-out by scanning an item's QR code (e.g. Nitrile Gloves, `SW-1001`). The app takes stock from the oldest batch first and shows which batch to pick.
2. **Connected Data:** Each product links its stock batches, the last 14 days of usage, its low-stock alert level, the supplier's delivery time, and the supplier's WhatsApp and email.
3. **Decision Logic:** StockWise works out average daily usage and predicts days left. If stock will run out before a new delivery could arrive — or falls to the alert level — the item moves to **Low Stock Alerts** with a suggested reorder quantity (enough for delivery time + 2 weeks).
4. **Human Approval:** Nothing is sent or saved automatically. The owner reviews and edits the AI-drafted reorder message before sending it. When the delivery arrives, staff check every line the AI read from the delivery note — matched, "please check" or new — before confirming.
5. **Visible Outcome:** One tap adds all delivered items as new dated batches. Stock levels update, the alert clears, and every action appears in the **Activity Log** with staff name, date and time.
6. **Scale:** Data is stored in a shared Supabase database and syncs live across every phone, tablet and computer in the shop. The app works on any device with a browser.

### Core Features

1. **Home dashboard**
   - Product search and QR / barcode scan button.
   - **Today's Activity**: tap Stock In, Stock Out or New Items to see today's records.
   - Four large buttons: Stock Out, Stock In, New Product, History.
   - **Low Stock Alerts** showing quantity left, alert level, days left and a Reorder button.

2. **Stock In / Stock Out**
   - Scan with the phone or laptop camera, or search by name. Manual code entry as a fallback.
   - Quick quantity buttons and a large +/– stepper.
   - Stock-out shows which batches to take from (oldest first) and blocks taking more than is in stock.

3. **Snap Delivery Note (AI)**
   - Take a photo or upload an image of a delivery order or invoice.
   - AI extracts supplier, document number, item lines and quantities, and matches them to existing products.
   - A review screen labels each line *Matched*, *Check* or *New*, with editable product and quantity.
   - "Confirm All" creates every batch at once and keeps the document number on the record.
   - Demo Mode: three sample delivery notes work even without an AI key or internet.

4. **Smart Low Stock Alerts and Reorder**
   - Custom alert level and supplier delivery time for each product.
   - "Days until empty" forecast from recent usage.
   - AI-drafted reorder message, opened in WhatsApp or email for the owner to send.

5. **New Product with duplicate detection**
   - While typing a name, StockWise shows similar existing products ("Looks like Nitrile Gloves Medium — add stock to this instead?") to prevent duplicates.
   - Auto-generated product code, or scan the existing barcode.

6. **Activity Log (History)**
   - Every stock in, stock out, new product and reorder, with staff, date, time, batch and source (scanned, manual, AI delivery note).
   - Filter by type, today / 7 days / 30 days / a specific date, staff member and product.

7. **Inventory, Statistics and Account**
   - Inventory list with stock, batches, status and sorting by "runs out soonest".
   - Statistics: units on hand, stock in vs out per day, fastest-moving and non-moving items.
   - Account: switch staff, manage suppliers, business name, AI and database status.

### Architecture

```
  Phone / tablet / laptop browser
 ┌──────────────────────────────────────────────┐
 │  StockWise web app (React)                   │
 │  • Scan QR / barcode (camera)                │
 │  • FIFO batches, forecasts, duplicate check  │──── live sync ────┐
 │  • Activity log, alerts, statistics          │                   │
 └───────────────┬──────────────────────────────┘                   ▼
                 │ delivery-note photo                 ┌───────────────────────────┐
                 ▼                                     │ Supabase (PostgreSQL)     │
 ┌──────────────────────────────┐                      │ products · batches ·      │
 │ StockWise API (Node/Express) │                      │ movements · suppliers ·   │
 │ keeps the AI key private     │                      │ users · settings          │
 └───────────────┬──────────────┘                      │ + Realtime updates        │
                 │                                     └───────────────────────────┘
                 ▼
 ┌──────────────────────────────┐        ┌───────────────────────────────┐
 │ Vision AI model              │        │ WhatsApp / Email              │
 │ (OpenAI-compatible or Claude)│        │ owner sends approved reorder  │
 └──────────────────────────────┘        └───────────────────────────────┘
```

---

## Tech Stack

| Layer            | Technology                                                        |
| ---------------- | ----------------------------------------------------------------- |
| **Frontend**     | React 18, Vite, React Router, Recharts, lucide-react icons        |
| **Scanning**     | html5-qrcode (QR and barcodes through the device camera)          |
| **Backend API**  | Node.js + Express (AI proxy, serves the built app in production)  |
| **AI**           | Any vision-capable model via an OpenAI-compatible API, or Anthropic Claude |
| **Database**     | Supabase PostgreSQL with Realtime live sync (falls back to browser storage if not configured) |

---

## How to Run

Requires **Node.js 18 or newer**.

### 1. Install

```bash
git clone https://github.com/timlai0402/ERROR303-2.0.git
cd ERROR303-2.0
npm install
```

### 2. Add your keys (optional)

Copy `.env.example` to a new file named `.env` in the project folder (next to `package.json`) and fill it in:

```env
# AI for Snap Delivery Note (leave blank to use Demo Mode)
AI_API_KEY=
AI_BASE_URL=          # your provider's API address, e.g. https://.../v1
AI_MODEL=             # a model that can read images
AI_FORMAT=openai      # or "anthropic"

# Shared database (leave blank to keep data in this browser only)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

PORT=3001
```

`.env` is git-ignored. Never put real keys in `.env.example` or commit them.

### 3. Set up Supabase (optional)

1. In your Supabase project, open **SQL Editor → New query**.
2. Paste the contents of `supabase/schema.sql` and click **Run**.
3. Copy the **Project URL** and **anon public key** from **Project Settings → API** into `.env`.

On first launch the demo data is uploaded automatically. **Account → Database** shows "Supabase connected" when it works.

### 4. Start

```bash
npm run dev
# Web app: http://localhost:5173
# API:     http://localhost:3001
```

Production (one server on port 3001):

```bash
npm start
```

### Demo accounts and data

- **Aisyah Rahman** (Owner), **Daniel Lee** and **Priya Nair** (Staff) — pick one on the sign-in screen.
- Product codes for scanning: `SW-1001` to `SW-1021`.
- Sample delivery notes: `public/samples/`.
- Restore the demo data anytime: **Account → Reset demo data**.

---

## Project Structure

```
server/index.js          Express API: sends delivery-note photos to the AI model
src/pages/               Home, Stock In/Out, Snap Delivery Note, New Product,
                         History, Inventory, Product detail, Alerts, Statistics, Account
src/components/          Layout, scanner, reorder message, shared UI
src/lib/inventory.js     FIFO allocation, days-until-empty forecast, product matching
src/lib/store.jsx        App state and actions
src/lib/db.js            Supabase load, save and live sync
src/data/                Demo data and sample delivery-note results
supabase/schema.sql      Database tables, access policies and realtime setup
public/samples/          Sample delivery-note images
```

---

## Limitations and Next Steps

- The Supabase access policy is open for the hackathon demo; production needs Supabase Auth with per-business access rules.
- Simultaneous stock-outs of the same item on two devices use "last save wins"; production should move stock changes into database transactions.
- Planned: printable QR label sheets, CSV import/export, and an owner approval inbox for staff reorder requests.

---

## Team

| Name                  | Role                           | GitHub                                       |
| --------------------- | ------------------------------ | -------------------------------------------- |
| Timothy Lai Yong Fong | Team Leader / Idea pitching    | [@timlai0402](https://github.com/timlai0402) |
| Zayn Koh Hao Xiang    | Frontend & UI/UX Design        | [@zayn0214](https://github.com/zayn0214)     |
| Chong Zhen Xi         | Documentation & Making slides  | [@Ben-newbie](https://github.com/Ben-newbie) |

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).