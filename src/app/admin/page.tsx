'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalInvested: 0,
    totalWithdrawn: 0,
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      // Fetch all data needed for stats in parallel
      const [usersRes, depositsRes, perfumesRes, withdrawalsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('pending_deposits').select('amount_usd').eq('status', 'success'),
        supabase.from('user_perfumes').select('price_paid, is_granted').eq('is_granted', false),
        supabase.from('withdrawal_requests').select('amount_usd').in('status', ['approved', 'completed'])
      ]);

      // Calculate Totals
      const totalDeposits = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount_usd), 0) || 0;
      const totalInvested = perfumesRes.data?.reduce((sum, p) => sum + Number(p.price_paid), 0) || 0;
      const totalWithdrawn = withdrawalsRes.data?.reduce((sum, w) => sum + Number(w.amount_usd), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalDeposits,
        totalInvested,
        totalWithdrawn
      });

      setLoading(false);
    };
    checkAdminAndFetchStats();
  }, [router, supabase]);

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading Dashboard...</div>;

  const menuItems = [
    { title: 'Manage Users', desc: 'Ban, grant perfumes, edit balances', icon: '👥', path: '/admin/users' },
    { title: 'Withdrawals', desc: 'Approve or reject user payouts', icon: '💸', path: '/admin/withdrawals' },
    { title: 'Gift Codes', desc: 'Generate promo codes for users', icon: '🎁', path: '/admin/gift-codes' },
    { title: 'Daily Payouts', desc: 'Process daily earnings & unlock cycles', icon: '⚙️', path: '/admin/payouts' },
    { title: 'Manage Perfumes', desc: 'Edit prices, daily income & cycles', icon: '🧴', path: '/admin/perfumes' },
  ];

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '20px' }}>Management</h1>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
        
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Total Users</p>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{stats.totalUsers.toLocaleString()}</h3>
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Total Deposits</p>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#D4AF37' }}>{stats.totalDeposits.toLocaleString()} UGX</h3>
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Total Invested</p>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#D4AF37' }}>{stats.totalInvested.toLocaleString()} UGX</h3>
        </div>

        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Total Withdrawn</p>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ff4444' }}>{stats.totalWithdrawn.toLocaleString()} UGX</h3>
        </div>

      </div>

      {/* MENU LINKS */}
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