import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Overview from './Overview';
import Inventory from './Inventory';
import { getPartStatus, classifyFromGap } from './statusUtils';

const API_BASE = 'http://localhost:5005';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [allParts, setAllParts] = useState([]);
  const [predictionsReady, setPredictionsReady] = useState(false);

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

  const criticalCount = allParts.filter((p) => p.status === 'Critical').length;

  return (
    <div style={{ background: '#f4f5f7', minHeight: '100vh' }}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} criticalCount={criticalCount} />
      <main style={{ padding: '24px' }}>
        {activeTab === 'overview'
          ? <Overview allParts={allParts} predictionsReady={predictionsReady} />
          : <Inventory allParts={allParts} predictionsReady={predictionsReady} />}
      </main>
    </div>
  );
}

export default App;