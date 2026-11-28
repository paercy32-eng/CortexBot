'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Withdraw() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const [hasActivePerfume, setHasActivePerfume] = useState(false);
  const [hasBoundAccount, setHasBoundAccount] = useState(false);
  
  // Rules state
  const [dailyWithdraws, setDailyWithdraws] = useState(0);
  const [isWithinHours, setIsWithinHours] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Check Time Window (6 AM to 5 PM local time)
      const currentHour = new Date().getHours();
      const withinHours = currentHour >= 6 && currentHour < 17;
      setIsWithinHours(withinHours);

      // 2. Fetch Profile (Withdrawable Balance & Bound Account)
      const { data: profile } = await supabase
        .from('profiles')
        .select('withdrawable_balance, bound_name, bound_phone')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setBalance(Number(profile.withdrawable_balance || 0));
        if (profile.bound_phone) {
            setPhone(profile.bound_phone);
            setHasBoundAccount(true);
        } else {
            setHasBoundAccount(false);
        }
      }

      // 3. Check for Active Perfumes
      const { count: perfumeCount } = await supabase
        .from('user_perfumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      setHasActivePerfume((perfumeCount || 0) > 0);

      // 4. Check Daily Withdraw Limit (Max 2 per day)
      const todayStr = new Date().toISOString().split('T')[0];
      
      const { count: withdrawCount } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${todayStr}T00:00:00Z`);
      
      setDailyWithdraws(withdrawCount || 0);

      setFetching(false);
    };
    fetchUserData();
  }, [router, supabase]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    // Validations
    if (!hasBoundAccount) {
      setMessage('You must bind an account in Settings before withdrawing.');
      return;
    }
    if (!hasActivePerfume) {
      setMessage('You must have an active fragrance to withdraw funds.');
      return;
    }
    if (!isWithinHours) {
      setMessage('Withdrawals are only allowed between 6:00 AM and 5:00 PM.');
      return;
    }
    if (dailyWithdraws >= 2) {
      setMessage('You have reached your daily limit of 2 withdrawals.');
      return;
    }

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 5000) {
      setMessage('Minimum withdrawal is 5,000 UGX.');
      return;
    }
    if (withdrawAmount > balance) {
      setMessage('Insufficient withdrawable balance.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      // Deduct from WITHDRAWABLE balance
      const newBalance = balance - withdrawAmount;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ withdrawable_balance: newBalance })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Insert Withdrawal Request
      const { error: reqError } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        amount_usd: withdrawAmount,
        mobile_money_number: phone,
        status: 'pending'
      });

      if (reqError) throw reqError;

      // Show Success
      setBalance(newBalance);
      setDailyWithdraws(prev => prev + 1);
      setIsSuccess(true);
      setMessage('Withdrawal request submitted successfully! Admin will process it shortly.');
      setAmount('');
      
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', marginTop: '50px', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  const parsedAmount = Number(amount) || 0;
  const fee = parsedAmount * 0.15;
  const netPayout = parsedAmount - fee;

  const isLocked = !hasBoundAccount || !hasActivePerfume || !isWithinHours || dailyWithdraws >= 2;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '1.5rem', cursor: 'pointer', marginRight: '15px' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#D4AF37' }}>Withdraw Funds</h1>
      </div>

      {/* Available Balance Display */}
      <div style={{ background: '#111', border: '1px solid #D4AF37', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Available Withdrawable Balance</p>
        <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: '#D4AF37' }}>{balance.toLocaleString()} UGX</h2>
      </div>

      {/* Warnings */}
      {!hasBoundAccount && (
        <div style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid #ff4444', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#ff4444', fontSize: '0.9rem', fontWeight: 'bold' }}>⚠️ Account Not Bound</p>
          <p style={{ margin: '5px 0 0 0', color: '#ccc', fontSize: '0.8rem' }}>You must bind your mobile money account in Settings to withdraw.</p>
          <button onClick={() => router.push('/my/settings')} style={{ marginTop: '10px', background: '#ff4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Go to Settings</button>
        </div>
      )}

      {hasBoundAccount && !hasActivePerfume && (
        <div style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid #ff4444', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#ff4444', fontSize: '0.9rem', fontWeight: 'bold' }}>⚠️ Withdrawal Locked</p>
          <p style={{ margin: '5px 0 0 0', color: '#ccc', fontSize: '0.8rem' }}>You must purchase an active fragrance to enable withdrawals.</p>
        </div>
      )}

      {hasBoundAccount && hasActivePerfume && !isWithinHours && (
        <div style={{ background: 'rgba(255, 165, 0, 0.1)', border: '1px solid #ffa500', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#ffa500', fontSize: '0.9rem', fontWeight: 'bold' }}>⏰ Closed</p>
          <p style={{ margin: '5px 0 0 0', color: '#ccc', fontSize: '0.8rem' }}>Withdrawals are only available from 6:00 AM to 5:00 PM.</p>
        </div>
      )}

      {hasBoundAccount && hasActivePerfume && isWithinHours && dailyWithdraws >= 2 && (
        <div style={{ background: 'rgba(255, 0, 0, 0.1)', border: '1px solid #ff4444', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#ff4444', fontSize: '0.9rem', fontWeight: 'bold' }}>Limit Reached</p>
          <p style={{ margin: '5px 0 0 0', color: '#ccc', fontSize: '0.8rem' }}>You can only make 2 withdrawals per day.</p>
        </div>
      )}

      {isSuccess ? (
        <div style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid #D4AF37', borderRadius: '12px', padding: '30px 20px', textAlign: 'center' }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" style={{ margin: '0 auto 15px auto' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#D4AF37', marginBottom: '10px' }}>Request Submitted</h2>
          <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' }}>{message}</p>
          <button onClick={() => router.push('/')} style={{ background: '#D4AF37', color: '#000', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            Back to Home
          </button>
        </div>
      ) : (
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '20px', opacity: isLocked ? 0.5 : 1 }}>
          <form onSubmit={handleWithdraw}>
            
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Amount (UGX)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder=""
              required
              disabled={isLocked}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '5px', outline: 'none' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 15px 0' }}>Minimum withdrawal: 5,000 UGX (Max 2 per day)</p>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Phone Number to Receive Funds</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=""
              required
              disabled={isLocked}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px', outline: 'none' }}
            />

            {/* Fee Breakdown */}
            {parsedAmount > 0 && (
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '15px', marginBottom: '20px', border: '1px dashed #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>
                  <span>Requested Amount:</span>
                  <span>{parsedAmount.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ff4444', marginBottom: '8px' }}>
                  <span>Fee (15%):</span>
                  <span>-{fee.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#D4AF37', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '8px' }}>
                  <span>You Receive:</span>
                  <span>{netPayout.toLocaleString()} UGX</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || isLocked}
              style={{ 
                width: '100%', padding: '15px', borderRadius: '8px', border: 'none', 
                background: '#D4AF37', color: '#000', fontWeight: 'bold', fontSize: '1rem', 
                cursor: (loading || isLocked) ? 'not-allowed' : 'pointer', 
                opacity: (loading || isLocked) ? 0.5 : 1
              }}
            >
              {loading ? 'Processing...' : 'Confirm Withdrawal'}
            </button>
          </form>

          {/* Status Message */}
          {message && !isSuccess && (
            <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid #ff4444', color: '#ff4444', fontSize: '0.9rem', textAlign: 'center' }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}