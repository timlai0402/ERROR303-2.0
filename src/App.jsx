import { HashRouter, Route, Routes } from 'react-router-dom';
import { useStore } from './lib/store.jsx';
import Layout from './components/Layout.jsx';
import { Toasts } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import StockIn from './pages/StockIn.jsx';
import StockOut from './pages/StockOut.jsx';
import NewProduct from './pages/NewProduct.jsx';
import History from './pages/History.jsx';
import Inventory from './pages/Inventory.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Statistics from './pages/Statistics.jsx';
import Account from './pages/Account.jsx';
import Alerts from './pages/Alerts.jsx';
import SnapNote from './pages/SnapNote.jsx';

export default function App() {
  const { user, dbStatus, dbError } = useStore();
  if (dbStatus === 'loading') {
    return <div className="login"><div className="card login-card" style={{ textAlign: 'center' }}><b>Connecting to database…</b><div className="small muted mt-8">Loading your stock from Supabase</div></div></div>;
  }
  if (dbStatus === 'error') {
    return (
      <div className="login"><div className="card login-card">
        <h1 style={{ fontSize: 19 }}>Can't reach the database</h1>
        <p className="small muted mt-8">{dbError}</p>
        <p className="small mt-12">Check that <b>supabase/schema.sql</b> has been run in your Supabase project, and that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env are correct. Then restart <code>npm run dev</code>.</p>
        <button className="btn primary block mt-16" onClick={() => location.reload()}>Try again</button>
      </div></div>
    );
  }
  if (!user) return <><Login /><Toasts /></>;
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="stock-in" element={<StockIn />} />
          <Route path="stock-out" element={<StockOut />} />
          <Route path="new-product" element={<NewProduct />} />
          <Route path="snap" element={<SnapNote />} />
          <Route path="history" element={<History />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="account" element={<Account />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
