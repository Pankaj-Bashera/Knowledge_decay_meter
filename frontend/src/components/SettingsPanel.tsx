import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { useUserStore } from '../store/userStore';

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { baseMemory, sleepQuality, memoryFloor, setBaseMemory, setSleepQuality, setMemoryFloor } = useUserStore();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
          borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontWeight: 500, fontSize: 14,
        }}
      >
        <Settings size={16} /> Settings
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: '#1e293b', borderRadius: 16, padding: '2rem',
                width: '100%', maxWidth: 460, border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>User Settings</h2>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                These parameters affect encoding strength and decay rate for all new items.
              </p>

              <SettingSlider
                label="Base Memory (B)"
                description="Your general memory ability"
                value={baseMemory}
                onChange={setBaseMemory}
                min={0} max={1} step={0.1}
                color="#3b82f6"
              />

              <SettingSlider
                label="Today's Sleep Quality (S)"
                description="Update each morning — affects decay rate"
                value={sleepQuality}
                onChange={setSleepQuality}
                min={0} max={1} step={0.1}
                color="#8b5cf6"
              />

              <SettingSlider
                label="Memory Floor (M)"
                description="Residual memory that never fully disappears"
                value={memoryFloor}
                onChange={setMemoryFloor}
                min={0.05} max={0.20} step={0.01}
                displayFn={(v) => `${(v * 100).toFixed(0)}%`}
                color="#22c55e"
              />

              <div style={{ background: '#0f172a', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b' }}>
                💡 Tip: Update Sleep Quality every morning for accurate decay predictions. Poor sleep (S≈0.3) can make forgetting 2-3× faster.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SliderProps {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number; max: number; step: number;
  color?: string;
  displayFn?: (v: number) => string;
}

function SettingSlider({ label, description, value, onChange, min, max, step, color = '#3b82f6', displayFn }: SliderProps) {
  const display = displayFn ? displayFn(value) : value.toFixed(1);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{description}</div>
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, color }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, marginBottom: 4 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569' }}>
        <span>{displayFn ? displayFn(min) : min}</span>
        <span>{displayFn ? displayFn(max) : max}</span>
      </div>
    </div>
  );
}
