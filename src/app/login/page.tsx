'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Assuming your Supabase auth uses phone@cortexbot.com as the email
      const { error } = await supabase.auth.signInWithPassword({
        email: `${phone}@cortexbot.com`,
        password: password,
      });

      if (error) throw error;

      // If successful, go to home page
      router.push('/');
      router.refresh();
      
    } catch (error: any) {
      setErrorMsg(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', color: 'white' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: '50px', marginBottom: '40px' }}>
        <h2 style={{ color: '#00bfff', fontSize: '1rem', fontWeight: 'bold', letterSpacing: '2px', margin: 0 }}>CORTEXBOT</h2>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', margin: '10px 0' }}>Welcome</h1>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Phone Input */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>📱</span>
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }}
          />
        </div>

        {/* Password Input */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔑</span>
          <input 
            type="password" 
            placeholder="Login Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }}
          />
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{ color: '#ff4444', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>
        )}

        {/* Login Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '18px', 
            backgroundColor: 'transparent', 
            border: '1px solid #00bfff', 
            borderRadius: '30px', 
            color: '#00bfff', 
            fontSize: '1.1rem', 
            fontFamily: 'Playfair Display, serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)',
            marginTop: '10px'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Footer Links */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '0.9rem', color: '#ccc' }}>
        <Link href="/register" style={{ color: '#ccc', textDecoration: 'none' }}>‹ Register</Link>
        <span style={{ cursor: 'pointer' }}>Forgot your password?</span>
      </div>
    </div>
  );
}
