import { useState, useEffect } from 'react';
import { ROBOTS } from '../data/robots'; // This imports your 18 robots
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/router'; // Use 'next/navigation' if you get an error here

export default function AiRobots() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 1. Fetch the logged-in user and their real balance from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd')
        .eq('id', user.id)
        .single();
      
      if (profile) setBalance(Number(profile.balance_usd));
    };
    fetchUser();
  }, []);

  // 2. Handle the purchase logic
  const handleBuyRobot = async (robot: any) => {
    if (!user) return;

    if (balance < robot.price) {
      alert("Insufficient balance! Please deposit funds first.");
      return;
    }

    if (!confirm(`Are you sure you want to buy ${robot.name} for ${robot.price.toLocaleString()} UGX?`)) return;

    setProcessingId(robot.id);

    try {
      // Deduct balance from user profile
      const newBalance = balance - robot.price;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_usd: newBalance })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Insert the purchase into the user_robots table
      const { error: purchaseError } = await supabase
        .from('user_robots')
        .insert({
          user_id: user.id,
          robot_name: robot.name,
          price_paid: robot.price,
          daily_income: robot.daily,
          cycle_days: robot.cycle,
          status: 'active',
          last_payout: new Date().toISOString()
        });

      if (purchaseError) throw purchaseError;

      // Update local state so the balance changes on screen instantly
      setBalance(newBalance);
      alert(`Successfully purchased ${robot.name}! Your income will start in 24 hours.`);

    } catch (error: any) {
      alert("Error buying robot: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      
      {/* Header & Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>AI Robots</h1>
        <div style={{ background: '#121c2d', padding: '8px 12px', borderRadius: '8px', border: '1px solid #00bfff' }}>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>BALANCE: </span>
          <span style={{ fontWeight: 'bold', color: '#00bfff' }}>{balance.toLocaleString()} UGX</span>
        </div>
      </div>

      {/* Tabs (Visual only for now) */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', overflowX: 'auto' }}>
        <span style={{ color: '#00bfff', fontWeight: 'bold', whiteSpace: 'nowrap', borderBottom: '2px solid #00bfff', paddingBottom: '9px' }}>All</span>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Star Wars</span>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Pop Culture</span>
        <span style={{ color: '#666', whiteSpace: 'nowrap' }}>Real World</span>
      </div>

      {/* Robot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {ROBOTS.map((bot: any) => (
          <div key={bot.id} style={{ background: '#121c2d', border: '1px solid rgba(0, 191, 255, 0.2)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Image */}
            <div style={{ height: '100px', background: '#000', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
              <img src={bot.image} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            {/* Details */}
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#00bfff', fontFamily: 'Playfair Display, serif' }}>{bot.name}</h4>
            <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 10px 0' }}>{bot.model}</p>
            
            <p style={{ fontSize: '0.65rem', color: '#666', margin: 0 }}>PRICE</p>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{bot.price.toLocaleString()}.00</h5>

            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0a0a0a', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', marginBottom: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>DAILY</div>
                <div style={{ color: '#00bfff', fontWeight: 'bold' }}>{bot.daily.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>CYCLE</div>
                <div style={{ color: '#00bfff', fontWeight: 'bold' }}>{bot.cycle}d</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>TOTAL</div>
                <div style={{ color: '#00bfff', fontWeight: 'bold' }}>{bot.total.toLocaleString()}</div>
              </div>
            </div>

            {/* Buy Button */}
            <button 
              onClick={() => handleBuyRobot(bot)}
              disabled={processingId === bot.id}
              style={{ 
                marginTop: 'auto', width: '100%', background: '#00bfff', color: '#000', 
                fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', 
                cursor: 'pointer', opacity: processingId === bot.id ? 0.5 : 1
              }}
            >
              {processingId === bot.id ? 'Processing...' : 'Buy AI robot'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
