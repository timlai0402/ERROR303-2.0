import { ChevronRight } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { BrandMark } from '../components/Layout.jsx';

export default function Login() {
  const { users, login, business } = useStore();
  return (
    <div className="login">
      <div className="card login-card">
        <div className="flex center gap-12" style={{ marginBottom: 6 }}>
          <BrandMark size={42} />
          <div>
            <h1 style={{ fontSize: 22 }}>StockWise</h1>
            <div className="small muted">Smart inventory for small businesses</div>
          </div>
        </div>
        <p className="muted small mt-16" style={{ marginBottom: 14 }}>Sign in to <b style={{ color: 'var(--text)' }}>{business.name}</b> — choose a demo account:</p>
        {users.map((u) => (
          <button key={u.id} className="login-user" onClick={() => login(u.id)}>
            <span className="avatar light">{u.initials}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div className="small muted">{u.role}{u.role === 'Owner' ? ' · full access, reorders' : ' · stock in & out'}</div>
            </div>
            <ChevronRight size={18} className="muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
