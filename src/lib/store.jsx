import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSeed } from '../data/seed.js';
import { allocateFifo, forecast, nextBatchNo, uid } from './inventory.js';

const KEY = 'stockwise:data:v1';
const SESSION = 'stockwise:user';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return createSeed();
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(load);
  const [userId, setUserId] = useState(() => {
    try { return localStorage.getItem(SESSION); } catch { return null; }
  });
  const [toasts, setToasts] = useState([]);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  useEffect(() => {
    try {
      if (userId) localStorage.setItem(SESSION, userId);
      else localStorage.removeItem(SESSION);
    } catch { /* ignore */ }
  }, [userId]);

  const user = data.users.find((u) => u.id === userId) || null;

  const toast = useCallback((message, tone = 'success') => {
    const id = uid('t');
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const productById = useCallback((id) => dataRef.current.products.find((p) => p.id === id), []);

  // ---- actions ----
  const stockIn = useCallback(({ productId, qty, source = 'manual', note = '', at }) => {
    const d = dataRef.current;
    const batch = {
      id: uid('b'), batchNo: nextBatchNo(d.batches), productId, qtyIn: qty, qtyRemaining: qty,
      receivedAt: at || new Date().toISOString(), staff: userId, source,
    };
    const mv = { id: uid('m'), type: 'in', productId, qty, at: batch.receivedAt, staff: userId, source, note, batchId: batch.id, batchNo: batch.batchNo };
    const next = { ...d, batches: [...d.batches, batch], movements: [...d.movements, mv] };
    dataRef.current = next;
    setData(next);
    return batch;
  }, [userId]);

  const stockOut = useCallback(({ productId, qty, source = 'manual', note = '' }) => {
    const d = dataRef.current;
    const { allocations, updatedBatches } = allocateFifo(productId, qty, d.batches);
    const mv = { id: uid('m'), type: 'out', productId, qty, at: new Date().toISOString(), staff: userId, source, note, allocations };
    const next = { ...d, batches: updatedBatches, movements: [...d.movements, mv] };
    dataRef.current = next;
    setData(next);
    return allocations;
  }, [userId]);

  const createProduct = useCallback((fields) => {
    const d = dataRef.current;
    const maxCode = d.products.reduce((m, p) => Math.max(m, Number(String(p.code).replace(/\D/g, '')) || 0), 1000);
    const product = {
      id: uid('p'),
      code: fields.code?.trim() || `SW-${maxCode + 1}`,
      name: fields.name.trim(),
      unit: fields.unit || 'pcs',
      category: fields.category || 'General',
      alertLevel: Number(fields.alertLevel) || 0,
      leadTimeDays: Number(fields.leadTimeDays) || 3,
      supplierId: fields.supplierId || '',
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };
    const mv = { id: uid('m'), type: 'new', productId: product.id, qty: 0, at: product.createdAt, staff: userId, source: fields.source || 'manual' };
    const next = { ...d, products: [...d.products, product], movements: [...d.movements, mv] };
    dataRef.current = next;
    setData(next);
    return product;
  }, [userId]);

  const updateProduct = useCallback((id, patch) => {
    setData((d) => {
      const next = { ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
      dataRef.current = next;
      return next;
    });
  }, []);

  const upsertSupplier = useCallback((s) => {
    const d = dataRef.current;
    let supplier = s;
    let suppliers;
    if (s.id) suppliers = d.suppliers.map((x) => (x.id === s.id ? { ...x, ...s } : x));
    else {
      supplier = { ...s, id: uid('s') };
      suppliers = [...d.suppliers, supplier];
    }
    const next = { ...d, suppliers };
    dataRef.current = next;
    setData(next);
    return supplier;
  }, []);

  const logReorder = useCallback(({ productId, qty, channel }) => {
    setData((d) => {
      const next = { ...d, movements: [...d.movements, { id: uid('m'), type: 'reorder', productId, qty, at: new Date().toISOString(), staff: userId, source: channel }] };
      dataRef.current = next;
      return next;
    });
  }, [userId]);

  const setBusiness = useCallback((patch) => {
    setData((d) => ({ ...d, business: { ...d.business, ...patch } }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = createSeed();
    dataRef.current = fresh;
    setData(fresh);
  }, []);

  const forecasts = useMemo(() => {
    const now = Date.now();
    const map = {};
    for (const p of data.products) map[p.id] = forecast(p, data.batches, data.movements, now);
    return map;
  }, [data.products, data.batches, data.movements]);

  const value = {
    ...data, data, user, toasts, forecasts,
    login: setUserId, logout: () => setUserId(null),
    toast, productById, stockIn, stockOut, createProduct, updateProduct, upsertSupplier,
    logReorder, setBusiness, resetDemo,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
