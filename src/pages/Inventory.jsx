import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PackagePlus, Search } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { formatDaysLeft } from '../lib/inventory.js';
import { CATEGORIES, PageHeader, ProductIcon, StatusBadge } from '../components/ui.jsx';

export default function Inventory() {
  const { products, forecasts, batches } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter((p) => !s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s))
      .filter((p) => !cat || p.category === cat)
      .filter((p) => !status || (status === 'low' ? forecasts[p.id].status !== 'ok' : forecasts[p.id].status === 'ok'))
      .sort((a, b) => {
        if (sort === 'stock') return forecasts[a.id].stock - forecasts[b.id].stock;
        if (sort === 'days') return forecasts[a.id].daysLeft - forecasts[b.id].daysLeft;
        return a.name.localeCompare(b.name);
      });
  }, [products, forecasts, q, cat, status, sort]);

  const totalUnits = products.reduce((s, p) => s + forecasts[p.id].stock, 0);

  return (
    <main className="main">
      <PageHeader
        title="Inventory"
        sub={`${products.length} products · ${totalUnits.toLocaleString()} units on hand`}
        back={false}
        actions={<Link to="/new-product" className="btn primary sm"><PackagePlus size={16} /> <span className="hide-sm">New product</span><span className="hide-lg">New</span></Link>}
      />
      <label className="search bordered" style={{ marginBottom: 12 }}>
        <Search size={18} />
        <input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="filters">
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All status</option>
          <option value="low">Low / running low</option>
          <option value="ok">In stock</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="name">Sort: Name</option>
          <option value="stock">Sort: Lowest stock</option>
          <option value="days">Sort: Runs out soonest</option>
        </select>
      </div>

      <div className="card list">
        {list.map((p) => {
          const f = forecasts[p.id];
          const open = batches.filter((b) => b.productId === p.id && b.qtyRemaining > 0).length;
          return (
            <Link key={p.id} to={`/product/${p.id}`} className="row">
              <ProductIcon category={p.category} />
              <div className="grow">
                <div className="row-title">{p.name}</div>
                <div className="row-sub">
                  {p.code} · {open} batch{open === 1 ? '' : 'es'} · <span className={`days ${f.status}`}>{formatDaysLeft(f.daysLeft)}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="qty num">{f.stock} <span className="small muted" style={{ fontWeight: 500 }}>{p.unit}</span></div>
                <div className="mt-8 hide-sm"><StatusBadge status={f.status} /></div>
              </div>
              <ChevronRight size={18} className="muted" />
            </Link>
          );
        })}
        {list.length === 0 && <div className="empty">No products match.</div>}
      </div>
    </main>
  );
}
