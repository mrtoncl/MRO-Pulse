import { useState, useRef, useEffect } from "react";

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

function Navbar({ activeTab, onTabChange, theme, onToggleTheme, user, onLogout, onChangePassword }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close the profile menu on any click outside it — otherwise the only way to dismiss it
    // was clicking the profile trigger again, which felt like a dead end.
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const now = new Date();
    const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const tabStyle = (tab) => ({
        background: activeTab === tab ? '#fff' : 'transparent',
        color: activeTab === tab ? '#3a1013' : 'rgba(255,255,255,0.85)',
        border: 'none',
        padding: '6px 14px',
        borderRadius: '4px',
        fontWeight: 'bold',
        fontSize: '13px',
        cursor: 'pointer',
    });

    return (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#c8102e', borderBottom: '3px solid #3a1013' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src="/tt-logo.png" alt="Turkish Technology" style={{ height: '26px', width: 'auto' }} />
                <span style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>MRO-Pulse</span>
                <button className="nav-tab" onClick={() => onTabChange('overview')} style={tabStyle('overview')}>OVERVIEW</button>
                <button className="nav-tab" onClick={() => onTabChange('inventory')} style={tabStyle('inventory')}>INVENTORY</button>
                <button className="nav-tab" onClick={() => onTabChange('history')} style={tabStyle('history')}>ORDER HISTORY</button>
                {user?.role === 'Admin' && (
                    <button className="nav-tab" onClick={() => onTabChange('users')} style={tabStyle('users')}>USERS</button>
                )}
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
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>{dateLabel} · {timeLabel}</span>
                <div style={{ position: 'relative' }} ref={menuRef}>
                    <div
                        className = "nav-tab"
                        onClick={() => setMenuOpen((open) => !open)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#7a2a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                            {user?.fullName?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ color: '#fff', fontSize: '13px' }}>{user?.fullName}</span>
                        <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {user?.role}
                        </span>
                    </div>
                    {menuOpen && (
                        <div style={{ position: 'absolute', top: '40px', right: 0, background: 'var(--card-bg)', borderRadius: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: '160px', zIndex: 10 }}>
                            <button
                                className="menu-item"
                                onClick={() => { setMenuOpen(false); onChangePassword(); }}
                                style={{ width: '100%', padding: '10px 14px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                            >
                                Change Password
                            </button>
                            <button
                                className="menu-item"
                                onClick={() => { setMenuOpen(false); onLogout(); }}
                                style={{ width: '100%', padding: '10px 14px', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                            >
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;