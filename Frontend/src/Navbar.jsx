// Simple line-art icons (currentColor) instead of emoji — emoji render with their own colors/style
// and look out of place next to the rest of the flat, minimal UI.
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function Navbar({ activeTab, onTabChange, theme, onToggleTheme }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
        <button className="nav-tab" onClick={() => onTabChange('overview')} style={tabStyle('overview')}>OVERVIEW</button>
        <button className="nav-tab" onClick={() => onTabChange('inventory')} style={tabStyle('inventory')}>INVENTORY</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="nav-tab"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <span style={{ color: '#b39a9c', fontSize: '13px' }}>{dateLabel} · {timeLabel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7a2a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
            MÖ
          </div>
          <span style={{ color: '#fff', fontSize: '13px' }}>M.E.Öncül</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;