import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  useInsightSummary, useWeakestTopics, useRetentionTimeline,
  useHardestTopics, useUpcomingForgets, useMostReviewed, useSleepImpact,
} from '../api/queries';

export default function Insights() {
  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>📊 Insights</h1>
      <p style={{ color: '#64748b', marginBottom: 32 }}>Analytics across all 7 insight endpoints</p>

      <div style={{ display: 'grid', gap: 24 }}>
        <Widget1_RetentionTimeline />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Widget2_WeakestTopics />
          <Widget3_HardestTopics />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Widget4_UpcomingForgets />
          <Widget5_MostReviewed />
        </div>
        <Widget6_SleepImpact />
        <Widget7_Summary />
      </div>
    </div>
  );
}

// ── Widget 1: Retention timeline ───────────────────────────────────────────────

function Widget1_RetentionTimeline() {
  const { data = [] } = useRetentionTimeline();
  return (
    <Card title="📈 Retention Timeline (30 days)" subtitle="Average retention across all items">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Retention']} />
          <Area type="monotone" dataKey="retention" stroke="#3b82f6" fill="url(#retGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Widget 2: Weakest topics ───────────────────────────────────────────────────

function Widget2_WeakestTopics() {
  const { data = [] } = useWeakestTopics(8);
  return (
    <Card title="🔴 Weakest Topics" subtitle="Sorted by lowest retention">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.topic}
            </div>
            <div style={{ width: 80, height: 6, background: '#0f172a', borderRadius: 3, flexShrink: 0 }}>
              <div style={{ height: '100%', width: `${item.retention}%`, background: retColor(item.retention), borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: retColor(item.retention), width: 42, textAlign: 'right', flexShrink: 0 }}>
              {item.retention}%
            </div>
          </div>
        ))}
        {data.length === 0 && <Empty />}
      </div>
    </Card>
  );
}

// ── Widget 3: Hardest topics ───────────────────────────────────────────────────

function Widget3_HardestTopics() {
  const { data = [] } = useHardestTopics(8);
  return (
    <Card title="⚡ Fastest Decaying" subtitle="Shortest half-life (needs most review)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.topic}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316', flexShrink: 0, marginLeft: 8 }}>
              t½ = {item.half_life}d
            </span>
          </div>
        ))}
        {data.length === 0 && <Empty />}
      </div>
    </Card>
  );
}

// ── Widget 4: Upcoming forgets ─────────────────────────────────────────────────

function Widget4_UpcomingForgets() {
  const { data = [] } = useUpcomingForgets(30);
  return (
    <Card title="🗓️ Upcoming Forgets (30 days)" subtitle="Items that will drop below 10% retention">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(data as any[]).map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#e2e8f0' }}>{item.topic}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{item.forget_date}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{item.days_left}d left</div>
            </div>
          </div>
        ))}
        {data.length === 0 && <p style={{ color: '#22c55e', fontSize: 13 }}>✅ Nothing at risk in the next 30 days!</p>}
      </div>
    </Card>
  );
}

// ── Widget 5: Most reviewed ────────────────────────────────────────────────────

function Widget5_MostReviewed() {
  const { data = [] } = useMostReviewed(8);
  return (
    <Card title="🏆 Most Reviewed" subtitle="Highest combined Rf + U frequency">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(data as any[]).map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.topic}
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 8 }}>
              <Badge label="Rf" value={item.revision_frequency.toFixed(2)} color="#3b82f6" />
              <Badge label="U"  value={item.usage_frequency.toFixed(2)}    color="#22c55e" />
            </div>
          </div>
        ))}
        {data.length === 0 && <Empty />}
      </div>
    </Card>
  );
}

// ── Widget 6: Sleep impact ─────────────────────────────────────────────────────

function Widget6_SleepImpact() {
  const { data = [] } = useSleepImpact();
  const top5 = (data as any[]).slice(0, 5);

  const chartData = top5.map(d => ({
    name:       d.topic.slice(0, 14),
    goodSleep:  +(d.k_good_sleep * 100).toFixed(2),
    poorSleep:  +(d.k_poor_sleep * 100).toFixed(2),
  }));

  return (
    <Card title="😴 Sleep Impact on Decay" subtitle="How poor sleep amplifies forgetting rate (k × 100) — top 5 most affected topics">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} angle={-20} textAnchor="end" />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
            <Bar dataKey="goodSleep" name="Good sleep (S=0.9)" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="poorSleep" name="Poor sleep (S=0.3)" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <Empty />}
    </Card>
  );
}

// ── Widget 7: Summary stats ────────────────────────────────────────────────────

function Widget7_Summary() {
  const { data } = useInsightSummary();
  if (!data) return null;
  return (
    <Card title="📋 Summary Statistics" subtitle="Across all tracked knowledge items">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatBox label="Total items"     value={data.total_items}             />
        <StatBox label="Avg retention"   value={`${data.avg_retention}%`}    />
        <StatBox label="Avg half-life"   value={`${data.avg_half_life}d`}    />
        <StatBox label="Below 60%"       value={data.items_below_60}          color="#f97316" />
        <StatBox label="Below 40%"       value={data.items_below_40}          color="#ef4444" />
        <StatBox label="Near floor"      value={data.items_near_floor}        color="#94a3b8" />
      </div>
    </Card>
  );
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 14, padding: '1.5rem', border: '1px solid #334155' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function StatBox({ label, value, color = '#e2e8f0' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: '#0f172a', borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: color + '22', border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
      <span style={{ color: '#64748b' }}>{label} </span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Empty() {
  return <p style={{ color: '#475569', fontSize: 13 }}>No data yet.</p>;
}

function retColor(r: number) {
  if (r >= 70) return '#22c55e';
  if (r >= 50) return '#eab308';
  if (r >= 30) return '#f97316';
  return '#ef4444';
}
