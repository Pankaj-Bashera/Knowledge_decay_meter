import { motion } from 'framer-motion';
import { Skull, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { useDecayingItems, useInsightSummary, useItems } from '../api/queries';
import RetentionCard from '../components/RetentionCard';
import ItemCreateForm from '../components/ItemCreateForm';
import SettingsPanel from '../components/SettingsPanel';

export default function DashBoard() {
  const { data: allItems   = [], isLoading: loadingAll } = useItems();
  const { data: decaying   = [], isLoading: loadingDecay } = useDecayingItems(60);
  const { data: summary } = useInsightSummary();

  return (
    <div style={{ padding: '3rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <h1 className="brutalist-header" style={{ fontSize: 48, color: 'var(--color-cream)' }}>
            SYSTEM OVERVIEW
          </h1>
          <p style={{ color: 'var(--color-lime)', marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            STATUS: ACTIVE /// TRACKING {allItems.length} LOGS
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <SettingsPanel />
          <ItemCreateForm />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: '3rem' }}>
          <SummaryCard icon={<Skull size={24} />}         label="TOTAL ASSETS"       value={summary.total_items}              color="var(--color-cream)" />
          <SummaryCard icon={<TrendingDown size={24} />}  label="SYS RETENTION"      value={`${summary.avg_retention}%`}      color="var(--color-lime)" />
          <SummaryCard icon={<Clock size={24} />}         label="AVG HALF-LIFE"      value={`${summary.avg_half_life}d`}      color="var(--color-violet)" />
          <SummaryCard icon={<AlertTriangle size={24} />} label="PENDING (.60)" value={summary.items_below_60}           color="var(--color-lime)" inverted={true} />
          <SummaryCard icon={<AlertTriangle size={24} />} label="CRITICAL (.40)"    value={summary.items_below_40}           color="#FF3333" inverted={true} />
        </div>
      )}

      {/* Decaying items */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <h2 className="brutalist-header" style={{ fontSize: 32, color: 'var(--color-cream)' }}>
            ACTION REQUIRED
          </h2>
          {decaying.length > 0 && (
            <div style={{ background: 'var(--color-lime)', color: 'var(--color-void)', border: '3px solid var(--color-cream)', padding: '4px 12px', fontWeight: 900, fontSize: 20 }}>
              {decaying.length}
            </div>
          )}
        </div>

        {loadingDecay ? (
           <div style={{ color: 'var(--color-lime)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', animation: 'pulse 1s infinite' }}>LOADING DATA...</div>
        ) : decaying.length === 0 ? (
          <EmptyState message="0 CRITICAL ERRORS DETECTED" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {[...decaying]
              .sort((a, b) => a.current_retention - b.current_retention)
              .map((item, i) => <RetentionCard key={item.id} item={item} index={i} />)
            }
          </div>
        )}
      </div>

      {/* All items section */}
      {!loadingAll && allItems.length > 0 && (
        <div>
          <h2 className="brutalist-header" style={{ fontSize: 32, marginBottom: 24, color: 'var(--color-cream)' }}>
            DATABASE ({allItems.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {[...allItems]
              .sort((a, b) => a.current_retention - b.current_retention)
              .map((item, i) => <RetentionCard key={item.id} item={item} index={i} />)
            }
          </div>
        </div>
      )}

      {!loadingAll && allItems.length === 0 && (
        <EmptyState message="NO LOGS DETECTED. INITIALIZE NEW DATA." />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, inverted = false }: { icon: React.ReactNode; label: string; value: string | number; color: string, inverted?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutalist-card"
      style={{
        background: inverted ? color : 'var(--color-graphite)',
        color: inverted ? 'var(--color-void)' : color,
      }}
    >
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.05em', color: inverted ? 'var(--color-void)' : 'var(--color-cream)' }}>{label}</div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '4rem', background: 'var(--color-graphite)',
      border: '3px solid var(--color-cream)',
      color: 'var(--color-lime)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase'
    }}>
      {message}
    </div>
  );
}
