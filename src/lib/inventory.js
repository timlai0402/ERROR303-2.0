// Core inventory logic: FIFO allocation, forecasting, and product matching.

export const DAY = 24 * 60 * 60 * 1000;

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function stockOf(productId, batches) {
  return batches
    .filter((b) => b.productId === productId)
    .reduce((sum, b) => sum + b.qtyRemaining, 0);
}

export function batchesOf(productId, batches, { openOnly = false } = {}) {
  return batches
    .filter((b) => b.productId === productId && (!openOnly || b.qtyRemaining > 0))
    .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt));
}

export function nextBatchNo(batches) {
  const max = batches.reduce((m, b) => Math.max(m, Number(b.batchNo) || 0), 0);
  return String(max + 1).padStart(4, '0');
}

/**
 * FIFO: take `qty` from the oldest open batches first.
 * Returns { allocations, updatedBatches } or throws if stock is insufficient.
 */
export function allocateFifo(productId, qty, batches) {
  const open = batchesOf(productId, batches, { openOnly: true });
  const available = open.reduce((s, b) => s + b.qtyRemaining, 0);
  if (qty > available) {
    throw new Error(`Only ${available} in stock.`);
  }
  let remaining = qty;
  const allocations = [];
  const changes = new Map();
  for (const b of open) {
    if (remaining <= 0) break;
    const take = Math.min(b.qtyRemaining, remaining);
    allocations.push({ batchId: b.id, batchNo: b.batchNo, qty: take, receivedAt: b.receivedAt });
    changes.set(b.id, b.qtyRemaining - take);
    remaining -= take;
  }
  const updatedBatches = batches.map((b) =>
    changes.has(b.id) ? { ...b, qtyRemaining: changes.get(b.id) } : b
  );
  return { allocations, updatedBatches };
}

/** Preview which batches would be picked, without changing anything. */
export function previewFifo(productId, qty, batches) {
  try {
    return allocateFifo(productId, qty, batches).allocations;
  } catch {
    return null;
  }
}

// ---------- Forecasting ("Days until empty") ----------

export const FORECAST_WINDOW_DAYS = 14;

export function avgDailyUsage(productId, movements, now = Date.now()) {
  const since = now - FORECAST_WINDOW_DAYS * DAY;
  const outs = movements.filter(
    (m) => m.type === 'out' && m.productId === productId && new Date(m.at).getTime() >= since
  );
  const total = outs.reduce((s, m) => s + m.qty, 0);
  return total / FORECAST_WINDOW_DAYS;
}

export function forecast(product, batches, movements, now = Date.now()) {
  const stock = stockOf(product.id, batches);
  const avg = avgDailyUsage(product.id, movements, now);
  const daysLeft = avg > 0 ? stock / avg : Infinity;
  const lead = product.leadTimeDays ?? 3;

  const belowLevel = stock <= (product.alertLevel ?? 0);
  const beforeDelivery = daysLeft <= lead;
  let status = 'ok';
  let reason = null;
  if (stock === 0) {
    status = 'critical';
    reason = 'Out of stock';
  } else if (beforeDelivery) {
    status = 'critical';
    reason = `Runs out before a new delivery (${lead}-day lead time)`;
  } else if (belowLevel) {
    status = 'critical';
    reason = `At or below alert level of ${product.alertLevel}`;
  } else if (daysLeft <= lead + 4) {
    status = 'watch';
    reason = 'Running low soon';
  }

  // Suggest enough to cover lead time + 2 weeks, rounded up to a multiple of 5.
  const target = avg * (lead + 14);
  let suggested = Math.max(Math.ceil(target - stock), product.alertLevel || 5);
  suggested = Math.ceil(suggested / 5) * 5;

  return { stock, avg, daysLeft, status, reason, suggested };
}

export function formatDaysLeft(daysLeft) {
  if (daysLeft === Infinity) return 'No recent usage';
  if (daysLeft < 1) return 'Less than 1 day left';
  const d = Math.round(daysLeft);
  return `~${d} day${d === 1 ? '' : 's'} left`;
}

// ---------- Product matching (AI-assisted grouping) ----------

const STOP = new Set(['the', 'a', 'of', 'and', 'pcs', 'pc', 'unit', 'units', 'x', 'pack', 'box', 'ctn', 'carton']);
const ALIASES = {
  ctn: 'carton', bx: 'box', pkt: 'packet', btl: 'bottle', ltr: 'l', litre: 'l', liter: 'l',
  ml: 'ml', gsm: 'gsm', blk: 'black', blu: 'blue', wht: 'white', med: 'medium', lg: 'large',
  sm: 'small', nitril: 'nitrile', sanitizer: 'sanitiser', sanitize: 'sanitiser', tisu: 'tissue', glove: 'gloves', towels: 'towel', rolls: 'roll', bags: 'bag',
};

function tokens(str = '') {
  return String(str)
    .toLowerCase()
    .replace(/(\d)\s*(gsm|ml|l|kg|g|mm|cm|m)\b/g, '$1$2')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => ALIASES[t] || t)
    .map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t))
    .filter((t) => !STOP.has(t));
}

function bigrams(s) {
  const out = new Set();
  const clean = s.replace(/\s+/g, '');
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return out;
}

export function similarity(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const sa = new Set(ta);
  const sb = new Set(tb);
  const inter = [...sa].filter((t) => sb.has(t)).length;
  const jaccard = inter / new Set([...sa, ...sb]).size;
  const ba = bigrams(ta.join(' '));
  const bb = bigrams(tb.join(' '));
  const binter = [...ba].filter((x) => bb.has(x)).length;
  const dice = (2 * binter) / (ba.size + bb.size || 1);
  return Math.round((0.55 * jaccard + 0.45 * dice) * 100) / 100;
}

/** Return best matches for a name (and optional code) against existing products. */
export function findMatches(query, products, { code, limit = 3, min = 0.35 } = {}) {
  if (code) {
    const exact = products.find((p) => p.code && p.code.toLowerCase() === String(code).toLowerCase());
    if (exact) return [{ product: exact, score: 1, exactCode: true }];
  }
  return products
    .map((p) => ({ product: p, score: similarity(query, `${p.name} ${p.sku || ''}`) }))
    .filter((m) => m.score >= min)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ---------- Formatting helpers ----------

export function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function isToday(iso, now = new Date()) {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function startOfDay(t = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
