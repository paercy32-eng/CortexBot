'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Deposit() {
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Clear the interval if the user leaves the page
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const checkPaymentStatus = async (reference: string) => {
    try {
      const res = await fetch('/api/pesajet-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Success! Stop polling and show success screen
        if (pollingRef.current) clearInterval(pollingRef.current);
        setVerifying(false);
        setIsSuccess(true);
        setMessage('Deposit successful! Your balance has been updated.');
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    // 🚨 CHECK MINIMUM DEPOSIT
    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 20000) {
      setMessage('Minimum deposit is 20,000 UGX.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      const reference = crypto.randomUUID();

      // 1. Send request to PesaJet API
      const res = await fetch('/api/pesajet-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount, phone: phone, reference: reference }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      // 2. Save the pending deposit in Supabase
      const { error: dbError } = await supabase.from('pending_deposits').insert({
        user_id: user.id,
        txid: reference,
        amount_usd: depositAmount,
        status: 'pending'
      });

      if (dbError) throw dbError;

      // 3. Start Polling!
      setMessage('USSD Prompt sent! Please enter your PIN on your phone.');
      setVerifying(true);
      setLoading(false);

      // Check immediately, then every 5 seconds
      checkPaymentStatus(reference);
      pollingRef.current = setInterval(() => checkPaymentStatus(reference), 5000);

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0, 255, 0, 0.1)', border: '2px solid #00ff00', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', marginBottom: '10px' }}>Deposit Successful</h2>
        <p style={{ color: '#888', marginBottom: '30px', textAlign: 'center' }}>{message}</p>
        <button 
          onClick={() => router.push('/')}
          style={{ background: '#00bfff', color: '#000', padding: '15px 40px', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
        >
          Return Home
        </button>
      </div>
    );
  }

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
            placeholder="Min 20,000"
            min="20000"
            required
            disabled={verifying}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '5px' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 20px 0' }}>Minimum deposit: 20,000 UGX</p>

          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Phone Number (MTN or Airtel)</label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0771234567"
            required
            disabled={verifying}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px' }}
          />

          <button 
            type="submit" 
            disabled={loading || verifying}
            style={{ 
              width: '100%', padding: '15px', borderRadius: '8px', border: 'none', 
              background: '#00bfff', color: '#000', fontWeight: 'bold', fontSize: '1rem', 
              cursor: (loading || verifying) ? 'not-allowed' : 'pointer', opacity: (loading || verifying) ? 0.6 : 1
            }}
          >
            {loading ? 'Sending Prompt...' : verifying ? 'Waiting for PIN...' : 'Deposit Now'}
          </button>
        </form>

        {/* Status Message */}
        {message && (
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: message.includes('Error') || message.includes('Minimum') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 191, 255, 0.1)', border: `1px solid ${message.includes('Error') || message.includes('Minimum') ? '#ff4444' : '#00bfff'}`, color: message.includes('Error') || message.includes('Minimum') ? '#ff4444' : '#00bfff', fontSize: '0.9rem', textAlign: 'center' }}>
            {verifying && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
              </div>
            )}
            {message}
          </div>
        )}
      </div>
      
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
              }
