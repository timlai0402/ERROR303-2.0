import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { History as HistoryIcon, Search } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { DAY, fmtDate, fmtDateTime, fmtTime, isToday, startOfDay } from '../lib/inventory.js';
import { MOVE_META, PageHeader } from '../components/ui.jsx';

const SOURCE_LABEL = { scan: 'Scanned', manual: 'Manual', 'delivery-note': 'AI delivery note', whatsapp: 'WhatsApp', email: 'Email' };

export function MovementRow({ m, showProduct = true }) {
  const { productById, users } = useStore();
  const p = productById(m.productId);
  const staff = users.find((u) => u.id === m.staff);
  const meta = MOVE_META[m.type] || MOVE_META.in;
  const batchInfo =
    m.type === 'in' ? `Batch #${m.batchNo}` :
    m.type === 'out' && m.allocations ? `From ${m.allocations.map((a) => `#${a.batchNo}`).join(', ')}` : null;
  return (
    <div className="row">
      <span className={`chip-icon tone-${meta.tone}`}><meta.Icon size={17} /></span>
      <div className="grow">
        <div className="row-title">
          {showProduct ? <Link to={`/product/${m.productId}`}>{p?.name || 'Deleted product'}</Link> : meta.label}
        </div>
        <div className="row-sub">
          {showProduct ? fmtTime(m.at) : fmtDateTime(m.at)} · {staff?.name || 'Unknown'}
          {batchInfo && <> · {batchInfo}</>}
          {m.source && <> · {SOURCE_LABEL[m.source] || m.source}</>}
          {m.note && <> · “{m.note}”</>}
        </div>
      </div>
      {m.type === 'in' && <div className="qty in num">+{m.qty}</div>}
      {m.type === 'out' && <div className="qty out num">−{m.qty}</div>}
      {m.type === 'new' && <span className="badge violet">New</span>}
      {m.type === 'reorder' && <span className="badge amber">Reorder {m.qty}</span>}
    </div>
  );
}

export default function History() {
  const { movements, users, productById } = useStore();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || 'all';
  const range = params.get('range') || '7d';
  const date = params.get('date') || '';
  const staff = params.get('staff') || '';
  const [q, setQ] = useState('');

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const s = q.trim().toLowerCase();
    return movements
      .filter((m) => type === 'all' || m.type === type)
      .filter((m) => {
        const t = new Date(m.at).getTime();
        if (date) { const d0 = new Date(date + 'T00:00:00').getTime(); return t >= d0 && t < d0 + DAY; }
        if (range === 'today') return isToday(m.at);
        if (range === '7d') return t >= startOfDay(now) - 6 * DAY;
        if (range === '30d') return t >= startOfDay(now) - 29 * DAY;
        return true;
      })
      .filter((m) => !staff || m.staff === staff)
      .filter((m) => !s || (productById(m.productId)?.name || '').toLowerCase().includes(s))
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [movements, type, range, date, staff, q, productById]);

  const groups = useMemo(() => {
    const g = [];
    filtered.forEach((m) => {
      const key = fmtDate(m.at);
      const last = g[g.length - 1];
      if (last && last.key === key) last.items.push(m);
      else g.push({ key, label: isToday(m.at) ? `Today · ${key}` : key, items: [m] });
    });
    return g;
  }, [filtered]);

  const totals = filtered.reduce((t, m) => { if (m.type === 'in') t.in += m.qty; if (m.type === 'out') t.out += m.qty; return t; }, { in: 0, out: 0 });

  return (
    <main className="main">
      <PageHeader title="History" sub="Every record, with staff, date and time" />

      <div className="filters">
        <div className="seg">
          {[['all', 'All'], ['in', 'Stock In'], ['out', 'Stock Out'], ['new', 'New'], ['reorder', 'Reorders']].map(([v, l]) => (
            <button key={v} className={type === v ? 'on' : ''} onClick={() => update({ type: v === 'all' ? '' : v })}>{l}</button>
          ))}
        </div>
      </div>
      <div className="filters">
        <div className="seg">
          {[['today', 'Today'], ['7d', '7 days'], ['30d', '30 days'], ['all', 'All time']].map(([v, l]) => (
            <button key={v} className={!date && range === v ? 'on' : ''} onClick={() => update({ range: v, date: '' })}>{l}</button>
          ))}
        </div>
        <input type="date" className="select" value={date} onChange={(e) => update({ date: e.target.value })} aria-label="Pick a date" />
        <select className="select" value={staff} onChange={(e) => update({ staff: e.target.value })} aria-label="Staff">
          <option value="">All staff</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <label className="search bordered" style={{ marginBottom: 14 }}>
        <Search size={18} />
        <input placeholder="Filter by product" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <div className="flex gap-12 small muted" style={{ marginBottom: 10 }}>
        <span>{filtered.length} records</span>
        <span style={{ color: 'var(--green)' }}>+{totals.in} in</span>
        <span style={{ color: 'var(--blue)' }}>−{totals.out} out</span>
      </div>

      {groups.length === 0 && <div className="card empty"><HistoryIcon size={26} /><div>No records for this filter.</div></div>}
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 16 }}>
          <div className="small" style={{ fontWeight: 600, color: 'var(--muted)', margin: '0 4px 8px' }}>{g.label}</div>
          <div className="card list">
            {g.items.map((m) => <MovementRow key={m.id} m={m} />)}
          </div>
        </div>
      ))}
    </main>
  );
}
