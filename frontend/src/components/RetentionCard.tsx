import { motion } from 'framer-motion';
import { Skull, Clock, Zap, Trash2, BookOpen } from 'lucide-react';
import { type KnowledgeItem, useDeleteItem, useSubmitReview } from '../api/queries';

interface Props {
  item: KnowledgeItem;
  index?: number;
}

function retentionColor(r: number): string {
  if (r >= 70) return 'var(--color-lime)';
  if (r >= 40) return 'var(--color-cream)';
  return '#FF3333';
}

function retentionBg(r: number): string {
  if (r >= 70) return 'var(--color-void)';
  if (r >= 40) return 'var(--color-void)';
  return 'var(--color-void)';
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
        border: `3px solid ${color}`,
        padding: '1.5rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-cream)', textTransform: 'uppercase', marginBottom: 8, lineHeight: 1.1 }}>
            {item.topic}
          </h3>
          {item.content && (
            <p style={{ fontSize: 14, color: 'var(--color-cream)', opacity: 0.8, lineHeight: 1.5, fontFamily: 'monospace' }}>
              {item.content.slice(0, 80)}{item.content.length > 80 ? '…' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => deleteItem.mutate(item.id)}
          style={{ background: 'var(--color-graphite)', border: '3px solid var(--color-cream)', cursor: 'pointer', color: 'var(--color-cream)', padding: 8, transition: '0.1s' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#FF3333'; e.currentTarget.style.color = 'var(--color-void)'; e.currentTarget.style.borderColor = '#FF3333'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-graphite)'; e.currentTarget.style.color = 'var(--color-cream)'; e.currentTarget.style.borderColor = 'var(--color-cream)'; }}
        >
          <Trash2 size={20} strokeWidth={3} />
        </button>
      </div>

      {/* Retention bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, textTransform: 'uppercase', fontWeight: 900, fontSize: 13, letterSpacing: '0.05em' }}>
          <span style={{ color: 'var(--color-cream)' }}>RETENTION</span>
          <span style={{ color }}>{item.current_retention.toFixed(1)}%</span>
        </div>
        <div style={{ height: 24, border: '3px solid var(--color-cream)', background: 'var(--color-graphite)', position: 'relative' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(item.current_retention, 100)}%` }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            style={{ height: '100%', background: color }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <Stat icon={<Clock size={16} strokeWidth={3} />} label="HALF-LIFE" value={`${item.half_life_days.toFixed(1)}D`} />
        <Stat icon={<Skull size={16} strokeWidth={3} />} label="K₀ STRENGTH" value={item.k0_initial_strength.toFixed(0)} />
        <Stat icon={<Zap size={16} strokeWidth={3} />} label="FORGET IN" value={`${item.days_to_forget.toFixed(0)}D`} />
        <Stat icon={<Clock size={16} strokeWidth={3} />} label="LST REVISION" value={`${item.days_since_review.toFixed(0)}D`} />
      </div>

      {/* Review buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 'auto' }}>
        <button
          className="brutalist-button"
          style={{ justifyContent: 'center', background: 'var(--color-violet)', color: 'var(--color-cream)' }}
          onClick={() => handleReview(false)}
          disabled={submitReview.isPending}
        >
          <BookOpen size={16} strokeWidth={3} /> REVIEW
        </button>
        <button
          className="brutalist-button"
          style={{ justifyContent: 'center' }}
          onClick={() => handleReview(true)}
          disabled={submitReview.isPending}
        >
          <Zap size={16} strokeWidth={3} /> USED X
        </button>
      </div>

      {/* Badge */}
      {item.half_life_days < 2 && (
        <div
          style={{
            position: 'absolute', top: -14, right: -14,
            background: '#FF3333', border: '3px solid var(--color-void)',
            padding: '4px 12px', fontSize: 14, color: 'var(--color-void)', fontWeight: 900,
            transform: 'rotate(10deg)'
          }}
        >
          CRITICAL
        </div>
      )}
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ border: '3px solid var(--color-cream)', padding: '8px 12px', background: 'var(--color-graphite)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-cream)', marginBottom: 4, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-lime)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}
