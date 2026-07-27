import { useState, useEffect } from 'react';
import { TkCard } from '@takeoff-ui/react';

const API_BASE = 'http://localhost:5005';

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/orders`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const filteredOrders = orders.filter((o) =>
    o.productId.toLowerCase().includes(searchText.toLowerCase()) ||
    o.orderedByName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <h2>Order History</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        {filteredOrders.length} / {orders.length} orders
      </p>
      <input
        placeholder="Search by product or ordered by..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
      />
      <TkCard>
        {loading ? (
          <p>Loading...</p>
        ) : filteredOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{orders.length === 0 ? 'No orders placed yet.' : 'No orders match your search.'}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Product</th>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Ordered By</th>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Est. Stockout</th>
                <th style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Lead Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{o.productId}</td>
                  <td style={{ padding: '10px', color: 'var(--text-primary)' }}>{o.orderedByName}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(o.orderedAt)}</td>
                  <td style={{ padding: '10px', color: 'var(--text-primary)' }}>~{Math.round(o.predictedStockoutDay)} days</td>
                  <td style={{ padding: '10px', color: 'var(--text-primary)' }}>~{Math.round(o.predictedLeadTimeDays)} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TkCard>
    </div>
  );
}

export default OrderHistory;
