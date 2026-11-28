'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function IncomeHistory() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now()); 
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);

    const fetchIncome = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userPerfumes } = await supabase
        .from('user_perfumes')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (userPerfumes) {
        setPerfumes(userPerfumes);
      }
      setLoading(false);
    };
    fetchIncome();

    return () => clearInterval(timer);
  }, [router, supabase]);

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      <div style={{ padding: '20px 15px' }}>
        
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '0 0 20px 0', color: '#D4AF37' }}>Income history</h1>

        {perfumes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
            <div style={{ marginBottom: '20px', color: '#555' }}>
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
                <path d="M9 11h6"/><path d="M9 15h6"/><path d="M9 7h6"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: '20px', color: '#fff' }}>No active fragrances</h2>
            <Link href="/perfumes" style={{ textDecoration: 'none', color: '#000', background: '#D4AF37', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
              Buy a Perfume
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {perfumes.map((perfume) => {
              const paidDays = perfume.days_paid || 0;
              const earnedSoFar = paidDays * Number(perfume.daily_income);
              const progressPercent = (paidDays / perfume.cycle_days) * 100;
              const isCompleted = perfume.status === 'completed' || paidDays >= perfume.cycle_days;

              // Timer logic
              const lastPayout = new Date(perfume.last_payout).getTime();
              const nextPayout = lastPayout + (24 * 60 * 60 * 1000); 
              const timeRemaining = nextPayout - currentTime;

              let countdownText = "Paid";
              if (!isCompleted && timeRemaining > 0) {
                const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                countdownText = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
              }

              return (
                <div key={perfume.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px', opacity: isCompleted ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0', color: '#D4AF37', fontSize: '1.1rem', fontFamily: 'Playfair Display, serif' }}>{perfume.perfume_name}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Daily: {Number(perfume.daily_income).toLocaleString()} UGX</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#D4AF37', fontSize: '1.1rem' }}>
                        +{earnedSoFar.toLocaleString()} UGX
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Earned so far</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#ccc', marginBottom: '5px' }}>
                      <span>Day {paidDays}</span>
                      <span>{perfume.cycle_days} Days Total</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#D4AF37', borderRadius: '4px' }}></div>
                    </div>
                  </div>

                  {!isCompleted ? (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#0a0a0a', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #333' }}>
                      <span style={{ fontSize: '0.75rem', color: '#888' }}>Next Payout:</span>
                      <span style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 'bold', fontFamily: 'monospace' }}>{countdownText}</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.75rem', color: '#D4AF37', fontWeight: 'bold', backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '8px', borderRadius: '8px' }}>
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