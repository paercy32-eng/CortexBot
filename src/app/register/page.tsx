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

      // Call our secure API route
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
      
      // Sign in the user normally
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
        
        {/* Country Code Dropdown */}
        <div style={{ position: 'relative' }}>
          <select style={{ width: '100%', padding: '18px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none', appearance: 'none' }}>
            <option style={{ color: 'black' }}>🇺🇬 Uganda (+256)</option>
          </select>
          <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '16px', height: '16px', pointerEvents: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* Phone Input */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          </div>
          <input type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        {/* Password Input */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <input type="password" placeholder="Set Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        {/* Confirm Password Input */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }} />
        </div>

        {/* Invitation Code Input */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
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
