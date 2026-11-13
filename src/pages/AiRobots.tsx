import React from 'react';
import { ROBOTS } from '../data/robots';

export const AiRobots = () => {
  return (
    <div className="page-container">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', overflowX: 'auto' }}>
        <span className="neon-text" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>All</span>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Star Wars</span>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Pop Culture</span>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Real World</span>
      </div>

      {/* Robot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {ROBOTS.map((bot) => (
          <div key={bot.id} className="card" style={{ padding: '15px' }}>
            {/* Placeholder for the Robot Image */}
            <div style={{ height: '100px', background: '#1a263b', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2rem' }}>🤖</span>
            </div>
            
            <h4 className="neon-text" style={{ margin: '0 0 5px 0', fontSize: '0.9rem' }}>{bot.name}</h4>
            <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 10px 0' }}>{bot.model}</p>
            
            <p style={{ fontSize: '0.65rem', color: '#666', margin: 0 }}>PRICE</p>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{bot.price.toLocaleString()}.00</h5>

            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0a0a0a', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', marginBottom: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>DAILY</div>
                <div className="neon-text" style={{ fontWeight: 'bold' }}>{bot.dailyIncome.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>CYCLE</div>
                <div className="neon-text" style={{ fontWeight: 'bold' }}>{bot.cycleDays} days</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>TOTAL</div>
                <div className="neon-text" style={{ fontWeight: 'bold' }}>{bot.totalIncome.toLocaleString()}</div>
              </div>
            </div>

            <button style={{ width: '100%', background: 'var(--neon-blue)', color: '#000', fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>
              Buy AI robot
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
