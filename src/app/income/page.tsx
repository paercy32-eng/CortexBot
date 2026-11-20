'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function IncomeHistory() {
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now()); // For live countdown
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Live timer to update the countdown every second
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);

    const fetchIncome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userRobots } = await supabase
        .from('user_robots')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (userRobots) {
        setRobots(userRobots);
      }
      setLoading(false);
    };
    fetchIncome();

    return () => clearInterval(timer);
  }, [router, supabase]);

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      <div style={{ padding: '20px 15px' }}>
        
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0 0 20px 0', color: '#00ff41' }}>Income history</h1>

        {robots.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
            <div style={{ marginBottom: '20px', color: '#559955' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
                <path d="M9 11h6"/><path d="M9 15h6"/><path d="M9 7h6"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '20px', color: '#fff' }}>No active robots</h2>
            <Link href="/ai-robots" style={{ textDecoration: 'none', color: '#000', background: '#00ff41', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
              Buy a Robot
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {robots.map((bot) => {
              // 🚨 24H COUNTDOWN LOGIC
              const lastPayout = new Date(bot.last_payout).getTime();
              const nextPayout = lastPayout + (24 * 60 * 60 * 1000); // Add 24 hours
              const timeRemaining = nextPayout - currentTime;
              
              const isCompleted = bot.status === 'completed' || (bot.days_paid || 0) >= bot.cycle_days;
              const progressPercent = ((bot.days_paid || 0) / bot.cycle_days) * 100;

              // Format the countdown string
              let countdownText = "Paid";
              if (!isCompleted && timeRemaining > 0) {
                const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                countdownText = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
              }

              return (
                <div key={bot.id} style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '15px', opacity: isCompleted ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#00ff41', fontSize: '1.1rem', fontFamily: 'Playfair Display, serif' }}>{bot.robot_name}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#559955' }}>Daily: {Number(bot.daily_income).toLocaleString()} UGX</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#00ff41', fontSize: '1.1rem' }}>
                        +{((bot.days_paid || 0) * Number(bot.daily_income)).toLocaleString()} UGX
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#559955' }}>Earned so far</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#ccc', marginBottom: '5px' }}>
                      <span>Day {bot.days_paid || 0}</span>
                      <span>{bot.cycle_days} Days Total</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#1a3c1a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#00ff41', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  {/* Live Countdown */}
                  {!isCompleted ? (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#000', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #1a3c1a' }}>
                      <span style={{ fontSize: '0.75rem', color: '#559955' }}>Next Payout:</span>
                      <span style={{ fontSize: '0.8rem', color: '#00ff41', fontWeight: 'bold', fontFamily: 'monospace' }}>{countdownText}</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#00ff41', fontWeight: 'bold', backgroundColor: 'rgba(0, 255, 65, 0.1)', padding: '8px', borderRadius: '8px' }}>
                      Cycle Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
                        }
