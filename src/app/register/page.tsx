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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (password !== confirmPassword) throw new Error("Passwords do not match.");

      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 1. Call our new API route instead of Supabase directly
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          password, 
          inviteCode,
          referralCode: generatedCode
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");

      setSuccessMsg('Account created! Logging you in...');
      
      // 2. Sign in the user normally
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: `${phone}@cortexbot.com`,
        password: password,
      });

      if (signInError) throw signInError;

      router.push('/');
      router.refresh();
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', color: 'white' }}>
      
      <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', margin: '10px 0' }}>Welcome</h1>
      </div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={{ position: 'relative' }}>
          <select style={{ width: '100%', padding: '18px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none', appearance: 'none' }}>
            <option style={{ color: 'black' }}>🇺🇬 Uganda (+256)</option>
          </select>
        </div>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>📱</span>
          <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔑</span>
          <input type="password" placeholder="Set Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔑</span>
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔗</span>
          <input type="text" placeholder="Invitation Code (Optional)" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        {errorMsg && <div style={{ color: '#ff4444', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>}
        {successMsg && <div style={{ color: '#00ff00', fontSize: '0.85rem', textAlign: 'center' }}>{successMsg}</div>}

        <button type="submit" disabled={loading} style={{ padding: '18px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: '#00bfff', fontSize: '1.1rem', fontFamily: 'Playfair Display, serif', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)', marginTop: '10px' }}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '0.9rem', color: '#ccc' }}>
        <Link href="/login" style={{ color: '#ccc', textDecoration: 'none' }}>‹ Login</Link>
      </div>
    </div>
  );
}
