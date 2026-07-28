import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Overview from './Overview';
import Inventory from './Inventory';
import { getPartStatus, classifyFromGap } from './statusUtils';
import AuthScreen from './AuthScreen';
import Users from './Users';
import OrderHistory from './OrderHistory';
import ChangePassword from './ChangePassword';
import PartDrawer from './PartDrawer';

const API_BASE = 'http://localhost:5005';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [allParts, setAllParts] = useState([]);
  const [predictionsReady, setPredictionsReady] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mro-theme') || 'light');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const selectedPart = selectedPartId ? allParts.find((p) => p.productId === selectedPartId) : null;

  // [data-theme=dark] is the same attribute Takeoff UI's own dark theme listens for, so this one
  // line re-themes every Tk component too, not just our custom-styled surfaces.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mro-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  // Reset the active tab on every login/logout — otherwise a user could log out while on a
  // restricted tab like "users", and an unauthorized user logging in next would land there too.
  useEffect(() => {
    setActiveTab('overview');
  }, [currentUser]);

  // Close any open drawer when switching tabs — otherwise you could land on "Users" with the
  // previous tab's drawer (and the resulting blur) still showing.
  useEffect(() => {
    setSelectedPartId(null);
  }, [activeTab]);

  useEffect(() => {
    fetch(`${API_BASE}/api/parts`)
      .then((res) => res.json())
      .then((parts) => {
        // Show something instantly with the cheap heuristic, then upgrade to real ML predictions below.
        setAllParts(parts.map((p) => ({ ...p, ...getPartStatus(p) })));
        loadPredictions(parts);
      });
  }, []);

  async function loadPredictions(parts) {
    const enriched = await Promise.all(
      parts.map(async (part) => {
        try {
          const [stockPrediction, leadTimePrediction] = await Promise.all([
            fetch(`${API_BASE}/api/parts/${part.productId}/prediction`).then((r) => r.json()),
            fetch(`${API_BASE}/api/orders/${part.productId}/prediction`).then((r) => r.json()),
          ]);
          const gap = stockPrediction.median_day - leadTimePrediction.lead_time;
          return { ...part, stockPrediction, leadTimePrediction, gap, ...classifyFromGap(gap) };
        } catch {
          return { ...part, ...getPartStatus(part) }; // keep heuristic if this one part's prediction fails
        }
      })
    );
    setAllParts(enriched);
    setPredictionsReady(true);
  }

  async function handlePlaceOrder(part) {
  await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: part.productId,
      orderedBy: currentUser.id,
      predictedStockoutDay: part.stockPrediction?.median_day ?? part.daysRemaining,
      predictedLeadTimeDays: part.leadTimePrediction?.lead_time ?? 0,
    }),
  });
}

  const criticalCount = allParts.filter((p) => p.status === 'Critical').length;

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div style={{ background: 'var(--page-bg)', minHeight: '100vh' }}>
      <div className={`page-content${selectedPart ? ' blurred' : ''}`}>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} theme={theme} onToggleTheme={toggleTheme} user={currentUser} onLogout={() => setCurrentUser(null)} onChangePassword={() => setActiveTab('change-password')} />
        <main style={{ padding: '24px' }}>
          {activeTab === 'overview' && <Overview allParts={allParts} predictionsReady={predictionsReady} onSelectPart={setSelectedPartId} />}
          {activeTab === 'inventory' && <Inventory allParts={allParts} predictionsReady={predictionsReady} onSelectPart={setSelectedPartId} />}
          {activeTab === 'users' && <Users currentUser={currentUser} />}
          {activeTab === 'history' && <OrderHistory />}
          {activeTab === 'change-password' && <ChangePassword currentUser={currentUser} />}
        </main>
      </div>

      <PartDrawer part={selectedPart} onClose={() => setSelectedPartId(null)} onPlaceOrder={handlePlaceOrder} />
    </div>
  );
}

export default App;