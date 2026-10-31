import { useState } from 'react';
import { CircleCheck, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui.jsx';
import ReorderModal from '../components/ReorderModal.jsx';
import { LowStockRow, useLowStock } from './Home.jsx';
import { useStore } from '../lib/store.jsx';

export default function Alerts() {
  const low = useLowStock();
  const { forecasts } = useStore();
  const [reorder, setReorder] = useState(null);
  const critical = low.filter((p) => forecasts[p.id].status === 'critical');
  const watch = low.filter((p) => forecasts[p.id].status === 'watch');

  return (
    <main className="main">
      <PageHeader title="Low Stock Alerts" sub="Sorted by what runs out first" />
      <div className="ai-banner" style={{ marginBottom: 16 }}>
        <Sparkles size={16} />
        <div>StockWise predicts days left from the last 14 days of usage, and alerts you before stock runs out — accounting for how long each supplier takes to deliver.</div>
      </div>
      {low.length === 0 && <div className="card empty"><CircleCheck size={26} /><div>All products are well stocked.</div></div>}
      {critical.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}><h2>Order now <span className="badge red">{critical.length}</span></h2></div>
          <div className="card list">{critical.map((p) => <LowStockRow key={p.id} product={p} onReorder={setReorder} />)}</div>
        </>
      )}
      {watch.length > 0 && (
        <>
          <div className="section-title"><h2>Running low soon <span className="badge amber">{watch.length}</span></h2></div>
          <div className="card list">{watch.map((p) => <LowStockRow key={p.id} product={p} onReorder={setReorder} />)}</div>
        </>
      )}
      {reorder && <ReorderModal product={reorder} onClose={() => setReorder(null)} />}
    </main>
  );
}
