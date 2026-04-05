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
          background: 'var(--color-graphite)', color: 'var(--color-cream)', border: '3px solid var(--color-cream)',
          padding: '8px 16px', cursor: 'pointer', fontWeight: 900, fontSize: 14, textTransform: 'uppercase', transition: '0.1s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-cream)'; e.currentTarget.style.color = 'var(--color-void)'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-graphite)'; e.currentTarget.style.color = 'var(--color-cream)'; }}
      >
        <Settings size={20} strokeWidth={3} /> CONFIGURE
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
                background: 'var(--color-graphite)', border: '3px solid var(--color-violet)', padding: '3rem',
                width: '100%', maxWidth: 480, boxShadow: '8px 8px 0px var(--color-violet)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-cream)', textTransform: 'uppercase' }}>SYSTEM SETTINGS</h2>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: '3px solid var(--color-cream)', cursor: 'pointer', color: 'var(--color-cream)', padding: 4 }}>
                  <X size={24} strokeWidth={3} />
                </button>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-lime)', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                GLOBAL PARAMETERS FOR NEW ASSETS
              </p>

              <SettingSlider
                label="BASE MEMORY (B)"
                description="CORE COGNITIVE ABILITY"
                value={baseMemory}
                onChange={setBaseMemory}
                min={0} max={1} step={0.1}
                color="var(--color-lime)"
              />

              <SettingSlider
                label="SLEEP QUALITY (S)"
                description="AFFECTS DAILY DECAY RATE"
                value={sleepQuality}
                onChange={setSleepQuality}
                min={0} max={1} step={0.1}
                color="var(--color-violet)"
              />

              <SettingSlider
                label="MEMORY FLOOR (M)"
                description="PERMANENT RESIDUAL RETENTION"
                value={memoryFloor}
                onChange={setMemoryFloor}
                min={0.05} max={0.20} step={0.01}
                displayFn={(v) => `${(v * 100).toFixed(0)}%`}
                color="var(--color-cream)"
              />

              <div style={{ background: 'var(--color-void)', border: '3px solid var(--color-cream)', padding: 16, fontSize: 13, color: 'var(--color-cream)', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.5 }}>
                WARNING: POOR SLEEP (S≈0.3) CAN ACCELERATE FORGETTING BY UP TO 300%. MAINTAIN OPTIMAL SLEEP LEVELS FOR DATA INTEGRITY.
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

function SettingSlider({ label, description, value, onChange, min, max, step, color = 'var(--color-lime)', displayFn }: SliderProps) {
  const display = displayFn ? displayFn(value) : value.toFixed(1);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-cream)', textTransform: 'uppercase' }}>{label}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-cream)', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{description}</div>
        </div>
        <span style={{ fontSize: 24, fontWeight: 900, color }}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, marginBottom: 8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900, color: 'var(--color-cream)', textTransform: 'uppercase' }}>
        <span>{displayFn ? displayFn(min) : min}</span>
        <span>{displayFn ? displayFn(max) : max}</span>
      </div>
    </div>
  );
}
