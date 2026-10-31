import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpFromLine, TriangleAlert, X } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { fmtDate, previewFifo } from '../lib/inventory.js';
import { PageHeader, ProductIcon, QtyStepper } from '../components/ui.jsx';
import ProductPicker from '../components/ProductPicker.jsx';

export default function StockOut() {
  const { batches, forecasts, stockOut, toast, productById } = useStore();
  const [params] = useSearchParams();
  const [product, setProduct] = useState(() => (params.get('product') ? productById(params.get('product')) || null : null));
  const [source, setSource] = useState('manual');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [unknown, setUnknown] = useState(null);

  const stock = product ? forecasts[product.id].stock : 0;
  const plan = product ? previewFifo(product.id, qty, batches) : null;

  const save = () => {
    try {
      const alloc = stockOut({ productId: product.id, qty, source, note });
      const from = alloc.map((a) => `#${a.batchNo}`).join(', ');
      toast(`${qty} ${product.unit} of ${product.name} taken out (Batch ${from})`);
      setProduct(null); setQty(1); setNote('');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <main className="main">
      <PageHeader title="Stock Out" sub="Oldest stock is always used first (FIFO)" />
      <div className="two-col">
        <div>
          {!product ? (
            <>
              {unknown && (
                <div className="card card-pad small" style={{ marginBottom: 12, borderColor: '#fecaca', background: 'var(--red-50)', color: 'var(--red)' }}>
                  Code <b>{unknown}</b> is not registered. Stock Out only works for existing products.
                </div>
              )}
              <ProductPicker onPick={(p, src) => { setProduct(p); setSource(src); setUnknown(null); }} onUnknownCode={setUnknown} />
            </>
          ) : (
            <div className="card card-pad">
              <div className="selected">
                <ProductIcon category={product.category} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row-title">{product.name}</div>
                  <div className="row-sub">{product.code} · {stock} {product.unit} in stock</div>
                </div>
                <button className="icon-btn" onClick={() => setProduct(null)} aria-label="Change product"><X size={18} /></button>
              </div>

              <div className="field mt-16">
                <label>Quantity taken out ({product.unit})</label>
                <QtyStepper value={qty} onChange={setQty} max={Math.max(stock, 1)} />
                <div className="quick-qty">
                  {[1, 2, 5, 10].filter((n) => n <= stock).map((n) => <button key={n} className="btn sm" onClick={() => setQty(n)}>{n}</button>)}
                  {stock > 0 && <button className="btn sm" onClick={() => setQty(stock)}>All ({stock})</button>}
                </div>
              </div>
              <div className="field">
                <label>Note (optional)</label>
                <input className="input" placeholder="e.g. Order #A102, used in store" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              {stock === 0 ? (
                <div className="fifo-box small" style={{ color: 'var(--red)' }}><TriangleAlert size={14} style={{ verticalAlign: -2 }} /> This product is out of stock.</div>
              ) : plan && (
                <div className="fifo-box">
                  <div className="small" style={{ fontWeight: 600, marginBottom: 4 }}>Pick from these batches (oldest first):</div>
                  {plan.map((a, i) => (
                    <div className="fifo-step" key={a.batchId}>
                      <span className="n">{i + 1}</span>
                      <span style={{ flex: 1 }}>Batch <b>#{a.batchNo}</b> <span className="muted small">· received {fmtDate(a.receivedAt)}</span></span>
                      <b className="num">{a.qty}</b>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn primary lg block mt-16" onClick={save} disabled={stock === 0 || !plan}>
                <ArrowUpFromLine size={19} /> Confirm Stock Out
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
