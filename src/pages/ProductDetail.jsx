import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Pencil, Send, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { batchesOf, fmtDateTime, formatDaysLeft } from '../lib/inventory.js';
import { CATEGORIES, Modal, PageHeader, ProductIcon, StatusBadge, UNITS } from '../components/ui.jsx';
import ReorderModal from '../components/ReorderModal.jsx';
import { MovementRow } from './History.jsx';

function EditModal({ product, onClose }) {
  const { suppliers, updateProduct, toast } = useStore();
  const [f, setF] = useState({ ...product });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = () => {
    updateProduct(product.id, {
      name: f.name.trim() || product.name, category: f.category, unit: f.unit, supplierId: f.supplierId,
      alertLevel: Number(f.alertLevel) || 0, leadTimeDays: Number(f.leadTimeDays) || 1,
    });
    toast('Product updated');
    onClose();
  };
  return (
    <Modal title="Edit product" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Save changes</button></>}>
      <div className="field"><label>Name</label><input className="input" value={f.name} onChange={set('name')} /></div>
      <div className="form-grid">
        <div className="field"><label>Category</label><select className="select" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field"><label>Unit</label><select className="select" value={f.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
        <div className="field"><label>Low stock alert at</label><input className="input" inputMode="numeric" value={f.alertLevel} onChange={set('alertLevel')} /></div>
        <div className="field"><label>Lead time (days)</label><input className="input" inputMode="numeric" value={f.leadTimeDays} onChange={set('leadTimeDays')} /></div>
      </div>
      <div className="field"><label>Supplier</label>
        <select className="select" value={f.supplierId} onChange={set('supplierId')}>
          <option value="">— None —</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </Modal>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const { productById, forecasts, batches, movements, suppliers } = useStore();
  const [reorder, setReorder] = useState(false);
  const [edit, setEdit] = useState(false);
  const p = productById(id);
  if (!p) return <main className="main"><PageHeader title="Product not found" /></main>;

  const f = forecasts[p.id];
  const supplier = suppliers.find((s) => s.id === p.supplierId);
  const open = batchesOf(p.id, batches, { openOnly: true });
  const recent = movements.filter((m) => m.productId === p.id).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 12);

  return (
    <main className="main">
      <PageHeader title={p.name} sub={`${p.code} · ${p.category}`} actions={<button className="icon-btn" onClick={() => setEdit(true)} aria-label="Edit"><Pencil size={17} /></button>} />

      <div className="two-col">
        <div>
          <div className="card card-pad">
            <div className="flex center gap-12">
              <ProductIcon category={p.category} size={48} />
              <div style={{ flex: 1 }}>
                <div className="small muted">In stock</div>
                <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }} className="num">{f.stock} <span style={{ fontSize: 15, fontWeight: 500 }} className="muted">{p.unit}</span></div>
              </div>
              <StatusBadge status={f.status} />
            </div>
            <div className="ai-banner mt-16">
              <Sparkles size={16} />
              <div>
                <b>{formatDaysLeft(f.daysLeft)}</b>
                {f.avg > 0 && <> · uses ~{f.avg.toFixed(1)} {p.unit}/day</>} · delivery takes {p.leadTimeDays} days.
                {f.reason && f.status !== 'ok' && <div className="mt-8">{f.reason}. Suggested reorder: <b>{f.suggested} {p.unit}</b>.</div>}
              </div>
            </div>
            <div className="flex gap-8 mt-16 wrap">
              <Link to={`/stock-in?product=${p.id}`} className="btn green" style={{ flex: 1 }}><ArrowDownToLine size={17} /> Stock In</Link>
              <Link to={`/stock-out?product=${p.id}`} className="btn primary" style={{ flex: 1 }}><ArrowUpFromLine size={17} /> Stock Out</Link>
              <button className="btn" style={{ flex: 1 }} onClick={() => setReorder(true)}><Send size={17} /> Reorder</button>
            </div>
          </div>

          <div className="section-title"><h2>Batches (FIFO order)</h2></div>
          <div className="card list">
            {open.map((b, i) => (
              <div key={b.id} className="row">
                <span className="chip-icon" style={{ background: i === 0 ? 'var(--primary)' : '#f1f5f9', color: i === 0 ? '#fff' : '#475569', fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
                <div className="grow">
                  <div className="row-title">Batch #{b.batchNo} {i === 0 && <span className="badge blue" style={{ marginLeft: 6 }}>Use first</span>}</div>
                  <div className="row-sub">Received {fmtDateTime(b.receivedAt)}</div>
                </div>
                <div className="qty num">{b.qtyRemaining}<span className="small muted" style={{ fontWeight: 500 }}> / {b.qtyIn}</span></div>
              </div>
            ))}
            {open.length === 0 && <div className="empty">No stock on hand.</div>}
          </div>
        </div>

        <div>
          <div className="card card-pad">
            <div className="card-title" style={{ marginBottom: 10 }}>Details</div>
            <div className="small" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
              <span className="muted">Alert level</span><span>{p.alertLevel} {p.unit}</span>
              <span className="muted">Lead time</span><span>{p.leadTimeDays} days</span>
              <span className="muted">Supplier</span><span>{supplier?.name || '—'}</span>
              <span className="muted">Contact</span><span>{supplier ? `${supplier.contact || ''} ${supplier.phone ? '· +' + supplier.phone : ''}` : '—'}</span>
              <span className="muted">Added</span><span>{fmtDateTime(p.createdAt)}</span>
            </div>
          </div>
          <div className="section-title"><h2>Recent activity</h2><Link className="link" to={`/history?range=all`}>All history</Link></div>
          <div className="card list">
            {recent.map((m) => <MovementRow key={m.id} m={m} showProduct={false} />)}
          </div>
        </div>
      </div>

      {reorder && <ReorderModal product={p} onClose={() => setReorder(false)} />}
      {edit && <EditModal product={p} onClose={() => setEdit(false)} />}
    </main>
  );
}
