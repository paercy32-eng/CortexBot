'use client';

import { useState, useEffect } from 'react';
import { ROBOTS } from '@/data/robots'; 
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AiRobots() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [depositBalance, setDepositBalance] = useState<number>(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  const [lockedIncome, setLockedIncome] = useState<number>(0);
  
  const [hasRobots, setHasRobots] = useState<boolean>(false); 
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch all three balances
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, withdrawable_balance, locked_ai_income')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setDepositBalance(Number(profile.balance_usd || 0));
        setWithdrawableBalance(Number(profile.withdrawable_balance || 0));
        setLockedIncome(Number(profile.locked_ai_income || 0));
      }

      // Check if the user already owns any robots
      const { count } = await supabase
        .from('user_robots')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHasRobots((count || 0) > 0);
    };
    fetchUser();
  }, [router, supabase]);

  const handleBuyRobot = async (robot: any) => {
    if (!user) return;

    let isFirstPurchase = !hasRobots;
    let currentBalanceToUse = isFirstPurchase ? depositBalance : withdrawableBalance;
    let balanceName = isFirstPurchase ? 'Approved Deposit Balance' : 'Withdrawable Balance';

    // 1. Check if they have enough in the correct bucket
    if (currentBalanceToUse < robot.price) {
      alert(`Insufficient ${balanceName}!\n\nYou need ${robot.price.toLocaleString()} UGX in your ${balanceName} to buy this robot.\n\n${isFirstPurchase ? 'Your first purchase must be fully funded by approved deposits.' : 'You cannot use locked AI income or deposit funds for subsequent purchases.'}`);
      return;
    }

    if (!confirm(`Are you sure you want to buy ${robot.name} for ${robot.price.toLocaleString()} UGX using your ${balanceName}?`)) return;

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
      alert(`Successfully purchased ${robot.name}! Your daily income will start accruing.`);

    } catch (error: any) {
      alert("Error buying robot: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      
      {/* Header & Balances */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>AI Robots</h1>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ background: '#121c2d', padding: '8px 12px', borderRadius: '8px', border: '1px solid #00ff00', flex: 1 }}>
            <span style={{ fontSize: '0.65rem', color: '#888', display: 'block' }}>DEPOSIT BALANCE (For 1st Buy)</span>
            <span style={{ fontWeight: 'bold', color: '#00ff00' }}>{depositBalance.toLocaleString()} UGX</span>
          </div>
          
          <div style={{ background: '#121c2d', padding: '8px 12px', borderRadius: '8px', border: '1px solid #00bfff', flex: 1 }}>
            <span style={{ fontSize: '0.65rem', color: '#888', display: 'block' }}>WITHDRAWABLE BALANCE</span>
            <span style={{ fontWeight: 'bold', color: '#00bfff' }}>{withdrawableBalance.toLocaleString()} UGX</span>
          </div>
        </div>

        {lockedIncome > 0 && (
          <div style={{ background: 'rgba(255, 165, 0, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ffa500', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#ffa500' }}>Locked AI Income: <strong>{lockedIncome.toLocaleString()} UGX</strong> (Unlocks after cycle ends)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
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
            
            <div style={{ height: '100px', background: '#000', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
              <img src={bot.image} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            
            <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#00bfff', fontFamily: 'Playfair Display, serif' }}>{bot.name}</h4>
            <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 10px 0' }}>{bot.model}</p>
            
            <p style={{ fontSize: '0.65rem', color: '#666', margin: 0 }}>PRICE</p>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>{bot.price.toLocaleString()}.00</h5>

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
