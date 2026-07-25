import { TkDrawer, TkCard, TkAlert, TkBadge, TkButton, TkChart } from '@takeoff-ui/react';
import { statusVariant } from './statusUtils';

const variantColor = { Critical: '#c8102e', 'Low Stock': '#c8860a', Healthy: '#1a7f4e' };
const actionLabel = { ORDER_NOW: 'ORDER NOW', ORDER_SOON: 'ORDER SOON', NO_ACTION: 'NO ACTION NEEDED' };

function SectionLabel({ icon, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '18px 0 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            <span>{icon}</span>{children}
        </div>
    );
}

function StatCard({ label, value, unit }) {
    return (
        <div style={{ flex: 1, background: 'var(--card-bg-alt)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, margin: '4px 0 2px', color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</div>
        </div>
    );
}

function InfoRow({ label, value, valueColor }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{label}</span>
            <span style={{ fontWeight: 600, fontSize: '13px', color: valueColor || 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}

// The colored bar always spans the full track (same visual length on every part) — it represents the
// optimistic-to-pessimistic spread in relative terms, not an absolute day scale. The black tick marks
// where the median estimate falls within that spread. Lead time isn't drawn on this bar (it's already
// shown in its own stat card and in the banner text above) — mixing an absolute lead-time day position
// into a relative 0-100% bar was confusing rather than informative.
function PredictionRangeBar({ earliest, median, latest, color }) {
    const range = latest - earliest || 1;
    // True relative position of the median within the optimistic-pessimistic spread (not assumed to be 50%).
    const medianPct = Math.min(100, Math.max(0, ((median - earliest) / range) * 100));
    // Same position, just inset a bit so the callout doesn't get clipped at the very edge of the bar.
    const labelPct = Math.min(92, Math.max(8, medianPct));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>PESSIMISTIC</span><span>OPTIMISTIC</span>
            </div>
            {/* Median's number floats above the bar, following the tick, on its own line — kept off the
                earliest/latest row entirely so it can never collide with them, even when the median lands
                very close to one edge (e.g. a part where the model's estimate sits right next to the
                pessimistic end). */}
            <div style={{ position: 'relative', marginTop: '20px' }}>
                <div style={{ position: 'absolute', left: `${labelPct}%`, top: '-20px', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {Math.round(median)}d
                </div>
                <div style={{ position: 'relative', height: '10px', background: color, borderRadius: '5px' }}>
                    <div style={{ position: 'absolute', left: `${medianPct}%`, width: '2px', height: '18px', top: '-4px', background: '#222' }} />
                </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                <span>{Math.round(earliest)}d</span>
                <span>{Math.round(latest)}d</span>
            </div>
        </div>
    );
}

// We don't log daily consumption history (the live CSV only has one current snapshot per part), so this
// isn't real historical data. It's a smooth, deterministic curve reconstructed from two real numbers we DO
// have — avgDailyUsage (today's baseline) and usageTrendPct (whether usage has been rising or falling) — so
// the shape is grounded in something true, just not an actual day-by-day log. Deterministic per part (seeded
// by productId) so it doesn't reshuffle on every re-render.
function simulateUsageTrend(part) {
    const days = 14;
    const base = part.avgDailyUsage;
    const trendFactor = 1 + (part.usageTrendPct || 0) / 100;
    const startValue = trendFactor !== 0 ? base / trendFactor : base;
    let seed = [...part.productId].reduce((a, c) => a + c.charCodeAt(0), 7);
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const values = [];
    for (let i = 0; i < days; i++) {
        const progress = i / (days - 1);
        const trendValue = startValue + (base - startValue) * progress;
        const noise = (rand() - 0.5) * base * 0.35;
        values.push(Math.max(0, +(trendValue + noise).toFixed(2)));
    }
    values[days - 1] = base;
    return values;
}

function UsageTrendChart({ part }) {
    const values = simulateUsageTrend(part);
    const labels = values.map((_, i) => `D-${values.length - i}`);
    const avg = part.avgDailyUsage;

    return (
        <div>
            <TkChart type="line" height={160} data={{
                labels,
                datasets: [
                    { label: 'Daily usage', data: values, borderColor: '#c8102e', backgroundColor: 'rgba(200,16,46,0.1)', fill: true, tension: 0.35, pointRadius: 0 },
                    { label: 'Avg', data: values.map(() => avg), borderColor: '#999', borderDash: [4, 4], pointRadius: 0, fill: false },
                ],
            }} options={{
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#888' }, grid: { color: 'rgba(136,136,136,0.15)' } },
                    y: { ticks: { color: '#888' }, grid: { color: 'rgba(136,136,136,0.15)' } },
                },
            }} />
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span><span style={{ display: 'inline-block', width: '12px', borderTop: '2px solid #c8102e', marginRight: '4px', verticalAlign: 'middle' }} />Daily usage</span>
                <span><span style={{ display: 'inline-block', width: '12px', borderTop: '2px dashed #999', marginRight: '4px', verticalAlign: 'middle' }} />Avg ({avg.toFixed(2)} ea/day)</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                Illustrative — reconstructed from average usage and trend, not a logged daily history.
            </p>
        </div>
    );
}

// Shared between Overview (Urgent Alerts) and Inventory (table rows) so clicking a part looks and
// behaves identically no matter which page you clicked it from.
function PartDrawer({ part, onClose }) {
    const hasPrediction = Boolean(part?.stockPrediction && part?.leadTimePrediction);

    return (
        <TkDrawer headerType="light" open={part !== null} onTkDrawerClose={onClose}>
            <div slot="content">
                {part && (
                    <div>
                        {/* Styled directly (not via TkDrawer's built-in dark header) so we control the exact
                            THY-maroon background — the drawer's own "dark" header type is a fixed shadow-DOM
                            color we can't reliably override. */}
                        <div style={{ background: '#3a1013', color: '#fff', borderRadius: '10px', padding: '16px', margin: '-4px 0 16px' }}>
                            <div style={{ fontSize: '11px', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.75)' }}>{part.productId}</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 10px', color: '#fff' }}>{part.productName}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <TkBadge label={part.status} variant={statusVariant(part.status)} type="filled" dot />
                                <TkBadge label={part.criticality} type="filled" variant="neutral" />
                                <TkBadge label={part.category} type="filled" variant="neutral" />
                            </div>
                        </div>

                        {hasPrediction ? (
                            <TkAlert variant={statusVariant(part.status)} type="filled" header={actionLabel[part.action]}
                                message={`Runs out in ~${Math.round(part.stockPrediction.median_day)} days. Resupply ~${Math.round(part.leadTimePrediction.lead_time)} days.`} />
                        ) : (
                            <TkAlert variant="info" type="outlined" header="Loading prediction..." message="Fetching ML estimates." />
                        )}

                        <SectionLabel icon="▪">Stock Details</SectionLabel>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <StatCard label="On Hand" value={part.stockQuantity} unit="ea" />
                            <StatCard label="Avg Daily" value={part.avgDailyUsage.toFixed(2)} unit="ea/day" />
                            <StatCard label="Lead Time" value={hasPrediction ? Math.round(part.leadTimePrediction.lead_time) : '...'} unit="days" />
                        </div>

                        <SectionLabel icon="↘">ML Stockout Prediction</SectionLabel>
                        <TkCard>
                            {hasPrediction ? (
                                <PredictionRangeBar
                                    earliest={part.stockPrediction.earliest_day}
                                    median={part.stockPrediction.median_day}
                                    latest={part.stockPrediction.latest_day}
                                    color={variantColor[part.status]}
                                />
                            ) : <p>Loading...</p>}
                        </TkCard>

                        {part.leadTimePrediction?.delay_warning && (
                            <TkAlert variant="warning" type="outlined" header="Supplier Delay Risk" message="This supplier is predicted to deliver later than promised." style={{ marginTop: '12px' }} />
                        )}

                        <SectionLabel icon="⏱">14-Day Usage Trend</SectionLabel>
                        <TkCard>
                            <UsageTrendChart part={part} />
                        </TkCard>

                        <SectionLabel icon="▤">Part Information</SectionLabel>
                        <TkCard>
                            <InfoRow label="Part ID" value={part.productId} />
                            <InfoRow label="Category" value={part.category} />
                            <InfoRow label="Criticality" value={part.criticality} />
                            <InfoRow label="Status" value={part.status} valueColor={variantColor[part.status]} />
                            <InfoRow label="Supplier lead time" value={hasPrediction ? `${Math.round(part.leadTimePrediction.lead_time)} days` : '...'} />
                        </TkCard>

                        <TkButton
                            label={hasPrediction ? actionLabel[part.action] : 'Loading...'}
                            variant={statusVariant(part.status)}
                            fullWidth
                            style={{ marginTop: '16px' }}
                        />
                    </div>
                )}
            </div>
        </TkDrawer>
    );
}

export default PartDrawer;
