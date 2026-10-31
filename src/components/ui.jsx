import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine, ArrowUpFromLine, Check, ChevronLeft, PackagePlus, Send, X, AlertCircle,
  Package, Shield, FileText, SprayCan, Box, Coffee, Zap, ShoppingBag,
} from 'lucide-react';
import { useStore } from '../lib/store.jsx';

export function PageHeader({ title, sub, back = true, actions }) {
  const nav = useNavigate();
  return (
    <div className="page-head">
      {back && (
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="grow">
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions}
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span className="ic">{t.tone === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

const CATEGORY_ICON = {
  Safety: Shield, Stationery: FileText, Cleaning: SprayCan, Packaging: Box,
  Pantry: Coffee, Electrical: Zap, Retail: ShoppingBag,
};
export const CATEGORIES = ['Stationery', 'Packaging', 'Cleaning', 'Safety', 'Pantry', 'Electrical', 'Retail', 'General'];
export const UNITS = ['pcs', 'box', 'pack', 'roll', 'ream', 'bottle', 'carton', 'kg', 'set'];

export function ProductIcon({ category, size = 36 }) {
  const Icon = CATEGORY_ICON[category] || Package;
  return (
    <span className="chip-icon" style={{ width: size, height: size, background: '#f1f5f9', color: '#475569' }}>
      <Icon size={size * 0.48} />
    </span>
  );
}

export const MOVE_META = {
  in: { label: 'Stock In', tone: 'green', Icon: ArrowDownToLine, badge: 'green' },
  out: { label: 'Stock Out', tone: 'blue', Icon: ArrowUpFromLine, badge: 'blue' },
  new: { label: 'New Product', tone: 'violet', Icon: PackagePlus, badge: 'violet' },
  reorder: { label: 'Reorder Sent', tone: 'amber', Icon: Send, badge: 'amber' },
};

export function StatusBadge({ status }) {
  if (status === 'critical') return <span className="badge red">Low stock</span>;
  if (status === 'watch') return <span className="badge amber">Running low</span>;
  return <span className="badge green">In stock</span>;
}

export function QtyStepper({ value, onChange, min = 1, max }) {
  const set = (v) => {
    let n = Number.isNaN(Number(v)) ? min : Number(v);
    if (max != null) n = Math.min(n, max);
    onChange(Math.max(min, Math.floor(n)));
  };
  return (
    <div className="stepper">
      <button type="button" onClick={() => set(value - 1)} aria-label="Decrease">−</button>
      <input inputMode="numeric" value={value} onChange={(e) => set(e.target.value.replace(/\D/g, '') || min)} aria-label="Quantity" />
      <button type="button" onClick={() => set(value + 1)} aria-label="Increase">+</button>
    </div>
  );
}
