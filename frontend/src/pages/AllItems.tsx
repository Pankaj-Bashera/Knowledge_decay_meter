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
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>📚 All Items</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>{items.length} knowledge items tracked</p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          placeholder="Search topics…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: '8px 14px',
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#e2e8f0', fontSize: 14,
          }}
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          style={{
            padding: '8px 14px', background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#e2e8f0', fontSize: 14,
          }}
        >
          <option value="retention">Sort: Retention ↑</option>
          <option value="half_life">Sort: Half-life ↑</option>
          <option value="topic">Sort: Topic A-Z</option>
          <option value="created_at">Sort: Newest</option>
        </select>
      </div>

      {isLoading ? (
        <p style={{ color: '#64748b' }}>Loading…</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: '#64748b' }}>No items found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
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
