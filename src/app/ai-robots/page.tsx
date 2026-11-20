'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AiRobots() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [robots, setRobots] = useState<any[]>([]);
  const [userRobots, setUserRobots] = useState<any[]>([]);
  
  // Hidden balance states for purchase logic
  const [depositBalance, setDepositBalance] = useState<number>(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  
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

      // 1. Fetch balances
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, withdrawable_balance')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setDepositBalance(Number(profile.balance_usd || 0));
        setWithdrawableBalance(Number(profile.withdrawable_balance || 0));
      }

      // 2. Fetch user's owned robots (to show "Active" or "Locked in")
      const { data: owned } = await supabase
        .from('user_robots')
        .select('robot_name, status')
        .eq('user_id', user.id);
      
      if (owned) setUserRobots(owned);

      // 3. Fetch all live robots from the database
      const { data: dbRobots } = await supabase
        .from('robots')
        .select('*')
        .order('price', { ascending: true });

      if (dbRobots) setRobots(dbRobots);
      
      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const handleBuyRobot = async (robot: any) => {
    if (!user) return;

    // Check if they already own this robot
    const alreadyOwned = userRobots.some(r => r.robot_name === robot.name && r.status === 'active');
    if (alreadyOwned) return;

    let isFirstPurchase = userRobots.length === 0;
    let currentBalanceToUse = isFirstPurchase ? depositBalance : withdrawableBalance;
    let balanceName = isFirstPurchase ? 'Approved Deposit Balance' : 'Withdrawable Balance';

    if (currentBalanceToUse < robot.price) {
      alert(`Insufficient ${balanceName}!\n\nYou need ${robot.price.toLocaleString()} UGX to proceed.\n\n${isFirstPurchase ? 'Your first purchase must be fully funded by approved deposits.' : 'You cannot use locked AI income or deposit funds for subsequent purchases.'}`);
      return;
    }

    const actionText = robot.plan_type === 'daily' ? 'buy' : 'lock in';
    if (!confirm(`Are you sure you want to ${actionText} ${robot.name} for ${robot.price.toLocaleString()} UGX?`)) return;

    setProcessingId(robot.id);

    try {
      let updates: any = {};
      
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

      // Grant the Robot
      const { error: purchaseError } = await supabase
        .from('user_robots')
        .insert({
          user_id: user.id,
          robot_name: robot.name,
          price_paid: robot.price,
          daily_income: robot.daily,
          cycle_days: robot.cycle,
          status: 'active',
          plan_type: robot.plan_type, // 🚨 Passing the plan type
          last_payout: new Date().toISOString()
        });

      if (purchaseError) throw purchaseError;

      // Add to local state so button changes to "Active" instantly
      setUserRobots(prev => [...prev, { robot_name: robot.name, status: 'active' }]);
      alert(`Successfully ${actionText === 'buy' ? 'activated' : 'locked in'} ${robot.name}!`);

    } catch (error: any) {
      alert("Error processing request: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRobots = robots.filter(bot => activeTab === 'All' || bot.category === activeTab);

  if (loading) return <div style={{ color: '#00ff41', padding: '50px', textAlign: 'center', backgroundColor: '#050505', minHeight: '100vh' }}>Loading Robots...</div>;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#00ff41', margin: 0 }}>AI Robots</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #1a3c1a', paddingBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['All', 'Star Wars', 'Pop Culture', 'Real World'].map((tab) => (
          <span 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              color: activeTab === tab ? '#00ff41' : '#559955', 
              fontWeight: activeTab === tab ? 'bold' : 'normal', 
              whiteSpace: 'nowrap', 
              borderBottom: activeTab === tab ? '2px solid #00ff41' : 'none', 
              paddingBottom: '9px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Robot List (Vertical Layout) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {filteredRobots.map((bot: any) => {
          const ownedRobot = userRobots.find(r => r.robot_name === bot.name && r.status === 'active');
          const isOwned = !!ownedRobot;

          return (
            <div key={bot.id} style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '16px', padding: '15px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
              
              {/* Large Image */}
              <div style={{ height: '200px', background: '#000', borderRadius: '12px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                <img src={bot.image} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Plan Type Badge */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: bot.plan_type === 'daily' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 165, 0, 0.2)', border: `1px solid ${bot.plan_type === 'daily' ? '#00ff41' : '#ffa500'}`, color: bot.plan_type === 'daily' ? '#00ff41' : '#ffa500', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                  {bot.plan_type === 'daily' ? 'Daily Plan' : 'Locked Plan'}
                </div>
              </div>
              
              {/* Title & Model */}
              <h4 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#00ff41', fontFamily: 'Playfair Display, serif' }}>{bot.name}</h4>
              <p style={{ fontSize: '0.85rem', color: '#559955', margin: '0 0 15px 0' }}>{bot.model}</p>
              
              {/* Detailed Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', background: '#000', padding: '15px 10px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Price</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{Number(bot.price).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Daily</div>
                  <div style={{ fontSize: '0.9rem', color: '#00ff41', fontWeight: 'bold' }}>{Number(bot.daily).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Cycle</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{bot.cycle} Days</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontSize: '0.9rem', color: '#00ff41', fontWeight: 'bold' }}>{Number(bot.total).toLocaleString()}</div>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handleBuyRobot(bot)}
                disabled={processingId === bot.id || isOwned}
                style={{ 
                  width: '100%', background: isOwned ? '#1a3c1a' : '#00ff41', 
                  color: isOwned ? '#00ff41' : '#000', fontWeight: 'bold', 
                  padding: '15px', borderRadius: '10px', border: isOwned ? '1px solid #00ff41' : 'none', 
                  cursor: (processingId === bot.id || isOwned) ? 'not-allowed' : 'pointer', 
                  fontSize: '1.1rem',
                  transition: '0.2s'
                }}
              >
                {processingId === bot.id 
                  ? 'Processing...' 
                  : isOwned 
                    ? (bot.plan_type === 'daily' ? 'Active' : 'Locked in') 
                    : (bot.plan_type === 'daily' ? 'Buy' : 'Lock in')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
          }
