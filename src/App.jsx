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
  const { user } = useStore();
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
