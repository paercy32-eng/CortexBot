'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function MyTeamPage() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamCommission, setTeamCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchTeamData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Fetch user's total team commission
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_commission')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setTeamCommission(Number(profile.team_commission || 0));
      }

      // 2. Fetch all team members using our updated RPC
      const { data: teamData, error } = await supabase
        .rpc('get_team_members', { p_user_id: user.id });

      if (teamData) {
        setTeamMembers(teamData);
      }
      
      setLoading(false);
    };
    fetchTeamData();
  }, [router, supabase]);

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  // Calculate total team deposits
  const totalTeamDeposits = teamMembers.reduce((sum, member) => sum + Number(member.total_deposited || 0), 0);

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #1a3c1a' }}>
        <button onClick={() => router.push('/my')} style={{ background: 'none', border: 'none', color: '#00ff41', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#00ff41', flex: 1, textAlign: 'center' }}>
          My Team
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* Stats Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
          
          <div style={{ background: '#0a1c0a', border: '1px solid #00ff41', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 0 15px rgba(0, 255, 65, 0.1)' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#559955', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Team Size</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: '#fff', fontFamily: 'Playfair Display, serif' }}>{teamMembers.length} Users</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#559955', textTransform: 'uppercase' }}>Team Deposits</p>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00ff41' }}>{totalTeamDeposits.toLocaleString()} UGX</h3>
            </div>
            <div style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#559955', textTransform: 'uppercase' }}>Team Earnings</p>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00ff41' }}>{teamCommission.toLocaleString()} UGX</h3>
            </div>
          </div>

        </div>

        {/* Team Members List */}
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#00ff41', fontSize: '1.2rem', marginBottom: '15px' }}>Team Members</h3>
        
        {teamMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#0a1c0a', borderRadius: '12px', border: '1px dashed #1a3c1a' }}>
            <p style={{ color: '#559955', margin: 0 }}>You don't have any team members yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {teamMembers.map((member, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a1c0a', border: '1px solid #1a3c1a', padding: '15px', borderRadius: '10px' }}>
                <div>
                  {/* 🚨 SHOW PHONE NUMBER IF NAME IS MISSING */}
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff' }}>
                    {member.full_name || member.phone || 'Anonymous User'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#559955' }}>Level {member.level}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#00ff41' }}>
                    {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
        }
