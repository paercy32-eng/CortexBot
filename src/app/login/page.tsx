'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Assuming your login system uses the phone number + domain trick
    const email = `${phone}@cortexbot.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', color: '#F5F5F5' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1rem', color: '#D4AF37', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
          Fragrance Files
        </h2>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', margin: 0, color: '#fff' }}>
          Welcome
        </h1>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ position: 'relative' }}>
          <input 
            type="tel" 
            placeholder="Phone Number" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ width: '100%', padding: '18px 20px', borderRadius: '30px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <input 
            type="password" 
            placeholder="Login Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '18px 20px', borderRadius: '30px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', outline: 'none' }}
          />
        </div>

        {error && <p style={{ color: '#ff4444', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '18px', borderRadius: '30px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 'bold', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '0.9rem' }}>
        <Link href="/register" style={{ color: '#A0A0A0', textDecoration: 'none' }}>← Register</Link>
        <Link href="/forgot-password" style={{ color: '#A0A0A0', textDecoration: 'none' }}>Forgot your password?</Link>
      </div>

    </div>
  );
}