'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const supabase = createClient();
  const router = useRouter();

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      // 2. Generate a unique reference for this transaction
      const reference = crypto.randomUUID();

      // 3. Send request to our PesaJet API route
      const res = await fetch('/api/pesajet-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: Number(amount), 
          phone: phone,
          reference: reference 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      // 4. Save the pending deposit in Supabase
      const { error: dbError } = await supabase.from('pending_deposits').insert({
        user_id: user.id,
        txid: reference, // We use the reference to match the webhook later
        amount_usd: Number(amount),
        status: 'pending'
      });

      if (dbError) throw dbError;

      // 5. Success message
      setMessage('USSD Prompt sent! Please check your phone to enter your PIN.');
      setAmount('');
      
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#000', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#00bfff', fontSize: '1.5rem', cursor: 'pointer', marginRight: '15px' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0 }}>Deposit Funds</h1>
      </div>

      {/* Form Container */}
      <div style={{ background: '#121c2d', border: '1px solid rgba(0, 191, 255, 0.3)', borderRadius: '15px', padding: '20px' }}>
        <form onSubmit={handleDeposit}>
          
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Amount (UGX)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 20000"
            required
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px' }}
          />

          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Phone Number (MTN or Airtel)</label>
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
            {loading ? 'Processing...' : 'Deposit Now'}
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
