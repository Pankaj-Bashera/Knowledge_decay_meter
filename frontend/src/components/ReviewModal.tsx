import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Zap } from 'lucide-react';
import { KnowledgeItem, useSubmitReview } from '../api/queries';

interface Props {
  item: KnowledgeItem;
  onClose: () => void;
}

export default function ReviewModal({ item, onClose }: Props) {
  const [usedInPractice, setUsedInPractice] = useState(false);
  const submitReview = useSubmitReview();

  const handleSubmit = async () => {
    await submitReview.mutateAsync({ id: item.id, used_in_practice: usedInPractice });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          style={{
            background: '#1e293b', borderRadius: 16, padding: '2rem',
            width: '100%', maxWidth: 440, border: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Submit Review</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={20} />
            </button>
          </div>

          <h3 style={{ fontSize: 16, color: '#e2e8f0', marginBottom: 8 }}>{item.topic}</h3>

          <div style={{
            display: 'flex', gap: 12, marginBottom: 24,
            background: '#0f172a', borderRadius: 8, padding: 12,
          }}>
            <Stat label="Current retention" value={`${item.current_retention.toFixed(1)}%`} />
            <Stat label="Half-life"         value={`${item.half_life_days.toFixed(1)} days`} />
            <Stat label="Days since review" value={`${item.days_since_review.toFixed(0)}`} />
          </div>

          {/* Toggle */}
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            How did you engage with this knowledge?
          </p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <ToggleBtn
              active={!usedInPractice}
              icon={<BookOpen size={16} />}
              label="Passive Review"
              sub="Read / watched / recalled"
              onClick={() => setUsedInPractice(false)}
            />
            <ToggleBtn
              active={usedInPractice}
              icon={<Zap size={16} />}
              label="Used in Practice"
              sub="Applied in real work (2× effective)"
              onClick={() => setUsedInPractice(true)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitReview.isPending}
            style={{
              width: '100%', padding: 12,
              background: usedInPractice ? '#14532d' : '#1e3a5f',
              border: `1px solid ${usedInPractice ? '#22c55e' : '#3b82f6'}`,
              borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {submitReview.isPending ? 'Submitting…' : '✓ Submit Review'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: '#64748b' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
    </div>
  );
}

function ToggleBtn({ active, icon, label, sub, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: 12, borderRadius: 10, cursor: 'pointer', textAlign: 'left',
        background: active ? 'rgba(59,130,246,0.15)' : '#0f172a',
        border: `2px solid ${active ? '#3b82f6' : '#334155'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: active ? '#3b82f6' : '#64748b' }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#e2e8f0' : '#94a3b8' }}>{label}</span>
      </div>
      <p style={{ fontSize: 11, color: '#64748b' }}>{sub}</p>
    </button>
  );
}
