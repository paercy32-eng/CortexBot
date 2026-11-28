'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function RedeemGiftCode() {
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const cleanCode = codeInput.trim().toUpperCase();
      if (!cleanCode) throw new Error("Please enter a code.");

      // 1. Find the code
      const { data: giftCode, error: fetchError } = await supabase
        .from('gift_codes')
        .select('*')
        .eq('code', cleanCode)
        .single();

      if (fetchError || !giftCode) throw new Error("Invalid gift code.");
      
      // 2. Validate it
      if (giftCode.is_used) throw new Error("This code has already been used.");
      if (new Date(giftCode.expires_at) < new Date()) throw new Error("This code has expired.");

      // 3. Generate random reward between 50 and 800
      const randomReward = Math.floor(Math.random() * (800 - 50 + 1)) + 50;

      // 4. Mark code as used
      const { error: updateError } = await supabase
        .from('gift_codes')
        .update({ is_used: true, used_by: user.id })
        .eq('id', giftCode.id);

      if (updateError) throw updateError;

      // 5. Add reward to user balance
      const { data: profile } = await supabase.from('profiles').select('balance_usd').eq('id', user.id).single();
      
      await supabase.from('profiles').update({
        balance_usd: Number(profile?.balance_usd || 0) + randomReward
      }).eq('id', user.id);

      // 6. Log transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'BONUS',
        amount_usd: randomReward,
        status: 'completed'
      });

      setMessage(`Success! You won ${randomReward} UGX. It has been added to your wallet.`);
      setIsSuccess(true);
      setCodeInput('');

    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '20px 15px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={() => router.push('/my')} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#D4AF37', margin: 0 }}>Redeem Gift Code</h1>
      </div>

      <div style={{ background: '#111', border: '1px solid #333', borderRadius: '15px', padding: '30px 20px', textAlign: 'center' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎁</div>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '10px' }}>Enter Promo Code</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '30px' }}>Codes expire after 10 minutes and give a random reward between 50 and 800 UGX.</p>

        <form onSubmit={handleRedeem}>
          <input 
            type="text" 
            placeholder="Enter code here..."
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #D4AF37', background: '#0a0a0a', color: '#fff', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px', outline: 'none' }}
          />

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Redeeming...' : 'Redeem Now'}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: isSuccess ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 0, 0, 0.1)', border: `1px solid ${isSuccess ? '#D4AF37' : '#ff4444'}`, color: isSuccess ? '#D4AF37' : '#ff4444', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}