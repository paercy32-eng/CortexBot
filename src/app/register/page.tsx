'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const email = `${phone}@cortexbot.com`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If registration is successful, create the profile
    if (authData.user) {
      const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 🚨 SET WELCOME BONUS TO 1000
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        phone: phone,
        balance_usd: 1000, // Welcome Bonus
        withdrawable_balance: 0,
        vip_level: 0,
        referral_code: newReferralCode,
        referred_by: inviteCode || null,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
      } else {
        // 🚨 LOG THE WELCOME BONUS TRANSACTION
        await supabase.from('transactions').insert({
          user_id: authData.user.id,
          type: 'BONUS',
          amount_usd: 1000,
          status: 'completed'
        });

        router.push('/');
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', color: '#F5F5F5' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', margin: 0, color: '#fff' }}>
          Register
        </h1>
        <p style={{ color: '#A0A0A0', marginTop: '10px' }}>Join Fragrance Files</p>
      </div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', background: '#111', border: '1px solid #333', borderRadius: '30px', padding: '0 20px' }}>
          <span style={{ marginRight: '10px' }}>🇺🇬 +256</span>
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ width: '100%', padding: '18px 0', background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', outline: 'none' }}
          />
        </div>

        <input 
          type="password" 
          placeholder="Set Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '18px 20px', borderRadius: '30px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}
        />

        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '18px 20px', borderRadius: '30px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}
        />

        <input 
          type="text" 
          placeholder="Invitation Code (Optional)" 
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          style={{ width: '100%', padding: '18px 20px', borderRadius: '30px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}
        />

        {error && <p style={{ color: '#ff4444', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '18px', borderRadius: '30px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

      </form>

      <div style={{ marginTop: '30px', fontSize: '0.9rem', textAlign: 'center' }}>
        <Link href="/login" style={{ color: '#A0A0A0', textDecoration: 'none' }}>← Login</Link>
      </div>

    </div>
  );
}