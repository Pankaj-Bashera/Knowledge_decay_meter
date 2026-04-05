import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Skull, LayoutGrid, Database, Activity } from 'lucide-react';
import DashBoard from './pages/DashBoard';
import AllItems  from './pages/AllItems';
import Insights  from './pages/Insights';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-void)' }}>
          {/* Sidebar */}
          <nav style={{
            width: 260, 
            background: 'var(--color-graphite)', 
            borderRight: '3px solid var(--color-cream)',
            padding: '2rem 1.5rem', 
            flexShrink: 0,
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.5rem',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              marginBottom: 40,
              padding: '0.5rem',
              border: '3px solid var(--color-cream)',
              background: 'var(--color-lime)',
              color: 'var(--color-void)'
            }}>
              <Skull size={28} strokeWidth={3} />
              <span className="brutalist-header" style={{ fontSize: 20 }}>DECAY_METER</span>
            </div>

            <NavItem to="/" icon={<LayoutGrid size={20} strokeWidth={3} />} label="DASHBOARD" />
            <NavItem to="/items" icon={<Database size={20} strokeWidth={3} />} label="LOGGED ITEMS" />
            <NavItem to="/insights" icon={<Activity size={20} strokeWidth={3} />} label="SYSTEM INSIGHTS" />

            <div style={{ 
              marginTop: 'auto', 
              padding: '1rem', 
              fontSize: 12, 
              color: 'var(--color-cream)',
              border: '3px solid var(--color-cream)',
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '-0.05em'
            }}>
              <div style={{ borderBottom: '3px solid var(--color-cream)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                FORMULA_REF
              </div>
              <div>K₀ = 100*(0.4A+0.3I+0.3B)</div>
              <div>K(t) = M+(K₀-M)*e^(-kt)</div>
            </div>
          </nav>

          {/* Main content */}
          <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
              pointerEvents: 'none', 
              backgroundImage: 'radial-gradient(var(--color-graphite) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              opacity: 0.5,
              zIndex: 0
            }} />
            <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
              <Routes>
                <Route path="/"        element={<DashBoard />} />
                <Route path="/items"   element={<AllItems />} />
                <Route path="/insights" element={<Insights />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink to={to} end style={({ isActive }) => ({
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', 
      fontSize: 16, 
      fontWeight: 800,
      textDecoration: 'none', 
      textTransform: 'uppercase',
      color: isActive ? 'var(--color-void)' : 'var(--color-cream)', 
      background: isActive ? 'var(--color-lime)' : 'transparent',
      border: isActive ? '3px solid var(--color-cream)' : '3px solid transparent',
      transition: 'all 0.1s',
      letterSpacing: '-0.02em'
    })}>
      {icon} {label}
    </NavLink>
  );
}
