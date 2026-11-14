'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function VipPage() {
  const [activeInvites, setActiveInvites] = useState(0);
  const [currentVip, setCurrentVip] = useState(0);
  const [currentReward, setCurrentReward] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  const VIP_TIERS = [
    { level: 1, req: 4, reward: 2000 },
    { level: 2, req: 10, reward: 5000 },
    { level: 3, req: 20, reward: 15000 },
    { level: 4, req: 40, reward: 25000 },
    { level: 5, req: 100, reward: 100000 },
  ];

  useEffect(() => {
    const fetchVipData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Fetch direct referrals and check if they have PURCHASED robots (is_granted = false)
      const { data: referrals } = await supabase
        .from('profiles')
        .select(`
          id,
          user_robots!inner(is_granted)
        `)
        .eq('referred_by', user.id)
        .eq('user_robots.is_granted', false); // 🚨 ONLY COUNT REAL PURCHASES

      const activeCount = referrals ? referrals.length : 0;
      setActiveInvites(activeCount);

      // 2. Calculate current VIP Level
      let earnedVip = 0;
      let dailyReward = 0;

      for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
        if (activeCount >= VIP_TIERS[i].req) {
          earnedVip = VIP_TIERS[i].level;
          dailyReward = VIP_TIERS[i].reward;
          break;
        }
      }

      setCurrentVip(earnedVip);
      setCurrentReward(dailyReward);

      // 3. Optionally update their profile badge in the database
      if (earnedVip > 0) {
        await supabase.from('profiles').update({ vip_level: earnedVip }).eq('id', user.id);
      }

      setLoading(false);
    };
    fetchVipData();
  }, [router, supabase]);

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #333' }}>
        <button onClick={() => router.push('/my')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#00bfff', flex: 1, textAlign: 'center' }}>
          VIP Program
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* Current Status Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0a0a0a, #121c2d)', 
          border: '1px solid #00bfff', 
          borderRadius: '16px', 
          padding: '25px 20px', 
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(0,191,255,0.1)',
          marginBottom: '30px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Current Status</p>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: '#fff', fontFamily: 'Playfair Display, serif' }}>
            {currentVip === 0 ? 'No VIP Yet' : `VIP ${currentVip}`}
          </h2>
          <p style={{ margin: 0, fontSize: '1.2rem', color: '#00bfff', fontWeight: 'bold' }}>
            {currentReward.toLocaleString()} UGX <span style={{fontSize: '0.9rem', color: '#888', fontWeight: 'normal'}}>/ day</span>
          </p>
          
          <div style={{ marginTop: '20px', backgroundColor: '#000', borderRadius: '10px', padding: '10px', border: '1px solid #333' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>
              Active Invites: <strong style={{ color: '#00bfff' }}>{activeInvites}</strong>
            </p>
          </div>
        </div>

        {/* VIP Tiers List */}
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#00bfff', fontSize: '1.2rem', marginBottom: '15px' }}>VIP Levels</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {VIP_TIERS.map((tier) => {
            const isAchieved = currentVip >= tier.level;
            const isNext = currentVip === tier.level - 1;

            return (
              <div key={tier.level} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: isAchieved ? 'rgba(0, 191, 255, 0.1)' : '#0a0a0a', 
                border: `1px solid ${isAchieved ? '#00bfff' : '#333'}`, 
                padding: '15px', 
                borderRadius: '12px',
                opacity: isAchieved || isNext ? 1 : 0.6
              }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: isAchieved ? '#00bfff' : '#fff' }}>
                    VIP {tier.level}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
                    Requires {tier.req} active invites
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '1.1rem', color: isAchieved ? '#00ff00' : '#fff' }}>
                    {tier.reward.toLocaleString()} UGX
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>per day</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
