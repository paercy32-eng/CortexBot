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
  const [fetching, setFetching] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  // Fetch the user's current balance when the page loads
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd')
        .eq('id', user.id)
        .single();
      
      if (profile) setBalance(Number(profile.balance_usd));
      setFetching(false);
    };
    fetchBalance();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const withdrawAmount = Number(amount);
      
      // Validation
      if (withdrawAmount < 3000) throw new Error("Minimum withdrawal is 3,000 UGX.");
      if (withdrawAmount > balance) throw new Error("Insufficient balance.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      // 1. Deduct the balance immediately
      const newBalance = balance - withdrawAmount;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance_usd: newBalance })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Insert the withdrawal request into the database
      const { error: reqError } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        amount_usd: withdrawAmount,
        mobile_money_number: phone,
        status: 'pending'
      });

      if (reqError) throw reqError;

      // 3. Success
      setMessage('Withdrawal request submitted! Admin will process it shortly.');
      setBalance(newBalance);
      setAmount('');
      setPhone('');
      
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={{ padding: '20px', color: 'white' }}>Loading...</div>;

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
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>AVAILABLE BALANCE</p>
        <h2 style={{ margin: '5px 0 0 0', fontSize: '1.8rem', color: '#00bfff' }}>{balance.toLocaleString()} UGX</h2>
      </div>

      {/* Form Container */}
      <div style={{ background: '#121c2d', border: '1px solid rgba(0, 191, 255, 0.3)', borderRadius: '15px', padding: '20px' }}>
        <form onSubmit={handleWithdraw}>
          
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Amount (UGX)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Min 3000"
            required
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px' }}
          />

          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Phone Number to Receive Funds</label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0771234567"
            required
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px' }}
          />

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
        {message && (
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: message.includes('Error') ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', color: message.includes('Error') ? '#ff4444' : '#00ff00', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
