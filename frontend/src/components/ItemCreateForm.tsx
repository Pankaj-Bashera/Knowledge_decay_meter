import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X } from 'lucide-react';
import { useCreateItem, type ItemCreate } from '../api/queries';
import { useUserStore } from '../store/userStore';

interface FormData {
  topic:      string;
  content:    string;
  attention:  number;
  interest:   number;
  difficulty: number;
}

export default function ItemCreateForm() {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { attention: 0.8, interest: 0.5, difficulty: 0.5 },
  });
  const createItem = useCreateItem();
  const { baseMemory, sleepQuality, memoryFloor } = useUserStore();

  const onSubmit = async (data: FormData) => {
    const payload: ItemCreate = {
      topic:       data.topic,
      content:     data.content || undefined,
      attention:   Number(data.attention),
      interest:    Number(data.interest),
      difficulty:  Number(data.difficulty),
      base_memory:   baseMemory,
      sleep_quality: sleepQuality,
      memory_floor:  memoryFloor,
    };
    await createItem.mutateAsync(payload);
    reset();
    setOpen(false);
  };

  const a = watch('attention');
  const i = watch('interest');
  const k0Preview = (100 * (0.4 * Number(a) + 0.3 * Number(i) + 0.3 * baseMemory)).toFixed(0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="brutalist-button"
      >
        <PlusCircle size={20} strokeWidth={3} /> INITIALIZE ASSET
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
                background: 'var(--color-graphite)', border: '3px solid var(--color-lime)', padding: '3rem',
                width: '100%', maxWidth: 520, boxShadow: '8px 8px 0px var(--color-lime)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color:'var(--color-cream)', textTransform: 'uppercase' }}>INITIALIZE ASSET</h2>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: '3px solid var(--color-cream)', cursor: 'pointer', color: 'var(--color-cream)', padding: 4 }}>
                  <X size={24} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Field label="Topic *">
                  <input
                    {...register('topic', { required: true })}
                    placeholder="e.g., Binary Search"
                    style={inputStyle}
                  />
                  {errors.topic && <span style={{ color: '#ef4444', fontSize: 12 }}>Required</span>}
                </Field>

                <Field label="Content (optional)">
                  <textarea
                    {...register('content')}
                    placeholder="Brief description or notes..."
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </Field>

                <SliderField label="Attention" description="How focused were you?" name="attention" register={register} watch={watch} />
                <SliderField label="Interest"  description="How interesting is this topic?" name="interest" register={register} watch={watch} />
                <SliderField label="Difficulty" description="How complex is this topic?" name="difficulty" register={register} watch={watch} />

                <div style={{
                  background: 'var(--color-void)', border: '3px solid var(--color-cream)', padding: 16, marginBottom: 32,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-cream)', textTransform: 'uppercase' }}>PREDICTED ENCODING (K₀)</span>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-lime)' }}>{k0Preview}</span>
                </div>

                <button
                  type="submit"
                  disabled={createItem.isPending}
                  className="brutalist-button"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 18 }}
                >
                  {createItem.isPending ? 'PROCESSING...' : 'CONFIRM ENTRY'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: 'var(--color-cream)', marginBottom: 8, textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SliderField({ label, description, name, register, watch }: {
  label: string; description: string; name: string;
  register: any; watch: any;
}) {
  const val = watch(name);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-cream)', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: 12, color: 'var(--color-cream)', opacity: 0.8, marginLeft: 8, textTransform: 'uppercase' }}>{description}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-violet)' }}>{Number(val).toFixed(1)}</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.1"
        {...register(name)}
        style={{ width: '100%', accentColor: 'var(--color-violet)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--color-cream)', textTransform: 'uppercase', marginTop: 4 }}>
        <span>MIN</span><span>MAX</span>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'var(--color-void)', border: '3px solid var(--color-cream)',
  color: 'var(--color-lime)', fontSize: 16, fontWeight: 800,
  outline: 'none', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif'
};
