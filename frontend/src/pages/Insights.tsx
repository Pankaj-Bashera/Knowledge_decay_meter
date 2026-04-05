import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  useInsightSummary, useWeakestTopics, useRetentionTimeline,
  useHardestTopics, useUpcomingForgets, useMostReviewed, useSleepImpact,
} from '../api/queries';

export default function Insights() {
  return (
    <div style={{ padding: '3rem', maxWidth: 1400, margin: '0 auto' }}>
      <h1 className="brutalist-header" style={{ fontSize: 48, marginBottom: 8, color: 'var(--color-cream)' }}>SYSTEM INSIGHTS</h1>
      <p style={{ color: 'var(--color-violet)', marginBottom: 32, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telemetry & Decay Projections</p>

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
    <Card title="RETENTION TIMELINE (30D)" subtitle="SYSTEM-WIDE AVERAGE ASSAY">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-lime)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-lime)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-graphite)" />
          <XAxis dataKey="date" tick={{ fill: 'var(--color-cream)', fontSize: 13, fontWeight: 700 }} tickFormatter={d => d.slice(5)} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-cream)', fontSize: 13, fontWeight: 700 }} />
          <Tooltip contentStyle={{ background: 'var(--color-void)', border: '3px solid var(--color-lime)', color: 'var(--color-lime)', fontWeight: 900, textTransform: 'uppercase' }} formatter={(v?: number) => v !== undefined ? [`${v.toFixed(1)}%`, 'RETENTION'] : '-'} />
          <Area type="monotone" dataKey="retention" stroke="var(--color-lime)" fill="url(#retGrad)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Widget 2: Weakest topics ───────────────────────────────────────────────────

function Widget2_WeakestTopics() {
  const { data = [] } = useWeakestTopics(8);
  return (
    <Card title="WEAKEST LINKS" subtitle="SORTED BY CRITICAL DECAY">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.topic}
            </div>
            <div style={{ width: 100, height: 16, border: '3px solid var(--color-void)', background: 'var(--color-graphite)', flexShrink: 0 }}>
              <div style={{ height: '100%', width: `${item.retention}%`, background: retColor(item.retention) }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: retColor(item.retention), width: 48, textAlign: 'right', flexShrink: 0 }}>
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
    <Card title="FASTEST DECAYING" subtitle="SHORTEST HALF-LIFE (h/L)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {item.topic}
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#FF3333', flexShrink: 0, marginLeft: 12 }}>
              t½ = {item.half_life}D
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
    <Card title="UPCOMING FORGETS (30D)" subtitle="PROJECTED DROP BELOW 10%">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(data as any[]).map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-cream)' }}>{item.topic}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, color: '#FF3333', fontWeight: 900 }}>{item.forget_date}</div>
              <div style={{ fontSize: 12, color: 'var(--color-cream)', fontWeight: 700, letterSpacing: '0.1em' }}>T-MINUS {item.days_left}D</div>
            </div>
          </div>
        ))}
        {data.length === 0 && <p style={{ color: 'var(--color-lime)', fontSize: 14, fontWeight: 900 }}>ALL SYSTEMS STABLE FOR 30D</p>}
      </div>
    </Card>
  );
}

// ── Widget 5: Most reviewed ────────────────────────────────────────────────────

function Widget5_MostReviewed() {
  const { data = [] } = useMostReviewed(8);
  return (
    <Card title="MOST REVIEWED" subtitle="MAXIMUM USAGE FREQUENCY">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(data as any[]).map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--color-cream)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.topic}
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
              <Badge label="Rf" value={item.revision_frequency.toFixed(2)} color="var(--color-lime)" />
              <Badge label="U"  value={item.usage_frequency.toFixed(2)}    color="var(--color-violet)" />
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
    <Card title="SLEEP IMPACT METRICS" subtitle="IMPACT OF SLEEP DEPRIVATION ON FORGETTING RATE (k × 100)">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-cream)" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fill: 'var(--color-cream)', fontSize: 12, fontWeight: 900 }} angle={-20} textAnchor="end" />
            <YAxis tick={{ fill: 'var(--color-cream)', fontSize: 12, fontWeight: 900 }} />
            <Tooltip contentStyle={{ background: 'var(--color-void)', border: '3px solid var(--color-lime)', color: 'var(--color-lime)', fontWeight: 900, textTransform: 'uppercase' }} />
            <Bar dataKey="goodSleep" name="GOOD SLEEP (S=0.9)" fill="var(--color-violet)" />
            <Bar dataKey="poorSleep" name="POOR SLEEP (S=0.3)" fill="#FF3333" />
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
    <Card title="SUMMARY STATISTICS" subtitle="GLOBAL ARRAY METRICS">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatBox label="TOTAL LOGS"     value={data.total_items}             />
        <StatBox label="AVG RETENTION"   value={`${data.avg_retention}%`}    />
        <StatBox label="AVG HALF-LIFE"   value={`${data.avg_half_life}D`}    />
        <StatBox label="BELOW .60"       value={data.items_below_60}          color="var(--color-lime)" />
        <StatBox label="CRITICAL (.40)"       value={data.items_below_40}          color="#FF3333" />
        <StatBox label="FLOOR WARNING"      value={data.items_near_floor}        color="var(--color-violet)" />
      </div>
    </Card>
  );
}

// ── Shared UI helpers ──────────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-graphite)', border: '3px solid var(--color-cream)', padding: '2rem' }}>
      <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, color: 'var(--color-cream)', textTransform: 'uppercase' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-lime)', marginBottom: 24, textTransform: 'uppercase' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function StatBox({ label, value, color = 'var(--color-cream)' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: 'var(--color-void)', border: '3px solid var(--color-cream)', padding: 16 }}>
      <div style={{ fontSize: 32, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-cream)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function Badge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: color, border: '3px solid var(--color-void)', padding: '4px 12px', fontSize: 13, fontWeight: 900, display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ color: 'var(--color-void)' }}>{label}</span>
      <span style={{ color: 'var(--color-void)' }}>{value}</span>
    </div>
  );
}

function Empty() {
  return <p style={{ color: 'var(--color-lime)', fontSize: 14, fontWeight: 900 }}>EMPTY BUFFER</p>;
}

function retColor(r: number) {
  if (r >= 70) return 'var(--color-lime)';
  if (r >= 40) return 'var(--color-cream)';
  return '#FF3333';
}
