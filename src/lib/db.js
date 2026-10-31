// Supabase sync layer. If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set,
// the app runs offline using browser storage instead.
import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = URL && KEY ? createClient(URL, KEY) : null;
export const dbEnabled = Boolean(supabase);

// app state key -> table name
export const TABLES = {
  users: 'app_users',
  suppliers: 'suppliers',
  products: 'products',
  batches: 'batches',
  movements: 'movements',
};
const SETTINGS = 'settings';

const snake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export const toRow = (o) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [snake(k), v]));

export const fromRow = (r) =>
  Object.fromEntries(
    Object.entries(r)
      .filter(([k, v]) => v !== null && k !== 'updated_at')
      .map(([k, v]) => [camel(k), v])
  );

async function selectAll(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/** Load everything. Returns null when the database is empty (first run). */
export async function loadAll() {
  const entries = await Promise.all(
    Object.entries(TABLES).map(async ([key, table]) => [key, (await selectAll(table)).map(fromRow)])
  );
  const data = Object.fromEntries(entries);
  const { data: s, error } = await supabase.from(SETTINGS).select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data.products.length && !data.users.length) return null;
  return {
    version: 1,
    business: { name: s?.name || 'My Business', currency: s?.currency || 'RM' },
    resetAt: s?.reset_at || null,
    ...data,
  };
}

export async function upsert(key, items) {
  if (!items.length) return;
  for (let i = 0; i < items.length; i += 500) {
    const { error } = await supabase.from(TABLES[key]).upsert(items.slice(i, i + 500).map(toRow));
    if (error) throw error;
  }
}

export async function saveSettings(business, resetAt) {
  const row = { id: 1, name: business.name, currency: business.currency || 'RM' };
  if (resetAt) row.reset_at = resetAt;
  const { error } = await supabase.from(SETTINGS).upsert(row);
  if (error) throw error;
}

/** Replace all data (first run or "Reset demo data"). */
export async function replaceAll(data) {
  for (const table of Object.values(TABLES)) {
    const { error } = await supabase.from(table).delete().neq('id', '');
    if (error) throw error;
  }
  for (const key of Object.keys(TABLES)) await upsert(key, data[key] || []);
  const resetAt = new Date().toISOString();
  await saveSettings(data.business, resetAt);
  return resetAt;
}

/** Live updates from other devices. */
export function subscribe({ onRow, onSettings }) {
  const reverse = Object.fromEntries(Object.entries(TABLES).map(([k, t]) => [t, k]));
  const channel = supabase.channel('stockwise-live');
  channel.on('postgres_changes', { event: '*', schema: 'public' }, (p) => {
    if (p.table === SETTINGS) {
      if (p.new) onSettings(p.new);
      return;
    }
    const key = reverse[p.table];
    if (key && p.eventType !== 'DELETE' && p.new) onRow(key, fromRow(p.new));
  });
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
