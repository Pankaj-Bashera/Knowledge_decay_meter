import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Brain, LayoutDashboard, BookOpen, BarChart2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AllItems  from './pages/AllItems';
import Insights  from './pages/Insights';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

const NAV_STYLE: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  textDecoration: 'none', color: '#94a3b8', transition: 'all 0.15s',
};

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        {/* Sidebar */}
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <nav style={{
            width: 220, background: '#0f172a', borderRight: '1px solid #1e293b',
            padding: '1.5rem 1rem', flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '0 8px' }}>
              <Brain size={22} color="#3b82f6" />
              <span style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9' }}>Decay Tracker</span>
            </div>

            <NavLink to="/" end style={({ isActive }) => ({
              ...NAV_STYLE, background: isActive ? '#1e293b' : 'transparent',
              color: isActive ? '#e2e8f0' : '#94a3b8',
            })}>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>

            <NavLink to="/items" style={({ isActive }) => ({
              ...NAV_STYLE, background: isActive ? '#1e293b' : 'transparent',
              color: isActive ? '#e2e8f0' : '#94a3b8',
            })}>
              <BookOpen size={16} /> All Items
            </NavLink>

            <NavLink to="/insights" style={({ isActive }) => ({
              ...NAV_STYLE, background: isActive ? '#1e293b' : 'transparent',
              color: isActive ? '#e2e8f0' : '#94a3b8',
            })}>
              <BarChart2 size={16} /> Insights
            </NavLink>

            <div style={{ marginTop: 'auto', padding: '0 8px', fontSize: 11, color: '#334155', lineHeight: 1.6 }}>
              <div>K₀ = 100×(0.4A + 0.3I + 0.3B)</div>
              <div>K(t) = M + (K₀-M)×e^(-kt)</div>
            </div>
          </nav>

          {/* Main content */}
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <Routes>
              <Route path="/"        element={<Dashboard />} />
              <Route path="/items"   element={<AllItems />} />
              <Route path="/insights" element={<Insights />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
