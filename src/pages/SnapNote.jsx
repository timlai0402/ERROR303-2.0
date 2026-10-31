import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CircleCheck, FileScan, RotateCcw, Sparkles, Upload } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { findMatches, similarity } from '../lib/inventory.js';
import { PageHeader } from '../components/ui.jsx';
import { SAMPLE_NOTES } from '../data/sampleNotes.js';

const UNIT_MAP = { btl: 'bottle', bottle: 'bottle', pkt: 'pack', pack: 'pack', box: 'box', bx: 'box', roll: 'roll', pcs: 'pcs', pc: 'pcs', ctn: 'carton', carton: 'carton', ream: 'ream' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

// Shrink large phone photos before sending to the AI.
async function compress(dataUrl, max = 1600) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  if (scale === 1 && dataUrl.length < 3_000_000) return dataUrl;
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

export default function SnapNote() {
  const { products, suppliers, createProduct, stockIn, toast } = useStore();
  const [stage, setStage] = useState('pick'); // pick | reading | review | done
  const [image, setImage] = useState(null);
  const [doc, setDoc] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // 'live' | 'demo'
  const [saved, setSaved] = useState([]);
  const fileRef = useRef();

  const buildRows = (result) =>
    (result.lines || []).map((l, i) => {
      let productId = null;
      let score = 0;
      if (l.matchProductId && products.some((p) => p.id === l.matchProductId)) {
        productId = l.matchProductId;
        score = l.confidence ?? 0.9;
      } else {
        const best = findMatches(l.description, products, { min: 0.3, limit: 1 })[0];
        if (best) { productId = best.product.id; score = best.score; }
      }
      const status = productId && score >= 0.55 ? 'matched' : productId && score >= 0.35 ? 'check' : 'new';
      return {
        key: i,
        description: l.description,
        qty: Math.max(0, Math.round(Number(l.quantity) || 0)),
        unit: UNIT_MAP[String(l.unit || '').toLowerCase()] || 'pcs',
        status,
        score,
        productId: status === 'new' ? '__new' : productId,
        newName: l.description.split(/\s+/).map((w) => (/\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(' '),
      };
    });

  const process = async ({ dataUrl, sample }) => {
    setError(null);
    setStage('reading');
    const started = Date.now();
    let result = null;
    try {
      const payload = await compress(dataUrl);
      const r = await fetch('api/extract-delivery-note', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: payload, products: products.map(({ id, name, code }) => ({ id, name, code })) }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.lines) { result = data; setMode('live'); }
      else if (!sample) throw new Error(data.error || 'AI is not available');
    } catch (e) {
      if (!sample) {
        setError(`${e.message}. Live AI reading needs the server running with an API key — in the meantime, try one of the sample notes.`);
        setStage('pick');
        return;
      }
    }
    if (!result) { result = sample.result; setMode('demo'); }
    const wait = 1800 - (Date.now() - started);
    if (wait > 0) await sleep(wait);
    setDoc(result);
    setRows(buildRows(result));
    setStage('review');
  };

  const pickSample = async (s) => {
    const blob = await fetch(s.src).then((r) => r.blob());
    const dataUrl = await toDataUrl(blob);
    setImage(s.src);
    process({ dataUrl, sample: s });
  };

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await toDataUrl(file);
    setImage(dataUrl);
    process({ dataUrl });
  };

  const update = (key, patch) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const supplierGuess = doc?.supplier
    ? suppliers.map((s) => ({ s, score: similarity(doc.supplier, s.name) })).sort((a, b) => b.score - a.score)[0]
    : null;
  const supplierId = supplierGuess && supplierGuess.score > 0.4 ? supplierGuess.s.id : '';

  const confirmAll = () => {
    const done = [];
    const note = [doc?.documentNo, doc?.supplier].filter(Boolean).join(' · ');
    for (const r of rows) {
      if (!r.qty) continue;
      let pid = r.productId;
      let name;
      if (pid === '__new') {
        const p = createProduct({ name: r.newName, unit: r.unit, supplierId, alertLevel: 5, leadTimeDays: 3, source: 'delivery-note' });
        pid = p.id; name = p.name;
      } else {
        name = products.find((p) => p.id === pid)?.name;
      }
      const b = stockIn({ productId: pid, qty: r.qty, source: 'delivery-note', note });
      done.push({ name, qty: r.qty, batchNo: b.batchNo, isNew: r.productId === '__new', productId: pid });
    }
    setSaved(done);
    setStage('done');
    toast(`${done.length} items added to stock from ${doc?.documentNo || 'delivery note'}`);
  };

  const reset = () => { setStage('pick'); setImage(null); setDoc(null); setRows([]); setError(null); };
  const counts = rows.reduce((c, r) => ({ ...c, [r.status]: (c[r.status] || 0) + 1 }), {});

  return (
    <main className="main">
      <PageHeader title="Snap Delivery Note" sub="AI reads the supplier document and adds every item for you" />

      {stage === 'pick' && (
        <div className="two-col">
          <div className="card card-pad">
            <div className="dropzone">
              <span className="chip-icon" style={{ width: 56, height: 56, background: '#e0e7ff', color: '#4338ca' }}><FileScan size={28} /></span>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Photograph the delivery order or invoice</div>
              <div className="small muted" style={{ maxWidth: 340 }}>Lay it flat in good light so all item lines are visible.</div>
              <div className="flex gap-8 wrap mt-8" style={{ justifyContent: 'center' }}>
                <button className="btn primary" onClick={() => { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click(); }}><Camera size={18} /> Take photo</button>
                <button className="btn" onClick={() => { fileRef.current.removeAttribute('capture'); fileRef.current.click(); }}><Upload size={18} /> Upload image</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
            </div>
            {error && <div className="card-pad small mt-12" style={{ background: 'var(--amber-50)', color: 'var(--amber)', borderRadius: 10, border: '1px solid #fde68a' }}>{error}</div>}
          </div>
          <div className="card card-pad">
            <div className="card-title">Try a sample</div>
            <div className="small muted" style={{ margin: '2px 0 12px' }}>Real-looking supplier documents for the demo.</div>
            <div className="samples">
              {SAMPLE_NOTES.map((s) => (
                <button key={s.id} className="sample" onClick={() => pickSample(s)}>
                  <img src={s.src} alt={s.label} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === 'reading' && (
        <div className="two-col">
          <div className="scanning"><img className="note-preview" src={image} alt="Delivery note" /></div>
          <div className="card card-pad">
            <div className="ai-banner"><Sparkles size={16} /><div><b>Reading the document…</b><br />Finding item lines, quantities and matching them to your products.</div></div>
          </div>
        </div>
      )}

      {stage === 'review' && (
        <div className="two-col">
          <div>
            <div className="card card-pad" style={{ marginBottom: 12 }}>
              <div className="flex between center wrap gap-8">
                <div>
                  <div style={{ fontWeight: 700 }}>{doc.supplier || 'Unknown supplier'}</div>
                  <div className="small muted">{doc.documentNo || 'No document number'} · {rows.length} lines found</div>
                </div>
                <span className="badge ai"><Sparkles size={11} /> {mode === 'live' ? 'Read by AI' : 'Demo mode'}</span>
              </div>
              <div className="flex gap-8 wrap mt-12">
                {counts.matched > 0 && <span className="badge green">{counts.matched} matched</span>}
                {counts.check > 0 && <span className="badge amber">{counts.check} please check</span>}
                {counts.new > 0 && <span className="badge violet">{counts.new} new product{counts.new > 1 ? 's' : ''}</span>}
              </div>
            </div>
            <div className="card">
              {rows.map((r) => (
                <div key={r.key} className="review-line">
                  <div>
                    <div className="extracted">On document: <b style={{ color: 'var(--text-2)' }}>{r.description}</b></div>
                  </div>
                  <div>
                    {r.status === 'matched' && <span className="badge green">Matched</span>}
                    {r.status === 'check' && <span className="badge amber">Check</span>}
                    {r.status === 'new' && <span className="badge violet">New</span>}
                  </div>
                  <div className="controls">
                    <select className="select" value={r.productId} onChange={(e) => update(r.key, { productId: e.target.value, status: e.target.value === '__new' ? 'new' : 'matched' })}>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option value="__new">+ Create as new product</option>
                    </select>
                    <input className="input num" inputMode="numeric" value={r.qty} onChange={(e) => update(r.key, { qty: Number(e.target.value.replace(/\D/g, '')) || 0 })} aria-label="Quantity" />
                  </div>
                  {r.productId === '__new' && (
                    <div className="controls">
                      <input className="input" style={{ width: '100%', textAlign: 'left', fontWeight: 500 }} value={r.newName} onChange={(e) => update(r.key, { newName: e.target.value })} aria-label="New product name" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-8 mt-16">
              <button className="btn" onClick={reset}><RotateCcw size={16} /> Retake</button>
              <button className="btn green lg" style={{ flex: 1 }} onClick={confirmAll} disabled={!rows.some((r) => r.qty > 0)}>
                <CircleCheck size={19} /> Confirm All ({rows.reduce((s, r) => s + r.qty, 0)} units)
              </button>
            </div>
          </div>
          <div className="hide-sm"><img className="note-preview" src={image} alt="Delivery note" /></div>
        </div>
      )}

      {stage === 'done' && (
        <div className="two-col">
          <div className="card">
            <div className="card-pad flex center gap-12">
              <span className="chip-icon tone-green" style={{ width: 44, height: 44 }}><CircleCheck size={24} /></span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{saved.length} items added to stock</div>
                <div className="small muted">Each saved as a new FIFO batch, recorded under your name.</div>
              </div>
            </div>
            <div className="list">
              {saved.map((s) => (
                <Link key={s.batchNo} to={`/product/${s.productId}`} className="row">
                  <div className="grow">
                    <div className="row-title">{s.name} {s.isNew && <span className="badge violet" style={{ marginLeft: 4 }}>New</span>}</div>
                    <div className="row-sub">Batch #{s.batchNo}</div>
                  </div>
                  <div className="qty in num">+{s.qty}</div>
                </Link>
              ))}
            </div>
            <div className="card-pad flex gap-8">
              <button className="btn" style={{ flex: 1 }} onClick={reset}><FileScan size={16} /> Snap another</button>
              <Link to="/history?type=in&range=today" className="btn primary" style={{ flex: 1 }}>View history</Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
