import { TkCard, TkBadge, TkButton, TkChart } from '@takeoff-ui/react';
import { statusVariant } from './statusUtils';

function KpiCard({ label, value, subtitle, color }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: '8px', borderTop: `4px solid ${color}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: '#888', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 700, color, margin: '6px 0 4px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#999' }}>{subtitle}</div>
    </div>
  );
}

function Overview({ allParts, predictionsReady }) {
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
      <p style={{ color: '#888', marginBottom: '16px' }}>
        {allParts.length} parts tracked{!predictionsReady && ' · calculating ML predictions...'}
      </p>

      <div style={{ display: 'flex', gap: '16px' }}>
        <KpiCard label="Total Parts Tracked" value={summary.total} subtitle={`${categories.length} categories`} color="#241012" />
        <KpiCard label="Healthy Stock" value={summary.healthy} subtitle="No action required" color="#1a7f4e" />
        <KpiCard label="Low Stock" value={summary.low} subtitle="Order soon" color="#c8860a" />
        <KpiCard label="Critical" value={summary.critical} subtitle="Immediate action" color="#c8102e" />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'flex-start' }}>
        <TkCard header={`Urgent Alerts (${alerts.length})`} style={{ flex: 2 }}>
          {alerts.length === 0 ? (
            <p style={{ color: '#666' }}>No urgent alerts right now.</p>
          ) : (
            alerts.map((part) => {
              const isCritical = part.status === 'Critical';
              const borderColor = isCritical ? '#c8102e' : '#c8860a';
              return (
                <div key={part.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #eee', borderLeft: `3px solid ${borderColor}`, paddingLeft: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#888', marginRight: '8px' }}>{part.productId}</span>
                    <TkBadge label={part.status} variant={statusVariant(part.status)} />
                    <p style={{ fontWeight: 'bold', margin: '4px 0' }}>{part.productName}</p>
                    <p style={{ color: '#666', fontSize: '14px' }}>Runs out in ~{daysLabel(part)} days. {isCritical ? 'Order today.' : 'Order soon.'}</p>
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
            }} options={{ plugins: { legend: { display: false } } }} />
          </TkCard>

          <TkCard header="Stock by Category">
            <TkChart type="bar" height={200} data={{
              labels: categories,
              datasets: [
                { label: 'Healthy', data: categories.map((c) => categoryStats[c].Healthy), backgroundColor: '#1a7f4e' },
                { label: 'Low', data: categories.map((c) => categoryStats[c]['Low Stock']), backgroundColor: '#c8860a' },
                { label: 'Critical', data: categories.map((c) => categoryStats[c].Critical), backgroundColor: '#c8102e' },
              ],
            }} options={{ scales: { x: { stacked: true }, y: { stacked: true } } }} />
          </TkCard>
        </div>
      </div>
    </div>
  );
}

export default Overview;