import { motion } from 'framer-motion';
import { Brain, Clock, Zap, Trash2 } from 'lucide-react';
import { KnowledgeItem, useDeleteItem, useSubmitReview } from '../api/queries';

interface Props {
  item: KnowledgeItem;
  index?: number;
}

function retentionColor(r: number): string {
  if (r >= 70) return '#22c55e';
  if (r >= 50) return '#eab308';
  if (r >= 30) return '#f97316';
  return '#ef4444';
}

function retentionBg(r: number): string {
  if (r >= 70) return 'rgba(34,197,94,0.08)';
  if (r >= 50) return 'rgba(234,179,8,0.08)';
  if (r >= 30) return 'rgba(249,115,22,0.08)';
  return 'rgba(239,68,68,0.10)';
}

export default function RetentionCard({ item, index = 0 }: Props) {
  const deleteItem   = useDeleteItem();
  const submitReview = useSubmitReview();
  const color = retentionColor(item.current_retention);

  const handleReview = (usedInPractice: boolean) => {
    submitReview.mutate({ id: item.id, used_in_practice: usedInPractice });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: retentionBg(item.current_retention),
        border: `1px solid ${color}33`,
        borderRadius: 12,
        padding: '1.25rem',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
            {item.topic}
          </h3>
          {item.content && (
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
              {item.content.slice(0, 80)}{item.content.length > 80 ? '…' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => deleteItem.mutate(item.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Retention bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Retention</span>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>
            {item.current_retention.toFixed(1)}%
          </span>
        </div>
        <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(item.current_retention, 100)}%` }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            style={{ height: '100%', background: color, borderRadius: 3 }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <Stat icon={<Clock size={12} />} label="Half-life" value={`${item.half_life_days.toFixed(1)}d`} />
        <Stat icon={<Brain size={12} />} label="K₀" value={item.k0_initial_strength.toFixed(0)} />
        <Stat icon={<Zap size={12} />} label="Forget in" value={`${item.days_to_forget.toFixed(0)}d`} />
        <Stat icon={<Clock size={12} />} label="Last review" value={`${item.days_since_review.toFixed(0)}d ago`} />
      </div>

      {/* Review buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => handleReview(false)}
          disabled={submitReview.isPending}
          style={btnStyle('#1e40af', '#3b82f6')}
        >
          📖 Reviewed
        </button>
        <button
          onClick={() => handleReview(true)}
          disabled={submitReview.isPending}
          style={btnStyle('#14532d', '#22c55e')}
        >
          ⚡ Used in Practice
        </button>
      </div>

      {/* Pulse badge for critical items */}
      {item.half_life_days < 2 && (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            position: 'absolute', top: 10, right: 36,
            background: '#ef4444', borderRadius: 99,
            padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 700,
          }}
        >
          CRITICAL
        </motion.div>
      )}
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#64748b' }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{value}</div>
      </div>
    </div>
  );
}

function btnStyle(bg: string, border: string): React.CSSProperties {
  return {
    flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 600,
    background: bg + '33', border: `1px solid ${border}66`,
    borderRadius: 6, color: border, cursor: 'pointer',
  };
}
