'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ users: 0, deposited: 0, invested: 0, withdrawn: 0 });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert('Access Denied. You are not an admin.');
        router.push('/');
        return;
      }

      // Fetch KPIs
      // 1. Total Users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Total Deposited (Verified only)
      const { data: deposits } = await supabase
        .from('pending_deposits')
        .select('amount_usd')
        .eq('status', 'verified');
      
      const totalDep = deposits?.reduce((sum, d) => sum + Number(d.amount_usd), 0) || 0;

      // 3. Total Invested (Robots bought with REAL money only)
      const { data: robots } = await supabase
        .from('user_robots')
        .select('price_paid')
        .eq('is_granted', false); 
      
      const totalInv = robots?.reduce((sum, r) => sum + Number(r.price_paid), 0) || 0;

      // 4. Total Withdrawn (Approved only)
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount_usd')
        .eq('status', 'approved');
      
      const totalWithd = withdrawals?.reduce((sum, w) => sum + Number(w.amount_usd), 0) || 0;

      setKpis({ 
        users: userCount || 0, 
        deposited: totalDep, 
        invested: totalInv,
        withdrawn: totalWithd
      });
      
      setLoading(false);
    };

    checkAdminAndFetchData();
  }, [router, supabase]);

  if (loading) return <div style={{ color: '#00ff41', padding: '50px', textAlign: 'center', backgroundColor: '#050505', minHeight: '100vh' }}>Loading Admin Panel...</div>;

  const menuItems = [
    { name: 'Manage Users', path: '/admin/users', icon: '👥', desc: 'Ban, grant robots, edit balances' },
    { name: 'Withdrawals', path: '/admin/withdrawals', icon: '💸', desc: 'Approve or reject user payouts' },
    { name: 'Gift Codes', path: '/admin/giftcodes', icon: '🎁', desc: 'Generate promo codes for users' },
    { name: 'AI Payouts', path: '/admin/ai-payouts', icon: '🤖', desc: 'Process daily earnings & unlock cycles' },
    { name: 'Manage Robots', path: '/admin/robots', icon: '⚙️', desc: 'Edit prices, daily income & cycles' },
  ];

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#00ff41', margin: 0 }}>Admin Panel</h1>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>Exit</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
        
        {/* Full width Total Users */}
        <div style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '20px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#559955', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users</p>
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#fff' }}>{kpis.users}</h2>
        </div>

        {/* 2-column grid for Deposited & Invested */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '20px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#559955', textTransform: 'uppercase' }}>Total Deposited</p>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00ff41' }}>{kpis.deposited.toLocaleString()} UGX</h3>
          </div>
          
          <div style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '20px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#559955', textTransform: 'uppercase' }}>Total Invested</p>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00bfff' }}>{kpis.invested.toLocaleString()} UGX</h3>
          </div>
        </div>

        {/* Full width Total Withdrawn */}
        <div style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '20px' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#559955', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Withdrawn (Approved)</p>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#ffa500' }}>{kpis.withdrawn.toLocaleString()} UGX</h2>
        </div>

      </div>

      {/* Menu Grid */}
      <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: '#fff', marginBottom: '15px' }}>Management</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {menuItems.map((item) => (
          <Link key={item.name} href={item.path} style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '15px', 
              background: '#0a1c0a', border: '1px solid #00ff41', 
              borderRadius: '12px', padding: '20px' 
            }}>
              <div style={{ fontSize: '2rem' }}>{item.icon}</div>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '1.1rem' }}>{item.name}</h3>
                <p style={{ margin: 0, color: '#559955', fontSize: '0.8rem' }}>{item.desc}</p>
              </div>
              <div style={{ marginLeft: 'auto', color: '#00ff41' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
