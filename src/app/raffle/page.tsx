'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ROBOTS } from '@/data/robots';

export default function Raffle() {
  const [user, setUser] = useState<any>(null);
  const [chances, setChances] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonRobot, setWonRobot] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  // Let's use the top 9 most expensive robots for the Raffle grid
  const raffleRobots = ROBOTS.slice(9, 18); 

  useEffect(() => {
    const fetchRaffleData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch user chances
      const { data: profile } = await supabase
        .from('profiles')
        .select('raffle_chances')
        .eq('id', user.id)
        .single();

      if (profile) {
        setChances(profile.raffle_chances || 0);
      }

      // Fetch raffle history
      const { data: hist } = await supabase
        .from('raffle_history')
        .select('*')
        .eq('user_id', user.id)
        .order('won_at', { ascending: false });

      if (hist) {
        setHistory(hist);
      }
      
      setLoading(false);
    };
    fetchRaffleData();
  }, [router, supabase]);

  const handleSpin = async () => {
    if (chances <= 0 || spinning) return;
    setSpinning(true);
    setWonRobot(null);

    try {
      // 1. Pick a random robot
      const randomIndex = Math.floor(Math.random() * raffleRobots.length);
      const prize = raffleRobots[randomIndex];

      // 2. Deduct 1 chance from user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ raffle_chances: chances - 1 })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Add the won robot to user_robots so it generates income
      const { error: robotError } = await supabase
        .from('user_robots')
        .insert({
          user_id: user.id,
          robot_name: prize.name,
          price_paid: prize.price, // Value of the won robot
          daily_income: prize.daily,
          cycle_days: prize.cycle,
          status: 'active',
          last_payout: new Date().toISOString()
        });

      if (robotError) throw robotError;

      // 4. Log the win in raffle_history
      const { error: historyError } = await supabase
        .from('raffle_history')
        .insert({
          user_id: user.id,
          robot_name: prize.name
        });

      if (historyError) throw historyError;

      // 5. Update UI
      setChances(prev => prev - 1);
      setHistory(prev => [{ robot_name: prize.name, won_at: new Date().toISOString() }, ...prev]);
      setWonRobot(prize);

    } catch (error: any) {
      alert("Error spinning: " + error.message);
    } finally {
      setSpinning(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', paddingBottom: '100px' }}>
      
      {/* Top Banner Notice */}
      <div style={{ padding: '15px' }}>
        <div style={{ border: '1px solid #00bfff', borderRadius: '12px', padding: '15px', textAlign: 'center', backgroundColor: 'rgba(0, 191, 255, 0.05)' }}>
          <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1rem', lineHeight: '1.5' }}>
            Raffle is available to members who deposit <strong style={{color: '#00bfff'}}>UGX 500,000</strong> or more, or buy a machine priced <strong style={{color: '#00bfff'}}>UGX 500,000</strong> or more.
          </p>
        </div>
      </div>

      {/* Robot Grid */}
      <div style={{ padding: '0 15px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {raffleRobots.map((bot) => (
          <div key={bot.id} style={{ 
            background: 'url("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=200") center/cover', 
            border: '1px solid #333', borderRadius: '8px', height: '90px', position: 'relative', overflow: 'hidden' 
          }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 5px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Playfair Display, serif' }}>{bot.name}</span>
              <span style={{ fontSize: '0.6rem', color: '#888' }}>Nova</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ready Button */}
      <div style={{ padding: '20px 15px' }}>
        <button 
          onClick={handleSpin}
          disabled={chances <= 0 || spinning}
          style={{ 
            width: '100%', padding: '20px', backgroundColor: 'transparent', 
            border: '1px solid #00bfff', borderRadius: '12px', color: 'white',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
            cursor: (chances <= 0 || spinning) ? 'not-allowed' : 'pointer',
            opacity: (chances <= 0 || spinning) ? 0.5 : 1
          }}
        >
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
            {spinning ? 'Spinning...' : `Ready: ${chances}`}
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00bfff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
        </button>
      </div>

      {/* My Records */}
      <div style={{ padding: '0 15px', marginTop: '10px' }}>
        <div style={{ border: '1px solid #00bfff', borderRadius: '12px', padding: '20px', minHeight: '150px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#00bfff', textAlign: 'center', marginTop: 0, fontSize: '1.5rem' }}>My records</h2>
          {history.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem', marginTop: '20px' }}>No raffle records yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {history.map((record, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{record.robot_name}</span>
                  <span style={{ color: '#00bfff', fontSize: '0.8rem' }}>Won</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raffle Transactions text */}
      <div style={{ padding: '20px 15px', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#00bfff', fontSize: '1.2rem', marginBottom: '10px', textAlign: 'left' }}>Raffle transactions</h3>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>No raffle transactions yet.</p>
        <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '15px', lineHeight: '1.5' }}>
          Tap any card to spin. Each spin costs 1 chance and reveals a random prize. 
          Earnings are credited instantly to your available balance. 
          Earn 1 chance for every approved deposit of 500,000 UGX or more.
        </p>
      </div>

      {/* Win Modal */}
      {wonRobot && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#121c2d', border: '1px solid #00bfff', borderRadius: '16px', padding: '30px 20px', textAlign: 'center', width: '100%', maxWidth: '350px' }}>
            <h2 style={{ color: '#00bfff', fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', margin: '0 0 10px 0' }}>Congratulations!</h2>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>You just won:</p>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 20px 0', fontFamily: 'Playfair Display, serif' }}>{wonRobot.name}</h3>
            <p style={{ color: '#00ff00', marginBottom: '20px' }}>+{wonRobot.daily} UGX / day</p>
            <button 
              onClick={() => setWonRobot(null)}
              style={{ background: '#00bfff', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              Collect & Close
            </button>
          </div>
        </div>
      )}

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
                      }
