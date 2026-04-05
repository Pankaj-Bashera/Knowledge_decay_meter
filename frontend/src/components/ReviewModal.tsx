import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Zap } from 'lucide-react';
import { type KnowledgeItem, useSubmitReview } from '../api/queries';

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
            background: 'var(--color-graphite)', padding: '3rem',
            width: '100%', maxWidth: 480, border: '3px solid var(--color-lime)',
            boxShadow: '8px 8px 0px var(--color-lime)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-cream)' }}>SUBMIT ASSAY</h2>
            <button onClick={onClose} style={{ background: 'none', border: '3px solid var(--color-cream)', cursor: 'pointer', color: 'var(--color-cream)', padding: 4 }}>
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-lime)', textTransform: 'uppercase', marginBottom: 16 }}>{item.topic}</h3>

          <div style={{
            display: 'flex', gap: 16, marginBottom: 32,
            background: 'var(--color-void)', border: '3px solid var(--color-cream)', padding: 16,
          }}>
            <Stat label="RETENTION" value={`${item.current_retention.toFixed(1)}%`} />
            <Stat label="HALF-LIFE"         value={`${item.half_life_days.toFixed(1)}D`} />
            <Stat label="AGE (DAYS)" value={`${item.days_since_review.toFixed(0)}`} />
          </div>

          {/* Toggle */}
          <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-cream)', marginBottom: 12, textTransform: 'uppercase' }}>
            ENGAGEMENT TYPE
          </p>
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            <ToggleBtn
              active={!usedInPractice}
              icon={<BookOpen size={20} strokeWidth={3} />}
              label="PASSIVE READ"
              sub="Read / watched / recalled"
              onClick={() => setUsedInPractice(false)}
            />
            <ToggleBtn
              active={usedInPractice}
              icon={<Zap size={20} strokeWidth={3} />}
              label="ACTIVE USAGE"
              sub="Applied in real work (x2)"
              onClick={() => setUsedInPractice(true)}
            />
          </div>

          <button
            className="brutalist-button"
            onClick={handleSubmit}
            disabled={submitReview.isPending}
            style={{ width: '100%', justifyContent: 'center', fontSize: 18 }}
          >
            {submitReview.isPending ? 'PROCESSING...' : 'CONFIRM ASSAY'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, padding: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-cream)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-lime)' }}>{value}</div>
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
        flex: 1, padding: 12, cursor: 'pointer', textAlign: 'left',
        background: active ? 'var(--color-violet)' : 'var(--color-void)',
        border: `3px solid ${active ? 'var(--color-cream)' : 'var(--color-cream)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: active ? 'var(--color-cream)' : 'var(--color-cream)' }}>
        {icon}
        <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: active ? 'var(--color-cream)' : 'var(--color-cream)' }}>{label}</span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'var(--color-cream)', textTransform: 'uppercase' }}>{sub}</p>
    </button>
  );
}
