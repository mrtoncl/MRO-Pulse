import { TkCard, TkBadge, TkButton, TkChart } from '@takeoff-ui/react';
import { statusVariant } from './statusUtils';

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
        <TkCard header="Total Parts Tracked"><p style={{ fontSize: '32px', fontWeight: 'bold' }}>{summary.total}</p></TkCard>
        <TkCard header="Healthy Stock"><p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a7f4e' }}>{summary.healthy}</p></TkCard>
        <TkCard header="Low Stock"><p style={{ fontSize: '32px', fontWeight: 'bold', color: '#c8860a' }}>{summary.low}</p></TkCard>
        <TkCard header="Critical"><p style={{ fontSize: '32px', fontWeight: 'bold', color: '#c8102e' }}>{summary.critical}</p></TkCard>
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
              datasets: [{ label: 'Parts', data: [summary.healthy, summary.low, summary.critical], backgroundColor: ['#1a7f4e', '#c8860a', '#c8102e'] }],
            }} />
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