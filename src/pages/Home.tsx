import React from 'react';
import { StatCard } from '../components/StatCard';

export const Home = () => {
  return (
    <div className="page-container">
      {/* Banner */}
      <div className="banner" style={{ height: '180px', borderRadius: '15px', backgroundImage: 'url("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800")', backgroundSize: 'cover', position: 'relative', marginBottom: '20px' }}>
        <div style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 2 }}>
          <h3 className="neon-text" style={{ margin: 0 }}>Cortex Neural Matrix</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>Smart AI mining machines for daily income.</p>
        </div>
      </div>

      {/* 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <StatCard value="0.00" label="Deposit details" />
        <StatCard value="0.00" label="Withdraw details" />
        <StatCard value="0.00" label="AI Income" />
        <StatCard value="0.00" label="Today's earnings" />
      </div>

      {/* 3x1 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <StatCard value="0" label="Invite Count" />
        <StatCard value="0" label="Team Count" />
        <StatCard value="0.00" label="Team income" />
      </div>
    </div>
  );
};
