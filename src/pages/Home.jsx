import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowUpFromLine, ChevronRight, FileScan, History, PackagePlus, ScanLine, Search,
  Sparkles, TriangleAlert, CircleCheck,
} from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { findMatches, formatDaysLeft, isToday } from '../lib/inventory.js';
import { ProductIcon } from '../components/ui.jsx';
import Scanner from '../components/Scanner.jsx';
import ReorderModal from '../components/ReorderModal.jsx';

export function useLowStock() {
  const { products, forecasts } = useStore();
  return useMemo(
    () =>
      products
        .filter((p) => forecasts[p.id]?.status === 'critical' || forecasts[p.id]?.status === 'watch')
        .sort((a, b) => {
          const fa = forecasts[a.id], fb = forecasts[b.id];
          if (fa.status !== fb.status) return fa.status === 'critical' ? -1 : 1;
          return fa.daysLeft - fb.daysLeft;
        }),
    [products, forecasts]
  );
}

export function LowStockRow({ product, onReorder }) {
  const { forecasts } = useStore();
  const f = forecasts[product.id];
  return (
    <div className="row alert-row">
      <ProductIcon category={product.category} />
      <Link to={`/product/${product.id}`} className="grow">
        <div className="row-title">{product.name}</div>
        <div className="alert-meta">
          <span><b className="num" style={{ color: 'var(--text)' }}>{f.stock}</b> {product.unit} left</span>
          <span>Alert at {product.alertLevel}</span>
          <span className={`days ${f.status}`}>{formatDaysLeft(f.daysLeft)}</span>
        </div>
      </Link>
      <button className="btn sm primary" onClick={() => onReorder(product)}>Reorder</button>
    </div>
  );
}

export default function Home() {
  const { user, business, products, movements } = useStore();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [scan, setScan] = useState(false);
  const [reorder, setReorder] = useState(null);
  const low = useLowStock();

  const today = useMemo(() => {
    const t = { in: 0, out: 0, new: 0 };
    movements.forEach((m) => { if (isToday(m.at) && t[m.type] != null) t[m.type] += 1; });
    return t;
  }, [movements]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const direct = products.filter((p) => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
    return (direct.length ? direct : findMatches(q, products, { min: 0.2 }).map((m) => m.product)).slice(0, 6);
  }, [q, products]);

  const onCode = (code) => {
    setScan(false);
    const p = products.find((x) => x.code.toLowerCase() === code.toLowerCase());
    nav(p ? `/product/${p.id}` : `/new-product?code=${encodeURIComponent(code)}`);
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <main className="main">
      <section className="hero">
        <div className="hero-top">
          <div>
            <div className="hero-title">StockWise</div>
            <div className="hero-sub">{greet}, {user?.name.split(' ')[0]} · {business.name}</div>
          </div>
          <Link to="/account" className="avatar" aria-label="Account">{user?.initials}</Link>
        </div>
        <div className="search-row" style={{ position: 'relative' }}>
          <div className="search-wrap">
            <label className="search">
              <Search size={18} />
              <input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          </div>
          <button className="scan-btn" onClick={() => setScan(true)} aria-label="Scan QR code">
            <ScanLine size={22} />
          </button>
          {results.length > 0 && (
            <div className="search-results" style={{ left: 0, right: 0 }}>
              {results.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="row">
                  <ProductIcon category={p.category} size={32} />
                  <div className="grow">
                    <div className="row-title">{p.name}</div>
                    <div className="row-sub">{p.code}</div>
                  </div>
                  <ChevronRight size={18} className="muted" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="card lift">
        <div className="card-head">
          <div className="card-title">Today's Activity</div>
          <span className="small muted">{dateStr}</span>
        </div>
        <div className="today">
          <button className="today-stat" onClick={() => nav('/history?type=in&range=today')}>
            <span className="today-num num" style={{ color: 'var(--green)' }}>{today.in}</span>
            <span className="today-label"><ArrowDownToLine size={14} /> Stock In</span>
          </button>
          <button className="today-stat" onClick={() => nav('/history?type=out&range=today')}>
            <span className="today-num num" style={{ color: 'var(--blue)' }}>{today.out}</span>
            <span className="today-label"><ArrowUpFromLine size={14} /> Stock Out</span>
          </button>
          <button className="today-stat" onClick={() => nav('/history?type=new&range=today')}>
            <span className="today-num num" style={{ color: 'var(--violet)' }}>{today.new}</span>
            <span className="today-label"><PackagePlus size={14} /> New Items</span>
          </button>
        </div>
      </section>

      <section className="grid-actions">
        <Link to="/stock-out" className="action tone-blue">
          <span className="action-icon"><ArrowUpFromLine size={22} /></span>
          <div><div className="action-title">Stock Out</div><div className="action-sub">Scan or enter manually</div></div>
        </Link>
        <Link to="/stock-in" className="action tone-green">
          <span className="action-icon"><ArrowDownToLine size={22} /></span>
          <div><div className="action-title">Stock In</div><div className="action-sub">Scan or enter manually</div></div>
        </Link>
        <Link to="/new-product" className="action tone-violet">
          <span className="action-icon"><PackagePlus size={22} /></span>
          <div><div className="action-title">New Product</div><div className="action-sub">Register a new item</div></div>
        </Link>
        <Link to="/history" className="action tone-amber">
          <span className="action-icon"><History size={22} /></span>
          <div><div className="action-title">History</div><div className="action-sub">Who did what, and when</div></div>
        </Link>
      </section>

      <Link to="/snap" className="card card-pad flex center gap-12 mt-12" style={{ borderColor: '#c7d2fe', background: 'linear-gradient(90deg,#f5f7ff,#faf8ff)' }}>
        <span className="chip-icon" style={{ background: '#e0e7ff', color: '#4338ca', width: 44, height: 44 }}><FileScan size={22} /></span>
        <div className="grow" style={{ flex: 1 }}>
          <div className="flex center gap-8"><b>Snap Delivery Note</b><span className="badge ai"><Sparkles size={11} /> AI</span></div>
          <div className="small muted">Photograph a supplier invoice — AI adds every item in one go.</div>
        </div>
        <ChevronRight size={20} className="muted" />
      </Link>

      <div className="section-title">
        <h2><TriangleAlert size={18} color="var(--red-600)" /> Low Stock Alerts {low.length > 0 && <span className="badge red">{low.length}</span>}</h2>
        <Link to="/alerts" className="link">See all <ChevronRight size={16} /></Link>
      </div>
      <div className="card">
        {low.length === 0 ? (
          <div className="empty"><CircleCheck size={26} /><div>All products are well stocked.</div></div>
        ) : (
          <div className="list">
            {low.slice(0, 5).map((p) => <LowStockRow key={p.id} product={p} onReorder={setReorder} />)}
          </div>
        )}
      </div>

      {scan && <Scanner onResult={onCode} onClose={() => setScan(false)} />}
      {reorder && <ReorderModal product={reorder} onClose={() => setReorder(null)} />}
    </main>
  );
}
