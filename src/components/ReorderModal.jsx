import { useMemo, useState } from 'react';
import { Mail, MessageCircle, Sparkles } from 'lucide-react';
import { Modal } from './ui.jsx';
import { useStore } from '../lib/store.jsx';
import { formatDaysLeft } from '../lib/inventory.js';

/** AI-drafted reorder message. Owner reviews and sends via WhatsApp or email. */
export default function ReorderModal({ product, onClose }) {
  const { suppliers, forecasts, business, user, logReorder, toast } = useStore();
  const f = forecasts[product.id];
  const supplier = suppliers.find((s) => s.id === product.supplierId);
  const [qty, setQty] = useState(f.suggested);

  const draft = useMemo(() => {
    const greet = supplier?.contact ? `Hi ${supplier.contact},` : 'Hi,';
    return `${greet}

This is ${user?.name || 'the team'} from ${business.name}. We would like to place a reorder:

• ${product.name} — ${qty} ${product.unit}${qty === 1 ? '' : 's'}

Please confirm availability, price and the earliest delivery date. Thank you!`;
  }, [supplier, user, business.name, product, qty]);

  const [text, setText] = useState(null);
  const message = text ?? draft;

  const send = (channel) => {
    let url;
    if (channel === 'whatsapp') {
      url = `https://wa.me/${(supplier?.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    } else {
      url = `mailto:${supplier?.email || ''}?subject=${encodeURIComponent(`Reorder: ${product.name}`)}&body=${encodeURIComponent(message)}`;
    }
    window.open(url, '_blank', 'noopener');
    logReorder({ productId: product.id, qty, channel });
    toast(`Reorder for ${product.name} opened in ${channel === 'whatsapp' ? 'WhatsApp' : 'email'}`);
    onClose();
  };

  return (
    <Modal
      title="Reorder"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => send('email')} disabled={!supplier?.email}><Mail size={17} /> Email</button>
          <button className="btn whatsapp" onClick={() => send('whatsapp')} disabled={!supplier?.phone}><MessageCircle size={17} /> WhatsApp</button>
        </>
      }
    >
      <div className="ai-banner">
        <Sparkles size={16} />
        <div>
          <b>{formatDaysLeft(f.daysLeft)}</b> at ~{f.avg.toFixed(1)} {product.unit}/day. Delivery takes {product.leadTimeDays} days, so we suggest ordering <b>{f.suggested}</b> to cover the next 2 weeks.
        </div>
      </div>

      <div className="form-grid mt-16">
        <div className="field">
          <label>Supplier</label>
          <div className="input" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {supplier ? supplier.name : <span className="muted">No supplier saved</span>}
          </div>
        </div>
        <div className="field">
          <label>Quantity ({product.unit})</label>
          <input className="input num" inputMode="numeric" value={qty}
            onChange={(e) => { setQty(Number(e.target.value.replace(/\D/g, '')) || 0); setText(null); }} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Message (edit before sending)</label>
        <textarea className="textarea" rows={9} value={message} onChange={(e) => setText(e.target.value)} />
        {!supplier && <div className="hint">Add a supplier to this product to enable sending.</div>}
      </div>
    </Modal>
  );
}
