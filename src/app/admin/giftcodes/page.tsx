'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminGiftCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchCodes = async () => {
    const { data } = await supabase
      .from('gift_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setCodes(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      fetchCodes();
    };
    checkAdmin();
  }, [router, supabase]);

  const generateCode = async () => {
    setGenerating(true);
    try {
      // Generate a random 8-character code
      const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Calculate expiry (10 minutes from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60000).toISOString();

      const { error } = await supabase.from('gift_codes').insert({
        code: newCode,
        amount: 10000,
        expires_at: expiresAt,
        is_used: false
      });

      if (error) throw error;
      
      alert(`Code ${newCode} generated! Valid for 10 minutes.`);
      fetchCodes();

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', padding: '20px 15px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>Gift Codes</h1>
      </div>

      <button 
        onClick={generateCode}
        disabled={generating}
        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', background: '#00bfff', color: '#000', fontWeight: 'bold', fontSize: '1rem', cursor: generating ? 'not-allowed' : 'pointer', marginBottom: '30px' }}
      >
        {generating ? 'Generating...' : 'Generate New Code (10,000 UGX Base)'}
      </button>

      <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '15px' }}>Recent Codes</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {codes.map((code) => {
          const isExpired = new Date(code.expires_at) < new Date();
          const status = code.is_used ? 'Used' : isExpired ? 'Expired' : 'Active';
          const statusColor = code.is_used ? '#ff4444' : isExpired ? '#888' : '#00ff00';

          return (
            <div key={code.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121c2d', border: '1px solid #333', padding: '15px', borderRadius: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: '#fff', letterSpacing: '2px' }}>{code.code}</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                  Expires: {new Date(code.expires_at).toLocaleTimeString()}
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: statusColor }}>
                {status.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
