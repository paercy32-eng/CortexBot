'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyProfile() {
  const [phone, setPhone] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [vipLevel, setVipLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, balance_usd, withdrawable_balance, locked_ai_income, vip_level')
        .eq('id', user.id)
        .single();

      if (profile) {
        setPhone(profile.phone || 'No phone');
        
        const total = Number(profile.balance_usd || 0) + Number(profile.withdrawable_balance || 0) + Number(profile.locked_ai_income || 0);
        setWalletBalance(total);
        setWithdrawableBalance(Number(profile.withdrawable_balance || 0));
        setVipLevel(Number(profile.vip_level || 0));
      }
      setLoading(false);
    };
    fetchUserData();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [router, supabase]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("To install the app, tap the browser menu (three dots) and select 'Add to Home Screen' or 'Install App'.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  const actions = [
    { name: 'Deposit', path: '/deposit', icon: <path d="M12 5v14M5 12l7 7 7-7"/> },
    { name: 'Withdraw', path: '/withdraw', icon: <path d="M12 19V5M5 12l7-7 7 7"/> },
    { name: 'Card', path: '/my/card', icon: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></> },
    { name: 'Bill', path: '/my/history', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> },
    { name: 'Invite', path: '/my/invite', icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></> },
    { name: 'My team', path: '/my/team', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
    { name: 'Best Sellers', path: '/best-sellers', icon: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/> },
    // UPDATED TELEGRAM LINK HERE
    { name: 'Join Group', path: 'https://t.me/+NSlZ5Wdk93I2NTA0', icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
    { name: 'Gift code', path: '/my/giftcode', icon: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></> },
    { name: 'Raffle', path: '/raffle', icon: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="8.5" cy="8.5" r="1.5"/><circle cx="15.5" cy="15.5" r="1.5"/><circle cx="15.5" cy="8.5" r="1.5"/><circle cx="8.5" cy="15.5" r="1.5"/></> },
    { name: 'Download', path: 'download_app', icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></> },
    { name: 'Manager', path: '/chats', icon: <><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></> },
    { name: 'Settings', path: '/my/settings', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
  ];

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '40px' }}>
      
      <div style={{ padding: '20px 15px' }}>
        
        {/* User Info & Avatar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', marginTop: '10px' }}>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', margin: '0 0 5px 0', color: '#D4AF37' }}>Welcome to Fragrance Files</h2>
            <p style={{ margin: 0, fontSize: '1rem', color: '#ccc' }}>{phone}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid #D4AF37', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111', marginBottom: '8px' }}>
               <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span style={{ fontSize: '0.8rem', background: '#111', border: '1px solid #D4AF37', padding: '3px 10px', borderRadius: '12px', color: '#D4AF37', fontWeight: 'bold' }}>
              VIP {vipLevel}
            </span>
          </div>
        </div>

        {/* Balances */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          
          <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)', border: '1px solid #D4AF37', borderRadius: '12px', padding: '20px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontFamily: 'Playfair Display, serif', color: '#aaa' }}>Wallet</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1a1a1a, #0a0a0a)', border: '1px solid #D4AF37', borderRadius: '12px', padding: '20px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', fontFamily: 'Playfair Display, serif', color: '#aaa' }}>Withdrawable</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{withdrawableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
            </div>
          </div>

        </div>

        {/* Action Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px 10px' }}>
          {actions.map((action) => {
            if (action.path === 'download_app') {
              return (
                <div key={action.name} onClick={handleInstallClick} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', border: '1px solid #333', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 10px rgba(212, 175, 55, 0.05) inset' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{action.icon}</svg>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#ccc', textAlign: 'center' }}>{action.name}</span>
                </div>
              );
            }

            if (action.path.startsWith('http')) {
              return (
                <a key={action.name} href={action.path} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', border: '1px solid #333', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 10px rgba(212, 175, 55, 0.05) inset' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{action.icon}</svg>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#ccc', textAlign: 'center' }}>{action.name}</span>
                </a>
              );
            }

            return (
              <Link key={action.name} href={action.path} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '12px', border: '1px solid #333', background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 10px rgba(212, 175, 55, 0.05) inset' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{action.icon}</svg>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#ccc', textAlign: 'center' }}>{action.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Log Out Button */}
        <button 
          onClick={handleLogout}
          style={{ width: '100%', marginTop: '40px', padding: '15px', background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
        >
          Log Out
        </button>

      </div>
    </div>
  );
}