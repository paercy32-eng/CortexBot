'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AiRobots() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [robots, setRobots] = useState<any[]>([]); // State for fetched robots
  
  // Hidden balance states for purchase logic
  const [depositBalance, setDepositBalance] = useState<number>(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  const [hasRobots, setHasRobots] = useState<boolean>(false); 
  
  const [activeTab, setActiveTab] = useState('All'); 
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 1. Fetch balances silently for the purchase logic
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, withdrawable_balance')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setDepositBalance(Number(profile.balance_usd || 0));
        setWithdrawableBalance(Number(profile.withdrawable_balance || 0));
      }

      // 2. Check if the user already owns any robots
      const { count } = await supabase
        .from('user_robots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHasRobots((count || 0) > 0);

      // 3. Fetch the live robots from the database
      const { data: dbRobots } = await supabase
        .from('robots')
        .select('*')
        .order('price', { ascending: true });

      if (dbRobots) {
        setRobots(dbRobots);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const handleBuyRobot = async (robot: any) => {
    if (!user) return;

    let isFirstPurchase = !hasRobots;
    let currentBalanceToUse = isFirstPurchase ? depositBalance : withdrawableBalance;
    let balanceName = isFirstPurchase ? 'Approved Deposit Balance' : 'Withdrawable Balance';

    // 1. Check if they have enough in the correct bucket
    if (currentBalanceToUse < robot.price) {
      alert(`Insufficient ${balanceName}!\n\nYou need ${robot.price.toLocaleString()} UGX in your ${balanceName} to lock this robot.\n\n${isFirstPurchase ? 'Your first purchase must be fully funded by approved deposits.' : 'You cannot use locked AI income or deposit funds for subsequent purchases.'}`);
      return;
    }

    if (!confirm(`Are you sure you want to lock in ${robot.name} for ${robot.price.toLocaleString()} UGX using your ${balanceName}?`)) return;

    setProcessingId(robot.id);

    try {
      let updates: any = {};
      
      // 2. Deduct from the correct bucket
      if (isFirstPurchase) {
        updates.balance_usd = depositBalance - robot.price;
        setDepositBalance(updates.balance_usd);
      } else {
        updates.withdrawable_balance = withdrawableBalance - robot.price;
        setWithdrawableBalance(updates.withdrawable_balance);
      }

      // Update Profile Balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Grant the Robot
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

      setHasRobots(true); // Unlock subsequent purchases
      alert(`Successfully locked in ${robot.name}! Your daily income will start accruing.`);

    } catch (error: any) {
      alert("Error locking in robot: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter robots based on the active tab
  const filteredRobots = robots.filter(bot => activeTab === 'All' || bot.category === activeTab);

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading Robots...</div>;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#00bfff', margin: 0 }}>AI Robots</h1>
      </div>

      {/* Functional Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['All', 'Star Wars', 'Pop Culture', 'Real World'].map((tab) => (
          <span 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              color: activeTab === tab ? '#00bfff' : '#666', 
              fontWeight: activeTab === tab ? 'bold' : 'normal', 
              whiteSpace: 'nowrap', 
              borderBottom: activeTab === tab ? '2px solid #00bfff' : 'none', 
              paddingBottom: '9px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Robot Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {filteredRobots.map((bot: any) => (
          <div key={bot.id} style={{ background: '#121c2d', border: '1px solid rgba(0, 191, 255, 0.2)', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ height: '100px', background: '#000', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
              <img src={bot.image} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#00bfff', fontFamily: 'Playfair Display, serif' }}>{bot.name}</h4>
            <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 10px 0' }}>{bot.model}</p>
            
            <p style={{ fontSize: '0.65rem', color: '#666', margin: 0 }}>PRICE</p>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{Number(bot.price).toLocaleString()}.00</h5>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0a0a0a', padding: '8px', borderRadius: '6px', fontSize: '0.7rem', marginBottom: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>DAILY</div>
                <div style={{ color: '#00bfff', fontWeight: 'bold' }}>{Number(bot.daily).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>CYCLE</div>
                <div style={{ color: '#00bfff', fontWeight: 'bold' }}>{bot.cycle}d</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#888' }}>TOTAL</div>
                <div style={{ color: '#00bfff', fontWeight: 'bold' }}>{Number(bot.total).toLocaleString()}</div>
              </div>
            </div>

            <button 
              onClick={() => handleBuyRobot(bot)}
              disabled={processingId === bot.id}
              style={{ 
                marginTop: 'auto', width: '100%', background: '#00bfff', color: '#000', 
                fontWeight: 'bold', padding: '10px', borderRadius: '6px', border: 'none', 
                cursor: 'pointer', opacity: processingId === bot.id ? 0.5 : 1
              }}
            >
              {processingId === bot.id ? 'Processing...' : 'Lock in'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
        }
