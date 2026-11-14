'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Withdraw() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  // Fetch the user's current balance and bound account details
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, bound_name, bound_phone')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setBalance(Number(profile.balance_usd || 0));
        if (profile.bound_phone) setPhone(profile.bound_phone);
      }
      setFetching(false);
    };
    fetchUserData();
  }, [router, supabase]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    const withdrawAmount = Number(amount);
    
    // 1. Validation
    if (!withdrawAmount || withdrawAmount < 10000) {
      setMessage('Minimum withdrawal is 10,000 UGX.');
      return;
    }
    if (withdrawAmount > balance) {
      setMessage('Insufficient balance.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      // 2. Deduct the balance immediately
      const newBalance = balance - withdrawAmount;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_usd: newBalance })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Insert the withdrawal request into the database
      // We insert the gross amount requested. The admin will see the 15% fee.
      const { error: reqError } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        amount_usd: withdrawAmount,
        mobile_money_number: phone,
        status: 'pending'
      });

      if (reqError) throw reqError;

      // 4. Show Success
      setBalance(newBalance);
      setIsSuccess(true);
      setMessage('Withdrawal request submitted successfully! Admin will process it shortly.');
      setAmount('');
      
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ color: 'white', padding: '20px', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  // Calculate fee and net payout for display
  const parsedAmount = Number(amount) || 0;
  const fee = parsedAmount * 0.15;
  const netPayout = parsedAmount - fee;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#000', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#00bfff', fontSize: '1.5rem', cursor: 'pointer', marginRight: '15px' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0 }}>Withdraw Funds</h1>
      </div>

      {/* Available Balance Display */}
      <div style={{ background: '#121c2d', border: '1px solid #00bfff', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Available Balance</p>
        <h2 style={{ margin: '5px 0 0 0', fontSize: '2rem', color: '#00bfff' }}>{balance.toLocaleString()} UGX</h2>
      </div>

      {isSuccess ? (
        <div style={{ background: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00', borderRadius: '12px', padding: '30px 20px', textAlign: 'center' }}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" style={{ margin: '0 auto 15px auto' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00ff00', marginBottom: '10px' }}>Request Submitted</h2>
          <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '20px' }}>{message}</p>
          <button onClick={() => router.push('/')} style={{ background: '#00bfff', color: '#000', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
            Back to Home
          </button>
        </div>
      ) : (
        <div style={{ background: '#121c2d', border: '1px solid #333', borderRadius: '15px', padding: '20px' }}>
          <form onSubmit={handleWithdraw}>
            
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Amount (UGX)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min 10,000"
              required
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '5px' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 15px 0' }}>Minimum withdrawal: 10,000 UGX</p>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Phone Number to Receive Funds</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0771234567"
              required
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px' }}
            />

            {/* Fee Breakdown */}
            {parsedAmount > 0 && (
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '15px', marginBottom: '20px', border: '1px dashed #444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>
                  <span>Requested Amount:</span>
                  <span>{parsedAmount.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ff4444', marginBottom: '8px' }}>
                  <span>Fee (15%):</span>
                  <span>-{fee.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#00ff00', fontWeight: 'bold', borderTop: '1px solid #333', paddingTop: '8px' }}>
                  <span>You Receive:</span>
                  <span>{netPayout.toLocaleString()} UGX</span>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', padding: '15px', borderRadius: '8px', border: 'none', 
                background: '#00bfff', color: '#000', fontWeight: 'bold', fontSize: '1rem', 
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1
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
