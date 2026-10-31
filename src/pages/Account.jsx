import { useEffect, useState } from 'react';
import { Building2, LogOut, Pencil, Plus, RotateCcw, Sparkles, Truck } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { Modal, PageHeader } from '../components/ui.jsx';

function SupplierModal({ supplier, onClose }) {
  const { upsertSupplier, toast } = useStore();
  const [f, setF] = useState(supplier || { name: '', contact: '', phone: '', email: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const save = () => {
    if (!f.name.trim()) return toast('Supplier name is required', 'error');
    upsertSupplier({ ...f, phone: (f.phone || '').replace(/\D/g, '') });
    toast(supplier ? 'Supplier updated' : 'Supplier added');
    onClose();
  };
  return (
    <Modal title={supplier ? 'Edit supplier' : 'Add supplier'} onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" onClick={save}>Save</button></>}>
      <div className="field"><label>Company name</label><input className="input" value={f.name} onChange={set('name')} /></div>
      <div className="field"><label>Contact person</label><input className="input" value={f.contact} onChange={set('contact')} /></div>
      <div className="form-grid stack-sm">
        <div className="field"><label>WhatsApp number</label><input className="input" placeholder="60123456789" value={f.phone} onChange={set('phone')} /></div>
        <div className="field"><label>Email</label><input className="input" type="email" value={f.email} onChange={set('email')} /></div>
      </div>
    </Modal>
  );
}

export default function Account() {
  const { user, users, login, logout, business, setBusiness, suppliers, resetDemo, toast } = useStore();
  const [sup, setSup] = useState(null);
  const [ai, setAi] = useState(null);

  useEffect(() => {
    fetch('api/health').then((r) => r.json()).then(setAi).catch(() => setAi({ ok: false }));
  }, []);

  return (
    <main className="main">
      <PageHeader title="Account" back={false} />
      <div className="two-col">
        <div>
          <div className="card card-pad flex center gap-12">
            <span className="avatar light" style={{ width: 52, height: 52, fontSize: 17 }}>{user.initials}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{user.name}</div>
              <div className="small muted">{user.role} · {business.name}</div>
            </div>
            <button className="btn sm" onClick={logout}><LogOut size={15} /> Log out</button>
          </div>

          <div className="section-title"><h2>Switch staff</h2></div>
          <div className="card list">
            {users.map((u) => (
              <button key={u.id} className="row" onClick={() => { login(u.id); toast(`Signed in as ${u.name}`); }}>
                <span className="avatar light">{u.initials}</span>
                <div className="grow"><div className="row-title">{u.name}</div><div className="row-sub">{u.role}</div></div>
                {u.id === user.id && <span className="badge blue">Current</span>}
              </button>
            ))}
          </div>

          <div className="section-title"><h2><Building2 size={18} /> Business</h2></div>
          <div className="card card-pad">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Business name (used in reorder messages)</label>
              <input className="input" value={business.name} onChange={(e) => setBusiness({ name: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <div className="section-title" style={{ marginTop: 0 }}>
            <h2><Truck size={18} /> Suppliers</h2>
            <button className="link" onClick={() => setSup('new')}><Plus size={16} /> Add</button>
          </div>
          <div className="card list">
            {suppliers.map((s) => (
              <button key={s.id} className="row" onClick={() => setSup(s)}>
                <div className="grow">
                  <div className="row-title">{s.name}</div>
                  <div className="row-sub">{s.contact}{s.phone ? ` · +${s.phone}` : ''}</div>
                </div>
                <Pencil size={16} className="muted" />
              </button>
            ))}
          </div>

          <div className="section-title"><h2><Sparkles size={18} /> AI status</h2></div>
          <div className="card card-pad small">
            {ai == null ? 'Checking…' : ai.ok && ai.ai ? (
              <><span className="badge green">Live AI</span> <span className="muted">Delivery notes are read by {ai.model}.</span></>
            ) : (
              <><span className="badge amber">Demo mode</span> <span className="muted">Using built-in sample delivery notes. Add AI_API_KEY to the server's .env to read real photos.</span></>
            )}
          </div>

          <button className="btn danger block mt-16" onClick={() => { if (confirm('Reset all data back to the demo sample?')) { resetDemo(); toast('Demo data restored'); } }}>
            <RotateCcw size={16} /> Reset demo data
          </button>
        </div>
      </div>
      {sup && <SupplierModal supplier={sup === 'new' ? null : sup} onClose={() => setSup(null)} />}
    </main>
  );
}
