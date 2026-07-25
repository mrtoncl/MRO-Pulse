import { TkBadge } from '@takeoff-ui/react';

function Navbar({ activeTab, onTabChange, criticalCount }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const tabStyle = (tab) => ({
    background: activeTab === tab ? '#fff' : 'transparent',
    color: activeTab === tab ? '#3a1013' : '#b39a9c',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
  });

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#3a1013', borderBottom: '3px solid #c8102e' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>MRO-Pulse</span>
        <span style={{ color: '#b39a9c', fontSize: '13px' }}>MRO INVENTORY</span>
        <button onClick={() => onTabChange('overview')} style={tabStyle('overview')}>OVERVIEW</button>
        <button onClick={() => onTabChange('inventory')} style={tabStyle('inventory')}>INVENTORY</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <TkBadge label={`${criticalCount} CRITICAL`} variant="danger" />
        <span style={{ color: '#b39a9c', fontSize: '13px' }}>{dateLabel} · {timeLabel}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7a2a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
          MO
        </div>
      </div>
    </nav>
  );
}

export default Navbar;