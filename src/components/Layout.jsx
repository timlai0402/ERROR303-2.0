import { NavLink, Outlet } from 'react-router-dom';
import {
  House, Boxes, ChartColumn, CircleUser, ArrowDownToLine, ArrowUpFromLine, PackagePlus, History, FileScan, Package,
} from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { Toasts } from './ui.jsx';

const TABS = [
  { to: '/', label: 'Home', Icon: House, end: true },
  { to: '/inventory', label: 'Inventory', Icon: Boxes },
  { to: '/statistics', label: 'Statistics', Icon: ChartColumn },
  { to: '/account', label: 'Account', Icon: CircleUser },
];

const QUICK = [
  { to: '/stock-in', label: 'Stock In', Icon: ArrowDownToLine },
  { to: '/stock-out', label: 'Stock Out', Icon: ArrowUpFromLine },
  { to: '/snap', label: 'Snap Delivery Note', Icon: FileScan },
  { to: '/new-product', label: 'New Product', Icon: PackagePlus },
  { to: '/history', label: 'History', Icon: History },
];

export function BrandMark({ size = 34 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <Package size={size * 0.55} strokeWidth={2.2} />
    </span>
  );
}

export default function Layout() {
  const { user, business } = useStore();
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div>
            <div className="brand-name">StockWise</div>
            <div className="brand-sub">{business.name}</div>
          </div>
        </div>
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
        <div className="side-section">Quick actions</div>
        {QUICK.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
        <div className="side-foot">
          <div className="flex center gap-12" style={{ padding: '4px 8px' }}>
            <span className="avatar light">{user?.initials}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div className="small muted">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-body">
        <Outlet />
      </div>

      <nav className="tabbar" aria-label="Main">
        {TABS.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>
            <Icon size={21} /> {label}
          </NavLink>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}
