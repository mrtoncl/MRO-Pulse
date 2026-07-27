import { useState } from 'react';
import { TkTable, TkSelect } from '@takeoff-ui/react';
import { statusVariant } from './statusUtils';

function Inventory({ allParts, predictionsReady, onSelectPart }) {
    const [searchText, setSearchText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [criticalityFilter, setCriticalityFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);

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
                <input placeholder="Search ID or name..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
                    style={{ flex: 1, padding: '8px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }} />
                <TkSelect placeholder="All Categories" options={[{ value: '', label: 'All Categories' }, ...categories.map((c) => ({ value: c, label: c }))]} onTkChange={(e) => setCategoryFilter(e.detail?.value || null)} />
                <TkSelect placeholder="All Criticalities" options={[{ value: '', label: 'All Criticalities' }, ...criticalities.map((c) => ({ value: c, label: c }))]} onTkChange={(e) => setCriticalityFilter(e.detail?.value || null)} />
                <TkSelect placeholder="All Statuses" options={[{ value: '', label: 'All Statuses' }, { value: 'Healthy', label: 'Healthy' }, { value: 'Low Stock', label: 'Low Stock' }, { value: 'Critical', label: 'Critical' }]} onTkChange={(e) => setStatusFilter(e.detail?.value || null)} />
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {filteredParts.length} / {allParts.length} parts{!predictionsReady && ' · loading ML predictions...'}
                </span>
            </div>

            {/* Takeoff's built-in row hover uses --background-lightest, which is nearly the same as the
                table's own white background — barely visible. Overriding it here (scoped to just this
                table, via the CSS custom property, which does cross the shadow-DOM boundary) makes hover
                actually noticeable, plus an explicit pointer cursor since data rows don't set one by default. */}
            <TkTable columns={columns} data={filteredParts} onTkRowClick={(e) => onSelectPart(e.detail.productId)}
                style={{ cursor: 'pointer', '--background-lightest': 'var(--hover-grey)' }} />
        </div>
    );
}

export default Inventory;
