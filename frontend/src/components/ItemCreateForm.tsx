import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, X } from 'lucide-react';
import { useCreateItem, ItemCreate } from '../api/queries';
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
  const d = watch('difficulty');
  const k0Preview = (100 * (0.4 * Number(a) + 0.3 * Number(i) + 0.3 * baseMemory)).toFixed(0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#2563eb', color: '#fff', border: 'none',
          borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
          fontWeight: 600, fontSize: 14,
        }}
      >
        <PlusCircle size={16} /> Add Knowledge Item
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
                width: '100%', maxWidth: 520, border: '1px solid #334155',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Knowledge Item</h2>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={20} />
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
                  background: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 20,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Predicted initial encoding (K₀)</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{k0Preview}</span>
                </div>

                <button
                  type="submit"
                  disabled={createItem.isPending}
                  style={{
                    width: '100%', padding: '12px', background: '#2563eb',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {createItem.isPending ? 'Creating…' : 'Create Item'}
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
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
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
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#cbd5e1' }}>{label}</span>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{description}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{Number(val).toFixed(1)}</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.1"
        {...register(name)}
        style={{ width: '100%', accentColor: '#3b82f6' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569' }}>
        <span>Low</span><span>High</span>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: '#0f172a', border: '1px solid #334155',
  borderRadius: 8, color: '#e2e8f0', fontSize: 14,
  outline: 'none',
};
