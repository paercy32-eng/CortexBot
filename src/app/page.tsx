'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; 
import { useRouter } from 'next/navigation'; 
import { ROBOTS } from '@/data/robots';

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    dailyAiIncome: 0,
    totalEarned: 0,
    teamSize: 0,
    invites: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter(); 

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // 🚨 PERFORMANCE FIX: Fetch everything in parallel instead of one by one
        const [profileRes, robotsRes, teamRes, inviteRes] = await Promise.all([
          supabase.from('profiles').select('full_name, balance_usd, withdrawable_balance, locked_ai_income, vip_level').eq('id', user.id).single(),
          supabase.from('user_robots').select('daily_income, cycle_days, created_at, status').eq('user_id', user.id).eq('status', 'active'),
          supabase.rpc('get_team_members', { p_user_id: user.id }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('referred_by', user.id)
        ]);

        if (profileRes.data) setProfile(profileRes.data);

        let dailyIncomeSum = 0;
        let totalEarnedSum = 0;

        if (robotsRes.data) {
          robotsRes.data.forEach(bot => {
            dailyIncomeSum += Number(bot.daily_income);
            const start = new Date(bot.created_at);
            const now = new Date();
            const daysElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const daysToCalculate = Math.min(daysElapsed, bot.cycle_days);
            if (daysToCalculate > 0) totalEarnedSum += daysToCalculate * Number(bot.daily_income);
          });
        }

        setStats({
          dailyAiIncome: dailyIncomeSum,
          totalEarned: totalEarnedSum,
          teamSize: teamRes.data ? teamRes.data.length : 0,
          invites: inviteRes.count || 0
        });

      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050505', color: '#00ff41' }}>
        <svg className="spinner" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <style>{`.spinner { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totalWallet = Number(profile?.balance_usd || 0) + Number(profile?.withdrawable_balance || 0) + Number(profile?.locked_ai_income || 0);
  const featuredRobots = ROBOTS.slice(0, 5);

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white', paddingBottom: '80px', overflowX: 'hidden' }}>
      
      {/* Ticker */}
      <div style={{ backgroundColor: '#0a1c0a', borderBottom: '1px solid #1a3c1a', padding: '8px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'ticker 15s linear infinite' }}>
          <span style={{ color: '#00ff41', fontSize: '0.75rem', fontWeight: 'bold' }}>🔥 User 1234 just won a T-800! </span>
          <span style={{ color: '#559955', margin: '0 15px' }}>|</span>
          <span style={{ color: '#00ff41', fontSize: '0.75rem', fontWeight: 'bold' }}>💰 User 5678 deposited 500,000 UGX! </span>
        </div>
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#559955' }}>Welcome back,</p>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', color: '#fff' }}>
              {profile?.full_name ? profile.full_name.split(' ')[0] : 'User'}
            </h2>
          </div>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0a1c0a', border: '1px solid #00ff41', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
        </div>

        {/* HERO BALANCE CARD */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(0, 255, 65, 0.1), rgba(0, 0, 0, 0.8))',
          border: '1px solid rgba(0, 255, 65, 0.4)',
          borderRadius: '20px',
          padding: '30px 20px',
          textAlign: 'center',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0, 255, 65, 0.15)',
          marginBottom: '25px',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: '#00ff41', filter: 'blur(70px)', opacity: 0.2 }}></div>
          
          <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ccc', letterSpacing: '2px', textTransform: 'uppercase' }}>Total Wallet Balance</p>
          <h1 style={{ margin: 0, fontSize: '3.5rem', fontFamily: 'Playfair Display, serif', color: '#fff', textShadow: '0 0 20px rgba(0, 255, 65, 0.3)' }}>
            <span style={{ fontSize: '1.5rem', color: '#00ff41' }}>UGX</span> {totalWallet.toLocaleString()}
          </h1>
          
          <div style={{ marginTop: '20px', display: 'inline-block', backgroundColor: 'rgba(0, 255, 65, 0.1)', border: '1px solid rgba(0, 255, 65, 0.3)', padding: '5px 15px', borderRadius: '20px' }}>
            <span style={{ fontSize: '0.8rem', color: '#00ff41' }}>VIP Level: {profile?.vip_level || 0}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <button onClick={() => router.push('/deposit')} style={{ background: '#00ff41', color: '#000', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0, 255, 65, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12l7 7 7-7"/></svg> Deposit
          </button>
          <button onClick={() => router.push('/withdraw')} style={{ background: 'rgba(10, 28, 10, 0.8)', color: '#00ff41', padding: '16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', border: '1px solid #00ff41', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg> Withdraw
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '30px' }}>
          
          <div style={{ backgroundColor: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: 'rgba(0, 255, 65, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#559955' }}>AI Income (Daily)</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{stats.dailyAiIncome.toLocaleString()}</h3>
          </div>

          <div style={{ backgroundColor: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: 'rgba(0, 255, 65, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#559955' }}>Today's Earnings</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{stats.totalEarned.toLocaleString()}</h3>
          </div>

          <div style={{ backgroundColor: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: 'rgba(0, 255, 65, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#559955' }}>Invites</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{stats.invites}</h3>
          </div>

          <div style={{ backgroundColor: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: 'rgba(0, 255, 65, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#559955' }}>Team Size</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{stats.teamSize}</h3>
          </div>

        </div>

        {/* Featured Robots */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: '#fff' }}>Trending Robots</h3>
            <span onClick={() => router.push('/ai-robots')} style={{ fontSize: '0.8rem', color: '#00ff41', cursor: 'pointer' }}>See All</span>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none' }}>
            {featuredRobots.map((bot) => (
              <div key={bot.id} onClick={() => router.push('/ai-robots')} style={{ minWidth: '140px', background: 'linear-gradient(180deg, #0a1c0a 0%, #050505 100%)', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}>
                <div style={{ height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                  <img src={bot.image} alt={bot.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bot.name}</h4>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#00ff41', fontWeight: 'bold' }}>{bot.price.toLocaleString()} UGX</p>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
          }
