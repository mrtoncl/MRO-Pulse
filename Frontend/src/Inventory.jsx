import { useState } from 'react';
import { TkTable, TkSelect, TkDrawer, TkCard, TkAlert, TkBadge, TkButton, TkChart } from '@takeoff-ui/react';
import { statusVariant } from './statusUtils';

const variantColor = { Critical: '#c8102e', 'Low Stock': '#c8860a', Healthy: '#1a7f4e' };
const actionLabel = { ORDER_NOW: 'ORDER NOW', ORDER_SOON: 'ORDER SOON', NO_ACTION: 'NO ACTION NEEDED' };

function SectionLabel({ icon, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '18px 0 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: '#888', textTransform: 'uppercase' }}>
            <span>{icon}</span>{children}
        </div>
    );
}

function StatCard({ label, value, unit }) {
    return (
        <div style={{ flex: 1, background: '#f4f5f7', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: '#888', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '26px', fontWeight: 700, margin: '4px 0 2px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{unit}</div>
        </div>
    );
}

function InfoRow({ label, value, valueColor }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#888', fontSize: '13px' }}>{label}</span>
            <span style={{ fontWeight: 600, fontSize: '13px', color: valueColor || '#222' }}>{value}</span>
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
    // Same position, just inset a bit so the number itself doesn't get clipped at the very edge of the bar.
    const labelPct = Math.min(94, Math.max(6, medianPct));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888' }}>
                <span>PESSIMISTIC</span><span>OPTIMISTIC</span>
            </div>
            <div style={{ position: 'relative', height: '10px', background: color, borderRadius: '5px', margin: '10px 0' }}>
                <div style={{ position: 'absolute', left: `${medianPct}%`, width: '2px', height: '18px', top: '-4px', background: '#222' }} />
            </div>
            <div style={{ position: 'relative', height: '16px', fontSize: '12px' }}>
                <span style={{ position: 'absolute', left: 0 }}>{Math.round(earliest)}d</span>
                <span style={{ position: 'absolute', left: `${labelPct}%`, transform: 'translateX(-50%)', fontWeight: 'bold' }}>{Math.round(median)}d</span>
                <span style={{ position: 'absolute', right: 0 }}>{Math.round(latest)}d</span>
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
            }} options={{ plugins: { legend: { display: false } } }} />
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#888', marginTop: '4px' }}>
                <span><span style={{ display: 'inline-block', width: '12px', borderTop: '2px solid #c8102e', marginRight: '4px', verticalAlign: 'middle' }} />Daily usage</span>
                <span><span style={{ display: 'inline-block', width: '12px', borderTop: '2px dashed #999', marginRight: '4px', verticalAlign: 'middle' }} />Avg ({avg.toFixed(2)} ea/day)</span>
            </div>
            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px', fontStyle: 'italic' }}>
                Illustrative — reconstructed from average usage and trend, not a logged daily history.
            </p>
        </div>
    );
}

