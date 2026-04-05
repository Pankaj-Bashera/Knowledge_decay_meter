import { useState } from 'react';
import { useItems } from '../api/queries';
import RetentionCard from '../components/RetentionCard';
import ReviewModal from '../components/ReviewModal';
import type { KnowledgeItem } from '../api/queries';

type SortKey = 'retention' | 'half_life' | 'created_at' | 'topic';

export default function AllItems() {
  const { data: items = [], isLoading } = useItems();
  const [sortBy, setSortBy]     = useState<SortKey>('retention');
  const [filter, setFilter]     = useState('');
  const [reviewing, setReviewing] = useState<KnowledgeItem | null>(null);

  const sorted = [...items]
    .filter(i => i.topic.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'retention')  return a.current_retention - b.current_retention;
      if (sortBy === 'half_life')  return a.half_life_days - b.half_life_days;
      if (sortBy === 'topic')      return a.topic.localeCompare(b.topic);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div style={{ padding: '3rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 className="brutalist-header" style={{ fontSize: 48, marginBottom: 8, color: 'var(--color-cream)' }}>DATABASE LOGS</h1>
      <p style={{ color: 'var(--color-lime)', marginBottom: 32, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{items.length} ASSETS REGISTERED</p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <input
          placeholder="QUERY TOPIC..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '12px 16px',
            background: 'var(--color-graphite)', border: '3px solid var(--color-cream)',
            color: 'var(--color-lime)', fontSize: 16, fontWeight: 900, textTransform: 'uppercase'
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          style={{
            padding: '12px 16px', background: 'var(--color-lime)', border: '3px solid var(--color-cream)',
            color: 'var(--color-void)', fontSize: 16, fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer'
          }}
        >
          <option value="retention">Sort: Retention ↑</option>
          <option value="half_life">Sort: Half-life ↑</option>
          <option value="topic">Sort: Topic A-Z</option>
          <option value="created_at">Sort: Newest</option>
        </select>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--color-lime)', fontWeight: 900 }}>LOADING_DATA...</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: 'var(--color-cream)', fontWeight: 900 }}>EMPTY. NO RECORDS FOUND.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {sorted.map((item, i) => (
            <div key={item.id} onClick={() => setReviewing(item)} style={{ cursor: 'pointer' }}>
              <RetentionCard item={item} index={i} />
            </div>
          ))}
        </div>
      )}

      {reviewing && <ReviewModal item={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}
