'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Raffle() {
  const [user, setUser] = useState<any>(null);
  const [chances, setChances] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [rafflePerfumes, setRafflePerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wonPerfume, setWonPerfume] = useState<any>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchRaffleData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 1. Fetch user chances
      const { data: profile } = await supabase
        .from('profiles')
        .select('raffle_chances')
        .eq('id', user.id)
        .single();

      if (profile) setChances(profile.raffle_chances || 0);

      // 2. Fetch raffle history
      const { data: hist } = await supabase
        .from('raffle_history')
        .select('*')
        .eq('user_id', user.id)
        .order('won_at', { ascending: false });

      if (hist) setHistory(hist);

      // 3. Fetch ALL perfumes from the database
      const { data: dbPerfumes } = await supabase
        .from('perfumes')
        .select('*');

      if (dbPerfumes && dbPerfumes.length > 0) {
        // SHUFFLE LOGIC: Randomize the array and pick 9
        const shuffled = [...dbPerfumes].sort(() => 0.5 - Math.random());
        const selectedRandom = shuffled.slice(0, 9);
        setRafflePerfumes(selectedRandom);
      }
      
      setLoading(false);
    };
    fetchRaffleData();
  }, [router, supabase]);

  const handleSpin = async () => {
    if (chances <= 0 || spinning || rafflePerfumes.length === 0) return;
    setSpinning(true);
    setWonPerfume(null);

    try {
      // 1. Pick a random perfume from the displayed 9
      const randomIndex = Math.floor(Math.random() * rafflePerfumes.length);
      const prize = rafflePerfumes[randomIndex];

      // 2. Deduct 1 chance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ raffle_chances: chances - 1 })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Add the won perfume to user_perfumes
      const { error: perfumeError } = await supabase
        .from('user_perfumes')
        .insert({
          user_id: user.id,
          perfume_name: prize.name,
          price_paid: prize.price,
          daily_income: prize.daily,
          cycle_days: prize.cycle,
          status: 'active',
          last_payout: new Date().toISOString() 
        });

      if (perfumeError) throw perfumeError;

      // 4. Log the win
      await supabase
        .from('raffle_history')
        .insert({ user_id: user.id, perfume_name: prize.name });

      // 5. Update UI
      setChances(prev => prev - 1);
      setHistory(prev => [{ perfume_name: prize.name, won_at: new Date().toISOString() }, ...prev]);
      setWonPerfume(prize);

    } catch (error: any) {
      alert("Error spinning: " + error.message);
    } finally {
      setSpinning(false);
    }
  };

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '100px' }}>
      
      <div style={{ padding: '15px' }}>
        <div style={{ border: '1px solid #D4AF37', borderRadius: '12px', padding: '15px', textAlign: 'center', backgroundColor: 'rgba(212, 175, 55, 0.05)' }}>
          <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1rem', lineHeight: '1.5' }}>
            Raffle is available to members who deposit <strong style={{color: '#D4AF37'}}>UGX 100,000</strong> or more, or buy a perfume priced <strong style={{color: '#D4AF37'}}>UGX 100,000</strong> or more.
          </p>
        </div>
      </div>

      <div style={{ padding: '0 15px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {rafflePerfumes.map((perfume) => (
          <div key={perfume.id} style={{ background: '#111', border: '1px solid #333', borderRadius: '8px', height: '90px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
            <img src={perfume.image} alt={perfume.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 5px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center', fontFamily: 'Playfair Display, serif', color: '#fff' }}>{perfume.name}</span>
              <span style={{ fontSize: '0.6rem', color: '#D4AF37' }}>{Number(perfume.price).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 15px' }}>
        <button 
          onClick={handleSpin}
          disabled={chances <= 0 || spinning}
          style={{ width: '100%', padding: '20px', backgroundColor: 'transparent', border: '1px solid #D4AF37', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', cursor: (chances <= 0 || spinning) ? 'not-allowed' : 'pointer', opacity: (chances <= 0 || spinning) ? 0.5 : 1 }}
        >
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>
            {spinning ? 'Spinning...' : `Ready: ${chances}`}
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: spinning ? 'spin 1s linear infinite' : 'none' }}>
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 15px', marginTop: '10px' }}>
        <div style={{ border: '1px solid #222', borderRadius: '12px', padding: '20px', minHeight: '150px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37', textAlign: 'center', marginTop: 0, fontSize: '1.5rem' }}>My records</h2>
          {history.length === 0 ? (
            <p style={{ color: '#A0A0A0', textAlign: 'center', fontSize: '0.9rem', marginTop: '20px' }}>No raffle records yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              {history.map((record, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
                  <span style={{ color: '#fff', fontSize: '0.9rem' }}>{record.perfume_name}</span>
                  <span style={{ color: '#D4AF37', fontSize: '0.8rem' }}>Won</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {wonPerfume && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #D4AF37', borderRadius: '16px', padding: '30px 20px', textAlign: 'center', width: '100%', maxWidth: '350px' }}>
            <h2 style={{ color: '#D4AF37', fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', margin: '0 0 10px 0' }}>Congratulations!</h2>
            <p style={{ color: '#ccc', marginBottom: '20px' }}>You just won:</p>
            <h3 style={{ color: '#fff', fontSize: '1.5rem', margin: '0 0 20px 0', fontFamily: 'Playfair Display, serif' }}>{wonPerfume.name}</h3>
            <p style={{ color: '#D4AF37', marginBottom: '20px' }}>+{Number(wonPerfume.daily).toLocaleString()} UGX / day</p>
            <button onClick={() => setWonPerfume(null)} style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
              Collect & Close
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}