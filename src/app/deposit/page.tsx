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

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/tavupay-verify?reference=${transactionId}`, {
        method: 'GET',
      });
      
      const data = await res.json();
      
      if (data.ok && (data.status === 'successful' || data.status === 'SUCCEEDED')) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setVerifying(false);
        setIsSuccess(true);
        setMessage('Deposit successful! Your balance has been updated.');
        
        // 🚨 Force a router refresh to clear the "Pending" state in history
        router.refresh(); 
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 500) {
      setMessage('Minimum deposit is 500 UGX.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in first.");

      const orderId = crypto.randomUUID(); 

      // The API route will handle adding the 2% fee before sending to TavuPay
      const res = await fetch('/api/tavupay-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: depositAmount, phone: phone, orderId: orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");

      const tavuPayTxId = data.reference; 

      // 🚨 SAVE THE BASE AMOUNT (e.g., 20000) TO DATABASE
      const { error: dbError } = await supabase.from('pending_deposits').insert({
        user_id: user.id,
        txid: tavuPayTxId, 
        amount_usd: depositAmount, // This is the original amount, not the one with the 2% fee
        status: 'pending'
      });

      if (dbError) throw dbError;

      setMessage('USSD Prompt sent! Please enter your PIN on your phone.');
      setVerifying(true);
      setLoading(false);

      checkPaymentStatus(tavuPayTxId);
      pollingRef.current = setInterval(() => checkPaymentStatus(tavuPayTxId), 5000);

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: 'white' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '2px solid #D4AF37', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', marginBottom: '10px', color: '#D4AF37' }}>Deposit Successful</h2>
        <p style={{ color: '#aaa', marginBottom: '30px', textAlign: 'center' }}>{message}</p>
        <button 
          onClick={() => router.push('/')}
          style={{ background: '#D4AF37', color: '#000', padding: '15px 40px', borderRadius: '30px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#D4AF37', fontSize: '1.5rem', cursor: 'pointer', marginRight: '15px' }}>
          ←
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#D4AF37' }}>Deposit Funds</h1>
      </div>

      <div style={{ background: '#111', border: '1px solid #222', borderRadius: '15px', padding: '20px' }}>
        <form onSubmit={handleDeposit}>
          
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Amount (UGX)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder=""
            min="500"
            required
            disabled={verifying}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '5px', outline: 'none' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 20px 0' }}>Minimum deposit: 500 UGX (A 2% network fee applies)</p>

          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Phone Number (MTN or Airtel)</label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder=""
            required
            disabled={verifying}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px', outline: 'none' }}
          />

          <button 
            type="submit" 
            disabled={loading || verifying}
            style={{ 
              width: '100%', padding: '15px', borderRadius: '8px', border: 'none', 
              background: '#D4AF37', color: '#000', fontWeight: 'bold', fontSize: '1rem', 
              cursor: (loading || verifying) ? 'not-allowed' : 'pointer', opacity: (loading || verifying) ? 0.6 : 1
            }}
          >
            {loading ? 'Sending Prompt...' : verifying ? 'Waiting for PIN...' : 'Deposit Now'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', background: message.includes('Error') || message.includes('Minimum') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(212, 175, 55, 0.1)', border: `1px solid ${message.includes('Error') || message.includes('Minimum') ? '#ff4444' : '#D4AF37'}`, color: message.includes('Error') || message.includes('Minimum') ? '#ff4444' : '#D4AF37', fontSize: '0.9rem', textAlign: 'center' }}>
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