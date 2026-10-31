import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ChevronRight, FileScan, Sparkles, X } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { nextBatchNo } from '../lib/inventory.js';
import { PageHeader, ProductIcon, QtyStepper } from '../components/ui.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

export default function StockIn() {
  const { batches, forecasts, stockIn, toast, productById } = useStore();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(() => (params.get('product') ? productById(params.get('product')) || null : null));
  const [source, setSource] = useState('manual');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  const save = () => {
    const b = stockIn({ productId: product.id, qty, source, note });
    toast(`${qty} ${product.unit} added to ${product.name} — Batch #${b.batchNo}`);
    setProduct(null); setQty(1); setNote('');
  };

  return (
    <main className="main">
      <PageHeader title="Stock In" sub="Record items received into the store" />
      <div className="two-col">
        <div>
          {!product ? (
            <>
              <Link to="/snap" className="card card-pad flex center gap-12" style={{ borderColor: '#c7d2fe', background: '#f5f7ff', marginBottom: 14 }}>
                <span className="chip-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}><FileScan size={19} /></span>
                <div style={{ flex: 1 }}>
                  <div className="flex center gap-8"><b>Received a delivery?</b><span className="badge ai"><Sparkles size={11} /> AI</span></div>
                  <div className="small muted">Snap the delivery note to add all items at once.</div>
                </div>
                <ChevronRight size={18} className="muted" />
              </Link>
              <ProductPicker
                onPick={(p, src) => { setProduct(p); setSource(src); }}
                onUnknownCode={(code) => nav(`/new-product?code=${encodeURIComponent(code)}`)}
              />
            </>
          ) : (
            <div className="card card-pad">
              <div className="selected">
                <ProductIcon category={product.category} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{product.name}</div>
                  <div className="row-sub">{product.code} · Currently {forecasts[product.id].stock} {product.unit}</div>
                </div>
                <button className="icon-btn" onClick={() => setProduct(null)} aria-label="Change product"><X size={18} /></button>
              </div>

              <div className="field mt-16">
                <label>Quantity received ({product.unit})</label>
                <QtyStepper value={qty} onChange={setQty} />
                <div className="quick-qty">
                  {[5, 10, 20, 50].map((n) => <button key={n} className="btn sm" onClick={() => setQty(n)}>{n}</button>)}
                </div>
              </div>
              <div className="field">
                <label>Note (optional)</label>
                <input className="input" placeholder="e.g. DO #12345 from supplier" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="fifo-box small">
                This will be saved as <b>Batch #{nextBatchNo(batches)}</b>, received {new Date().toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}.
                New stock goes to the back of the queue (first in, first out).
              </div>
              <button className="btn green lg block mt-16" onClick={save}>
                <ArrowDownToLine size={19} /> Confirm Stock In
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
