import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackagePlus, ScanLine, Search } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { findMatches } from '../lib/inventory.js';
import { ProductIcon } from './ui.jsx';
import Scanner from './Scanner.jsx';

export default function ProductPicker({ onPick, onUnknownCode, autoScan = false }) {
  const { products, forecasts } = useStore();
  const [q, setQ] = useState('');
  const [scan, setScan] = useState(autoScan);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
    const direct = products.filter(
      (p) => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)
    );
    if (direct.length) return direct.slice(0, 12);
    return findMatches(q, products, { limit: 6, min: 0.2 }).map((m) => m.product);
  }, [q, products]);

  const handleCode = (code) => {
    setScan(false);
    const p = products.find((x) => x.code.toLowerCase() === code.toLowerCase());
    if (p) onPick(p, 'scan');
    else onUnknownCode?.(code);
  };

  return (
    <div>
      <div className="search-row">
        <label className="search bordered">
          <Search size={18} />
          <input placeholder="Search product name or code" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <button className="scan-btn solid" onClick={() => setScan(true)} aria-label="Scan code">
          <ScanLine size={22} />
        </button>
      </div>

      <div className="card mt-12">
        <div className="list">
          {results.map((p) => (
            <button key={p.id} className="row" onClick={() => onPick(p, 'manual')}>
              <ProductIcon category={p.category} />
              <div className="grow">
                <div className="row-title">{p.name}</div>
                <div className="row-sub">{p.code} · {p.category}</div>
              </div>
              <div className="qty num">{forecasts[p.id]?.stock ?? 0} <span className="small muted" style={{ fontWeight: 500 }}>{p.unit}</span></div>
            </button>
          ))}
          {results.length === 0 && <div className="empty">No products found.</div>}
        </div>
      </div>
      <Link to={`/new-product${q ? `?name=${encodeURIComponent(q)}` : ''}`} className="btn block mt-12">
        <PackagePlus size={18} /> Not listed? Add new product
      </Link>

      {scan && <Scanner onResult={handleCode} onClose={() => setScan(false)} />}
    </div>
  );
}
