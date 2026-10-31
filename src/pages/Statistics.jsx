import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../lib/store.jsx';
import { DAY, startOfDay } from '../lib/inventory.js';
import { PageHeader, ProductIcon } from '../components/ui.jsx';

export default function Statistics() {
  const { products, movements, forecasts } = useStore();
  const [days, setDays] = useState(7);

  const { chart, top, slow, totals } = useMemo(() => {
    const now = Date.now();
    const from = startOfDay(now) - (days - 1) * DAY;
    const buckets = Array.from({ length: days }, (_, i) => {
      const t = from + i * DAY;
      return { t, label: new Date(t).toLocaleDateString('en-MY', days > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short' }), in: 0, out: 0 };
    });
    const usage = {};
    let inSum = 0, outSum = 0;
    movements.forEach((m) => {
      const t = new Date(m.at).getTime();
      if (t < from) return;
      const b = buckets[Math.floor((t - from) / DAY)];
      if (!b) return;
      if (m.type === 'in') { b.in += m.qty; inSum += m.qty; }
      if (m.type === 'out') { b.out += m.qty; outSum += m.qty; usage[m.productId] = (usage[m.productId] || 0) + m.qty; }
    });
    const ranked = products.map((p) => ({ p, used: usage[p.id] || 0 })).sort((a, b) => b.used - a.used);
    return {
      chart: buckets,
      top: ranked.slice(0, 5),
      slow: ranked.filter((r) => r.used === 0 && forecasts[r.p.id].stock > 0).slice(0, 5),
      totals: { in: inSum, out: outSum },
    };
  }, [movements, products, forecasts, days]);

  const lowCount = products.filter((p) => forecasts[p.id].status === 'critical').length;
  const units = products.reduce((s, p) => s + forecasts[p.id].stock, 0);
  const maxUsed = top[0]?.used || 1;

  return (
    <main className="main">
      <PageHeader
        title="Statistics" back={false}
        sub="How stock is moving"
        actions={
          <div className="seg">
            {[7, 14, 30].map((d) => <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{d}d</button>)}
          </div>
        }
      />
      <div className="kpis">
        <div className="card kpi"><div className="label">Units on hand</div><div className="value num">{units.toLocaleString()}</div></div>
        <div className="card kpi"><div className="label">Stock in ({days}d)</div><div className="value num" style={{ color: 'var(--green)' }}>{totals.in.toLocaleString()}</div></div>
        <div className="card kpi"><div className="label">Stock out ({days}d)</div><div className="value num" style={{ color: 'var(--blue)' }}>{totals.out.toLocaleString()}</div></div>
        <Link to="/alerts" className="card kpi"><div className="label">Need reorder</div><div className="value num" style={{ color: 'var(--red)' }}>{lowCount}</div></Link>
      </div>

      <div className="card mt-16">
        <div className="card-head"><div className="card-title">Stock in vs out (units per day)</div></div>
        <div className="chart-box mt-12">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} barGap={2} margin={{ left: -12 }}>
              <CartesianGrid vertical={false} stroke="#e8edf3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" interval={days > 14 ? 3 : 0} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 10, border: '1px solid #e3e8ef', fontSize: 13 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="in" name="Stock in" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              <Bar dataKey="out" name="Stock out" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col mt-16" style={{ gridTemplateColumns: undefined }}>
        <div className="card">
          <div className="card-head"><div className="card-title">Fastest moving</div></div>
          <div className="list mt-8">
            {top.map(({ p, used }) => (
              <Link key={p.id} to={`/product/${p.id}`} className="row">
                <ProductIcon category={p.category} size={32} />
                <div className="grow">
                  <div className="row-title">{p.name}</div>
                  <div style={{ height: 6, background: '#eef2f7', borderRadius: 4, marginTop: 6 }}>
                    <div style={{ width: `${(used / maxUsed) * 100}%`, height: '100%', background: '#2563eb', borderRadius: 4 }} />
                  </div>
                </div>
                <div className="qty num">{used}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Not moving ({days}d)</div><span className="small muted">Cash tied up</span></div>
          <div className="list mt-8">
            {slow.map(({ p }) => (
              <Link key={p.id} to={`/product/${p.id}`} className="row">
                <ProductIcon category={p.category} size={32} />
                <div className="grow"><div className="row-title">{p.name}</div><div className="row-sub">No stock out in {days} days</div></div>
                <div className="qty num">{forecasts[p.id].stock} <span className="small muted" style={{ fontWeight: 500 }}>{p.unit}</span></div>
              </Link>
            ))}
            {slow.length === 0 && <div className="empty">Every product moved in this period.</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
