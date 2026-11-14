'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; 
import { StatCard } from '../components/StatCard'; 
import { useRouter } from 'next/navigation'; 

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter(); 

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance_usd, total_deposited, vip_level')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setProfile(data);
        }
      }
      setLoading(false);
    };
    
    fetchProfile();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', color: 'white' }}>Loading dashboard...</div>;
  }

  return (
    <div className="page-container" style={{ padding: '20px 15px', backgroundColor: '#000', minHeight: '100vh', color: 'white' }}>
      
      {/* Banner */}
      <div className="banner" style={{ height: '180px', borderRadius: '15px', backgroundImage: 'url("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800")', backgroundSize: 'cover', position: 'relative', marginBottom: '20px' }}>
        <div style={{ position: 'absolute', bottom: '15px', left: '15px', zIndex: 2 }}>
          <h3 className="neon-text" style={{ margin: 0, color: '#00bfff', fontFamily: 'Playfair Display, serif' }}>Cortex Neural Matrix</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>Smart AI mining machines for daily income.</p>
        </div>
      </div>

      {/* Quick Actions (Deposit & Withdraw Buttons) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={() => router.push('/deposit')}
          style={{ background: '#00bfff', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
        >
          Deposit Funds
        </button>
        <button 
          onClick={() => router.push('/withdraw')}
          style={{ background: '#121c2d', color: '#00bfff', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #00bfff', cursor: 'pointer', fontSize: '1rem' }}
        >
          Withdraw
        </button>
      </div>

      {/* 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <StatCard value={profile?.total_deposited?.toLocaleString() || "0.00"} label="Deposit details" />
        <StatCard value={profile?.balance_usd?.toLocaleString() || "0.00"} label="Withdraw details" />
        <StatCard value="0.00" label="AI Income" />
        <StatCard value="0.00" label="Today's earnings" />
      </div>

      {/* 3x1 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <StatCard value="0" label="Invite Count" />
        <StatCard value="0" label="Team Count" />
        <StatCard value="0.00" label="Team income" />
      </div>
    </div>
  );
}
