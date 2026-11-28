'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      setLoading(false);
    };
    checkAdmin();
  }, [router, supabase]);

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  const menuItems = [
    { title: 'Manage Users', desc: 'Ban, grant perfumes, edit balances', icon: '👥', path: '/admin/users' },
    { title: 'Withdrawals', desc: 'Approve or reject user payouts', icon: '💸', path: '/admin/withdrawals' },
    { title: 'Gift Codes', desc: 'Generate promo codes for users', icon: '🎁', path: '/admin/gift-codes' },
    { title: 'Daily Payouts', desc: 'Process daily earnings & unlock cycles', icon: '⚙️', path: '/admin/payouts' },
    { title: 'Manage Perfumes', desc: 'Edit prices, daily income & cycles', icon: '🧴', path: '/admin/perfumes' }, // Changed
  ];

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '30px' }}>Management</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {menuItems.map((item, index) => (
          <Link key={index} href={item.path} style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#111', 
              border: '1px solid #D4AF37', 
              borderRadius: '16px', 
              padding: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.05)'
            }}>
              <div style={{ fontSize: '2rem', width: '50px', textAlign: 'center' }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#fff' }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{item.desc}</p>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}