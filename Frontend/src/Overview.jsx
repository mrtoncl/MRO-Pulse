import { useState } from 'react';
import { TkCard, TkBadge, TkButton, TkChart } from '@takeoff-ui/react';
import { statusVariant } from './statusUtils';
import PartDrawer from './PartDrawer';

// Chart.js doesn't know about our CSS theme variables (it paints on a canvas), so without this its
// default axis text/gridlines are near-black — invisible on a dark card. A mid-grey reads fine on
// both light and dark backgrounds, so this one setting works for both themes without extra wiring.
const chartAxisOptions = {
  scales: {
    x: { ticks: { color: '#888' }, grid: { color: 'rgba(136,136,136,0.15)' } },
    y: { ticks: { color: '#888' }, grid: { color: 'rgba(136,136,136,0.15)' } },
  },
};

function KpiCard({ label, value, subtitle, color }) {
  return (
    // Reuses .hoverable for the lift/shadow/grey animation, but these cards aren't clickable (no
    // onClick), so cursor is forced back to default — an inline style wins over the class's cursor:pointer.
    <div className="hoverable" style={{ flex: 1, background: 'var(--card-bg)', borderRadius: '8px', borderTop: `4px solid ${color}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', cursor: 'default' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 700, color, margin: '6px 0 4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</div>
    </div>
  );
}

function Overview({ allParts, predictionsReady }) {
  const [selectedId, setSelectedId] = useState(null);
  const selectedPart = selectedId ? allParts.find((p) => p.productId === selectedId) : null;

  const summary = {
    total: allParts.length,
    healthy: allParts.filter((p) => p.status === 'Healthy').length,
    low: allParts.filter((p) => p.status === 'Low Stock').length,
    critical: allParts.filter((p) => p.status === 'Critical').length,
  };

  // Sorting by gap ascending already puts every Critical row (gap < 2) before every
  // Low Stock row (gap 2-7), so no separate grouping step is needed.
  const alerts = allParts
    .filter((p) => p.status === 'Critical' || p.status === 'Low Stock')
    .sort((a, b) => (a.gap ?? a.daysRemaining) - (b.gap ?? b.daysRemaining));

  const daysLabel = (p) => Math.round(p.stockPrediction ? p.stockPrediction.median_day : p.daysRemaining);

  const categoryStats = {};
  allParts.forEach((p) => {
    if (!categoryStats[p.category]) categoryStats[p.category] = { Healthy: 0, 'Low Stock': 0, Critical: 0 };
    categoryStats[p.category][p.status] += 1;
  });
  const categories = Object.keys(categoryStats);

  return (
    <div>
      <h2 style={{ marginBottom: '4px' }}>Inventory Overview</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        {allParts.length} parts tracked{!predictionsReady && ' · calculating ML predictions...'}
      </p>

      <div style={{ display: 'flex', gap: '16px' }}>
        <KpiCard label="Total Parts Tracked" value={summary.total} subtitle={`${categories.length} categories`} color="var(--text-primary)" />
        <KpiCard label="Healthy Stock" value={summary.healthy} subtitle="No action required" color="#1a7f4e" />
        <KpiCard label="Low Stock" value={summary.low} subtitle="Order soon" color="#c8860a" />
        <KpiCard label="Critical" value={summary.critical} subtitle="Immediate action" color="#c8102e" />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'flex-start' }}>
        <TkCard header={`Urgent Alerts (${alerts.length})`} style={{ flex: 2 }}>
          {alerts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No urgent alerts right now.</p>
          ) : (
            alerts.map((part) => {
              const isCritical = part.status === 'Critical';
              const borderColor = isCritical ? '#c8102e' : '#c8860a';
              return (
                <div key={part.productId} className="hoverable" onClick={() => setSelectedId(part.productId)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px', borderBottom: '1px solid var(--border-subtle)', borderLeft: `3px solid ${borderColor}`, borderRadius: '4px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '8px' }}>{part.productId}</span>
                    <TkBadge label={part.status} variant={statusVariant(part.status)} />
                    <p style={{ fontWeight: 'bold', margin: '4px 0' }}>{part.productName}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Runs out in ~{daysLabel(part)} days. {isCritical ? 'Order today.' : 'Order soon.'}</p>
                  </div>
                  <TkButton label={isCritical ? 'Order Now' : 'Order Soon'} variant={statusVariant(part.status)} />
                </div>
              );
            })
          )}
        </TkCard>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TkCard header="Status Distribution">
            <TkChart type="bar" height={200} data={{
              labels: ['Healthy', 'Low', 'Critical'],
              datasets: [{ label: 'Parts', data: [summary.healthy, summary.low, summary.critical], backgroundColor: ['#1a7f4e', '#c8860a', '#c8102e'], minBarLength: 6 }],
            }} options={{ plugins: { legend: { display: false } }, ...chartAxisOptions }} />
          </TkCard>

          <TkCard header="Stock by Category">
            <TkChart type="bar" height={200} data={{
              labels: categories,
              datasets: [
                { label: 'Healthy', data: categories.map((c) => categoryStats[c].Healthy), backgroundColor: '#1a7f4e' },
                { label: 'Low', data: categories.map((c) => categoryStats[c]['Low Stock']), backgroundColor: '#c8860a' },
                { label: 'Critical', data: categories.map((c) => categoryStats[c].Critical), backgroundColor: '#c8102e' },
              ],
            }} options={{
              plugins: { legend: { labels: { color: '#888' } } },
              scales: { x: { stacked: true, ...chartAxisOptions.scales.x }, y: { stacked: true, ...chartAxisOptions.scales.y } },
            }} />
          </TkCard>
        </div>
      </div>

      <PartDrawer part={selectedPart} onClose={() => setSelectedId(null)} />
    </div>
  );
}

export default Overview;