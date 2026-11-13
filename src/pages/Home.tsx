import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { StatCard } from '../components/StatCard';

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('balance_usd, total_deposited, vip_level')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="page-container">
      {/* Banner Code Here... */}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        {/* Use real data from Supabase */}
        <StatCard value={profile?.balance_usd?.toLocaleString() || "0.00"} label="Deposit details" />
        <StatCard value="0.00" label="Withdraw details" />
        <StatCard value="0.00" label="AI Income" />
        <StatCard value="0.00" label="Today's earnings" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <StatCard value="0" label="Invite Count" />
        <StatCard value="0" label="Team Count" />
        <StatCard value="0.00" label="Team income" />
      </div>
    </div>
  );
}
