'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function IncomeHistory() {
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchIncome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch active robots for this user
      const { data: userRobots } = await supabase
        .from('user_robots')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (userRobots) {
        setRobots(userRobots);
      }
      setLoading(false);
    };
    fetchIncome();
  }, [router, supabase]);

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Top Bar */}
      <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #00bfff', borderRadius: '10px', padding: '10px 15px', background: '#0a0a0a' }}>
          <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Show amounts in UGX</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00bfff', fontWeight: 'bold' }}>
            <span>UGX</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* Title */}
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0 0 20px 0' }}>Income history</h1>

        {/* If no robots, show empty state */}
        {robots.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
            
            {/* Receipt Icon */}
            <div style={{ marginBottom: '20px', color: '#ccc' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
                <path d="M9 11h6"/>
                <path d="M9 15h6"/>
                <path d="M9 7h6"/>
              </svg>
            </div>

            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '20px' }}>No income records yet</h2>

            <Link href="/my" style={{ 
              textDecoration: 'none', color: 'white', border: '1px solid #333', 
              padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' 
            }}>
              Transaction history
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00bfff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </Link>

            {/* Divider line */}
            <div style={{ width: '100%', height: '1px', backgroundColor: '#00bfff', marginTop: '40px', opacity: 0.5 }}></div>
          </div>
        ) : (
          
          /* If robots exist, list them here */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {robots.map((bot) => (
              <div key={bot.id} style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#00bfff', fontSize: '1rem', fontFamily: 'Playfair Display, serif' }}>{bot.robot_name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Active Cycle</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>+{Number(bot.daily_income).toLocaleString()} UGX</p>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#00ff00' }}>Daily Income</p>
                </div>
              </div>
            ))}
            
            {/* Divider line */}
            <div style={{ width: '100%', height: '1px', backgroundColor: '#00bfff', marginTop: '20px', opacity: 0.5 }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
