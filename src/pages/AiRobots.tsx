import { useState } from 'react';
import { ROBOTS } from '../data/robots';
import { createClient } from '@/utils/supabase/client';

export default function AiRobots() {
  const supabase = createClient();
  const [processing, setProcessing] = useState(false);

  const handleBuyRobot = async (robot: any) => {
    if (!confirm(`Are you sure you want to buy ${robot.name} for ${robot.price} UGX?`)) return;
    
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("Please login first.");
      return;
    }

    // 1. Fetch current user balance
    const { data: profile } = await supabase.from('profiles').select('balance_usd').eq('id', user.id).single();
    
    if (Number(profile.balance_usd) < robot.price) {
      alert("Insufficient balance. Please deposit first.");
      setProcessing(false);
      return;
    }

    try {
      // 2. Deduct balance
      const newBalance = Number(profile.balance_usd) - robot.price;
      await supabase.from('profiles').update({ balance_usd: newBalance }).eq('id', user.id);

      // 3. Insert into user_robots table (create this table in Supabase)
      await supabase.from('user_robots').insert({
        user_id: user.id,
        robot_name: robot.name,
        price_paid: robot.price,
        daily_income: robot.dailyIncome,
        cycle_days: robot.cycleDays,
        status: 'active',
        last_payout: new Date().toISOString()
      });

      alert(`${robot.name} purchased successfully!`);
      window.location.reload();
    } catch (error: any) {
      alert("Error purchasing robot: " + error.message);
    }
    setProcessing(false);
  };

  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {ROBOTS.map((bot) => (
          <div key={bot.id} className="card" style={{ padding: '15px' }}>
            {/* ... Image and Text ... */}
            <button 
              style={{ width: '100%', background: 'var(--neon-blue)', color: '#000', fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              onClick={() => handleBuyRobot(bot)}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Buy AI robot'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
