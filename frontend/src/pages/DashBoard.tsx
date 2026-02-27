import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Clock, TrendingDown } from 'lucide-react';
import { useDecayingItems, useInsightSummary, useItems } from '../api/queries';
import RetentionCard from '../components/RetentionCard';
import ItemCreateForm from '../components/ItemCreateForm';
import SettingsPanel from '../components/SettingsPanel';

export default function DashBoard() {
  const { data: allItems   = [], isLoading: loadingAll } = useItems();
  const { data: decaying   = [], isLoading: loadingDecay } = useDecayingItems(60);
  const { data: summary } = useInsightSummary();

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#454545' }}>
            🧠 Knowledge Decay Tracker
          </h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            Custom decay model — attention, interest, sleep & usage
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SettingsPanel />
          <ItemCreateForm />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: '2rem' }}>
          <SummaryCard icon={<Brain size={18} />}         label="Total Items"        value={summary.total_items}              color="#3b82f6" />
          <SummaryCard icon={<TrendingDown size={18} />}  label="Avg Retention"      value={`${summary.avg_retention}%`}      color="#22c55e" />
          <SummaryCard icon={<Clock size={18} />}         label="Avg Half-life"      value={`${summary.avg_half_life}d`}      color="#8b5cf6" />
          <SummaryCard icon={<AlertTriangle size={18} />} label="Need Review (<60%)" value={summary.items_below_60}           color="#f97316" />
          <SummaryCard icon={<AlertTriangle size={18} />} label="Critical (<40%)"    value={summary.items_below_40}           color="#ef4444" />
        </div>
      )}

      {/* Decaying items */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          ⚠️ Needs Review
          {decaying.length > 0 && (
            <span style={{ marginLeft: 10, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '2px 10px', fontSize: 12 }}>
              {decaying.length}
            </span>
          )}
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          Items with retention below 60% — sorted by urgency
        </p>

        {loadingDecay ? (
          <LoadingGrid />
        ) : decaying.length === 0 ? (
          <EmptyState message="All items above 60% retention — great job! 🎉" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {[...decaying]
              .sort((a, b) => a.current_retention - b.current_retention)
              .map((item, i) => <RetentionCard key={item.id} item={item} index={i} />)
            }
          </div>
        )}
      </div>

      {/* All items section (collapsed view) */}
      {!loadingAll && allItems.length > 0 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            📚 All Items ({allItems.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {[...allItems]
              .sort((a, b) => a.current_retention - b.current_retention)
              .map((item, i) => <RetentionCard key={item.id} item={item} index={i} />)
            }
          </div>
        </div>
      )}

      {!loadingAll && allItems.length === 0 && (
        <EmptyState message="No knowledge items yet. Add your first item to start tracking!" />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#1e293b', borderRadius: 12, padding: '1rem',
        border: `1px solid ${color}33`,
      }}
    >
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '3rem', background: '#1e293b',
      borderRadius: 12, border: '1px dashed #334155', color: '#64748b',
    }}>
      {message}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 200, background: '#1e293b', borderRadius: 12, animation: 'pulse 2s infinite' }} />
      ))}
    </div>
  );
}
