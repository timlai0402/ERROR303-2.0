import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PackagePlus, ScanLine, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { findMatches } from '../lib/inventory.js';
import { CATEGORIES, PageHeader, ProductIcon, UNITS } from '../components/ui.jsx';
import Scanner from '../components/Scanner.jsx';

export default function NewProduct() {
  const { products, suppliers, createProduct, stockIn, upsertSupplier, toast } = useStore();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [scan, setScan] = useState(false);
  const [f, setF] = useState({
    name: params.get('name') || '',
    code: params.get('code') || '',
    category: 'General',
    unit: 'pcs',
    alertLevel: 10,
    leadTimeDays: 3,
    supplierId: suppliers[0]?.id || '',
    openingQty: 0,
  });
  const [newSup, setNewSup] = useState({ name: '', phone: '', email: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const matches = useMemo(() => (f.name.trim().length >= 3 ? findMatches(f.name, products, { min: 0.42 }) : []), [f.name, products]);
  const codeTaken = f.code && products.some((p) => p.code.toLowerCase() === f.code.trim().toLowerCase());

  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Please enter a product name', 'error');
    if (codeTaken) return toast('That code is already used by another product', 'error');
    let supplierId = f.supplierId;
    if (supplierId === '__new') {
      if (!newSup.name.trim()) return toast('Please enter the supplier name', 'error');
      supplierId = upsertSupplier({ ...newSup, phone: newSup.phone.replace(/\D/g, '') }).id;
    }
    const p = createProduct({ ...f, supplierId, source: params.get('code') ? 'scan' : 'manual' });
    const qty = Number(f.openingQty) || 0;
    if (qty > 0) stockIn({ productId: p.id, qty, source: 'manual', note: 'Opening stock' });
    toast(`${p.name} added${qty ? ` with ${qty} ${p.unit}` : ''} — code ${p.code}`);
    nav(`/product/${p.id}`, { replace: true });
  };

  return (
    <main className="main">
      <PageHeader title="New Product" sub="Register an item you haven't stocked before" />
      <form className="two-col" onSubmit={submit}>
        <div className="card card-pad">
          <div className="field">
            <label>Product name</label>
            <input className="input" placeholder="e.g. Nitrile Gloves Large (Box of 100)" value={f.name} onChange={set('name')} autoFocus />
            {matches.length > 0 && (
              <div className="suggest">
                <div className="suggest-title"><Sparkles size={14} /> Similar products already exist — same item?</div>
                {matches.map(({ product: p, score }) => (
                  <div className="suggest-item" key={p.id}>
                    <ProductIcon category={p.category} size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="row-title" style={{ fontSize: 14 }}>{p.name}</div>
                      <div className="row-sub">{p.code} · {Math.round(score * 100)}% match</div>
                    </div>
                    <button type="button" className="btn sm" onClick={() => nav(`/stock-in?product=${p.id}`)}>Add stock to this</button>
                  </div>
                ))}
                <div className="small muted mt-8">Not the same? Carry on below to create a new product.</div>
              </div>
            )}
          </div>

          <div className="field">
            <label>QR / barcode</label>
            <div className="input-row">
              <input className="input" placeholder="Leave blank to auto-generate" value={f.code} onChange={set('code')} />
              <button type="button" className="icon-btn" style={{ width: 46, height: 46 }} onClick={() => setScan(true)} aria-label="Scan code"><ScanLine size={20} /></button>
            </div>
            {codeTaken && <div className="hint" style={{ color: 'var(--red)' }}>This code is already in use.</div>}
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Category</label>
              <select className="select" value={f.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Unit</label>
              <select className="select" value={f.unit} onChange={set('unit')}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Low stock alert at</label>
              <input className="input" inputMode="numeric" value={f.alertLevel} onChange={set('alertLevel')} />
            </div>
            <div className="field">
              <label>Delivery lead time (days)</label>
              <input className="input" inputMode="numeric" value={f.leadTimeDays} onChange={set('leadTimeDays')} />
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="field">
            <label>Supplier</label>
            <select className="select" value={f.supplierId} onChange={set('supplierId')}>
              <option value="">— None —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="__new">+ Add new supplier</option>
            </select>
            <div className="hint">Used to draft reorder messages automatically.</div>
          </div>
          {f.supplierId === '__new' && (
            <>
              <div className="field"><label>Supplier name</label><input className="input" value={newSup.name} onChange={(e) => setNewSup({ ...newSup, name: e.target.value })} /></div>
              <div className="form-grid stack-sm">
                <div className="field"><label>WhatsApp number</label><input className="input" placeholder="60123456789" value={newSup.phone} onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })} /></div>
                <div className="field"><label>Email</label><input className="input" type="email" value={newSup.email} onChange={(e) => setNewSup({ ...newSup, email: e.target.value })} /></div>
              </div>
            </>
          )}
          <div className="field">
            <label>Opening stock (optional)</label>
            <input className="input" inputMode="numeric" value={f.openingQty} onChange={set('openingQty')} />
            <div className="hint">Quantity you have on hand right now. Saved as the first batch.</div>
          </div>
          <button className="btn primary lg block" type="submit"><PackagePlus size={19} /> Save Product</button>
        </div>
      </form>
      {scan && <Scanner onResult={(c) => { setScan(false); setF((x) => ({ ...x, code: c })); }} onClose={() => setScan(false)} />}
    </main>
  );
}