function Inventory({ allParts, predictionsReady }) {
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [criticalityFilter, setCriticalityFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    // Looked up from allParts (not stored as its own copy) so that once predictions finish loading
    // in the background, an already-open drawer picks up the real numbers automatically.
    const selectedPart = selectedId ? allParts.find((p) => p.productId === selectedId) : null;
    const hasPrediction = Boolean(selectedPart?.stockPrediction && selectedPart?.leadTimePrediction);

    const categories = [...new Set(allParts.map((p) => p.category))];
    // Fixed importance order (not alphabetical — alphabetically "Low" sorts before "Medium").
    const criticalityRank = { High: 1, Medium: 2, Low: 3 };
    const criticalities = ['High', 'Medium', 'Low'].filter((c) => allParts.some((p) => p.criticality === c));

    const filteredParts = allParts.filter((part) => {
        const matchesSearch = part.productName.toLowerCase().includes(searchText.toLowerCase()) || part.productId.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = !categoryFilter || part.category === categoryFilter;
        const matchesCriticality = !criticalityFilter || part.criticality === criticalityFilter;
        const matchesStatus = !statusFilter || part.status === statusFilter;
        return matchesSearch && matchesCategory && matchesCriticality && matchesStatus;
    });

    const sortString = (field) => (a, b) => String(a[field]).localeCompare(String(b[field]));
    const sortNumber = (field) => (a, b) => (a[field] ?? 0) - (b[field] ?? 0);
    // Sort by real urgency (the same gap used for status/color everywhere else), not alphabetically —
    // alphabetical would put Critical/Healthy/Low Stock in a meaningless order.
    const sortStatus = (a, b) => (a.gap ?? a.daysRemaining ?? 0) - (b.gap ?? b.daysRemaining ?? 0);

    const columns = [
        { field: 'productId', header: 'Part ID', sortable: true, sorter: sortString('productId') },
        { field: 'productName', header: 'Name', sortable: true, sorter: sortString('productName') },
        { field: 'category', header: 'Category', sortable: true, sorter: sortString('category') },
        { field: 'criticality', header: 'Criticality', sortable: true, sorter: (a, b) => (criticalityRank[a.criticality] ?? 99) - (criticalityRank[b.criticality] ?? 99) },
        { field: 'stockQuantity', header: 'Stock', sortable: true, sorter: sortNumber('stockQuantity') },
        { field: 'status', header: 'Status', sortable: true, sorter: sortStatus, html: (row) => `<tk-badge label="${row.status}" variant="${statusVariant(row.status)}"></tk-badge>` },
    ];

    return (
        <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                <input placeholder="Search ID or name..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ flex: 1, padding: '8px' }} />
                <TkSelect placeholder="All Categories" options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))]} onTkChange={(e) => setCategoryFilter(e.detail?.value || null)} />
                <TkSelect placeholder="All Criticalities" options={[{ value: '', label: 'All Criticalities' }, ...criticalities.map((c) => ({ value: c, label: c }))]} onTkChange={(e) => setCriticalityFilter(e.detail?.value || null)} />
                <TkSelect placeholder="All Statuses" options={[{ value: '', label: 'All Statuses' }, { value: 'Healthy', label: 'Healthy' }, { value: 'Low Stock', label: 'Low Stock' }, { value: 'Critical', label: 'Critical' }]} onTkChange={(e) => setStatusFilter(e.detail?.value || null)} />
                <span style={{ color: '#888', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {filteredParts.length} / {allParts.length} parts{!predictionsReady && ' · loading ML predictions...'}
                </span>
            </div>

            <TkTable columns={columns} data={filteredParts} onTkRowClick={(e) => setSelectedId(e.detail.productId)} />

            <TkDrawer headerType="light" open={selectedPart !== null} onTkDrawerClose={() => setSelectedId(null)}>
                <div slot="content">
                    {selectedPart && (
                        <div>
                            {/* Styled directly (not via TkDrawer's built-in dark header) so we control the exact
                                THY-maroon background — the drawer's own "dark" header type is a fixed shadow-DOM
                                color we can't reliably override. */}
                            <div style={{ background: '#3a1013', color: '#fff', borderRadius: '10px', padding: '16px', margin: '-4px 0 16px' }}>
                                <div style={{ fontSize: '11px', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.75)' }}>{selectedPart.productId}</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 10px', color: '#fff' }}>{selectedPart.productName}</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <TkBadge label={selectedPart.status} variant={statusVariant(selectedPart.status)} type="filled" dot />
                                    <TkBadge label={selectedPart.criticality} type="filled" variant="neutral" />
                                    <TkBadge label={selectedPart.category} type="filled" variant="neutral" />
                                </div>
                            </div>

                            {hasPrediction ? (
                                <TkAlert variant={statusVariant(selectedPart.status)} type="filled" header={actionLabel[selectedPart.action]}
                                    message={`Runs out in ~${Math.round(selectedPart.stockPrediction.median_day)} days. Resupply ~${Math.round(selectedPart.leadTimePrediction.lead_time)} days.`} />
                            ) : (
                                <TkAlert variant="info" type="outlined" header="Loading prediction..." message="Fetching ML estimates." />
                            )}

                            <SectionLabel icon="▪">Stock Details</SectionLabel>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <StatCard label="On Hand" value={selectedPart.stockQuantity} unit="ea" />
                                <StatCard label="Avg Daily" value={selectedPart.avgDailyUsage.toFixed(2)} unit="ea/day" />
                                <StatCard label="Lead Time" value={hasPrediction ? Math.round(selectedPart.leadTimePrediction.lead_time) : '...'} unit="days" />
                            </div>

                            <SectionLabel icon="↘">ML Stockout Prediction</SectionLabel>
                            <TkCard>
                                {hasPrediction ? (
                                    <PredictionRangeBar
                                        earliest={selectedPart.stockPrediction.earliest_day}
                                        median={selectedPart.stockPrediction.median_day}
                                        latest={selectedPart.stockPrediction.latest_day}
                                        color={variantColor[selectedPart.status]}
                                    />
                                ) : <p>Loading...</p>}
                            </TkCard>

                            {selectedPart.leadTimePrediction?.delay_warning && (
                                <TkAlert variant="warning" type="outlined" header="Supplier Delay Risk" message="This supplier is predicted to deliver later than promised." style={{ marginTop: '12px' }} />
                            )}

                            <SectionLabel icon="⏱">14-Day Usage Trend</SectionLabel>
                            <TkCard>
                                <UsageTrendChart part={selectedPart} />
                            </TkCard>

                            <SectionLabel icon="▤">Part Information</SectionLabel>
                            <TkCard>
                                <InfoRow label="Part ID" value={selectedPart.productId} />
                                <InfoRow label="Category" value={selectedPart.category} />
                                <InfoRow label="Criticality" value={selectedPart.criticality} />
                                <InfoRow label="Status" value={selectedPart.status} valueColor={variantColor[selectedPart.status]} />
                                <InfoRow label="Supplier lead time" value={hasPrediction ? `${Math.round(selectedPart.leadTimePrediction.lead_time)} days` : '...'} />
                            </TkCard>

                            <TkButton
                                label={hasPrediction ? actionLabel[selectedPart.action] : 'Loading...'}
                                variant={statusVariant(selectedPart.status)}
                                fullWidth
                                style={{ marginTop: '16px' }}
                            />
                        </div>
                    )}
                </div>
            </TkDrawer>
        </div>
    );
}

export default Inventory;
