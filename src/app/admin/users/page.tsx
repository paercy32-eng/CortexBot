'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [allUserPerfumes, setAllUserPerfumes] = useState<any[]>([]);
  const [dbPerfumes, setDbPerfumes] = useState<any[]>([]);
  
  // Stats maps
  const [teamStats, setTeamStats] = useState<{ [key: string]: { activeInvites: number, totalTeam: number } }>({});
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedPerfumeToGrant, setSelectedPerfumeToGrant] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchUsersAndPerfumes = async () => {
    setLoading(true);
    
    // Fetch everything in parallel for speed
    const [profilesRes, userPerfumesRes, dbPerfumesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_perfumes').select('*').eq('status', 'active'),
      supabase.from('perfumes').select('*').order('price', { ascending: true })
    ]);
      
    const fetchedUsers = profilesRes.data || [];
    const fetchedUserPerfumes = userPerfumesRes.data || [];
    
    setUsers(fetchedUsers);
    setAllUserPerfumes(fetchedUserPerfumes);
    if (dbPerfumesRes.data) setDbPerfumes(dbPerfumesRes.data);

    // 🚨 CALCULATE TEAM STATS
    const stats: { [key: string]: { activeInvites: number, totalTeam: number } } = {};
    
    // Initialize stats for all users
    fetchedUsers.forEach(u => {
      stats[u.id] = { activeInvites: 0, totalTeam: 0 };
    });

    // 1. Calculate Active Invites (Level 1 only)
    fetchedUsers.forEach(u => {
      if (u.referred_by && stats[u.referred_by]) {
        const hasDeposit = Number(u.total_deposited || 0) > 0;
        const hasPurchased = fetchedUserPerfumes.some(r => r.user_id === u.id && r.is_granted !== true);
        
        if (hasDeposit || hasPurchased) {
          stats[u.referred_by].activeInvites += 1;
        }
      }
    });

    // 2. Calculate Total Team (Recursive up to Level 3)
    fetchedUsers.forEach(u => {
      let currentReferrer = u.referred_by;
      let level = 1;
      
      while (currentReferrer && level <= 3) {
        if (stats[currentReferrer]) {
          stats[currentReferrer].totalTeam += 1;
        }
        // Move up to the next level
        const referrerObj = fetchedUsers.find(x => x.id === currentReferrer);
        currentReferrer = referrerObj ? referrerObj.referred_by : null;
        level++;
      }
    });

    setTeamStats(stats);
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      fetchUsersAndPerfumes();
    };
    checkAdmin();
  }, [router, supabase]);

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'UNBAN' : 'BAN'} this user?`)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
      alert(`User ${currentStatus ? 'Unbanned' : 'Banned'} successfully!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleGrantPerfume = async () => {
    if (!selectedPerfumeToGrant || !selectedUser) return;
    setProcessing(true);

    try {
      const perfumeData = dbPerfumes.find(r => r.id === selectedPerfumeToGrant);
      if (!perfumeData) throw new Error("Perfume not found");

      const { error } = await supabase.from('user_perfumes').insert({
        user_id: selectedUser.id,
        perfume_name: perfumeData.name,
        price_paid: perfumeData.price,
        daily_income: perfumeData.daily,
        cycle_days: perfumeData.cycle,
        status: 'active',
        plan_type: perfumeData.plan_type,
        is_granted: true, // 🚨 Mark as granted
        last_payout: new Date().toISOString()
      });

      if (error) throw error;
      
      alert(`${perfumeData.name} granted successfully!`);
      setSelectedPerfumeToGrant('');
      fetchUsersAndPerfumes(); 

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemovePerfume = async (perfumeId: string) => {
    if (!confirm("Are you sure you want to remove this perfume? The user will stop earning from it.")) return;
    setProcessing(true);

    try {
      const { error } = await supabase.from('user_perfumes').delete().eq('id', perfumeId);
      if (error) throw error;
      
      alert("Perfume removed successfully!");
      fetchUsersAndPerfumes(); 

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getDisplayName = (user: any) => {
    if (user.full_name && user.full_name.trim() !== '') return user.full_name;
    if (user.phone) return `User ${user.phone.slice(-4)}`;
    return 'Unknown User';
  };

  const filteredUsers = users.filter(u => 
    (u.phone || '').includes(searchQuery) || 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div style={{ color: '#D4AF37', padding: '50px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading Users...</div>;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#D4AF37', margin: 0 }}>Manage Users</h1>
      </div>

      {/* Search Bar */}
      <input 
        type="text" 
        placeholder="Search by phone or name..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '1rem', marginBottom: '20px', outline: 'none' }}
      />

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredUsers.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center' }}>No users found.</p>
        ) : (
          filteredUsers.map((user) => {
            const userPerfumes = allUserPerfumes.filter(r => r.user_id === user.id);
            const realBalance = Number(user.balance_usd || 0) + Number(user.withdrawable_balance || 0);
            const stats = teamStats[user.id] || { activeInvites: 0, totalTeam: 0 };

            return (
              <div key={user.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
                
                {/* User Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#fff' }}>{getDisplayName(user)}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', fontFamily: 'monospace' }}>{user.phone}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#D4AF37', fontWeight: 'bold' }}>
                      Balance: {realBalance.toLocaleString()} UGX
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      style={{ 
                        padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer',
                        backgroundColor: user.is_banned ? '#ff4444' : 'transparent',
                        color: user.is_banned ? '#fff' : '#ff4444',
                        borderWidth: '1px', borderStyle: 'solid', borderColor: '#ff4444'
                      }}
                    >
                      {user.is_banned ? 'Unban User' : 'Ban User'}
                    </button>
                    
                    <button 
                      onClick={() => setSelectedUser(user)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #D4AF37', backgroundColor: 'transparent', color: '#D4AF37', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Manage Perfumes
                    </button>
                  </div>
                </div>

                {/* 🚨 TEAM STATS BADGES */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid #333', color: '#D4AF37', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>
                    Active Invites: <strong>{stats.activeInvites}</strong>
                  </div>
                  <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', border: '1px solid #333', color: '#D4AF37', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>
                    Total Team: <strong>{stats.totalTeam}</strong>
                  </div>
                </div>

                {/* Active Perfumes List */}
                {userPerfumes.length > 0 && (
                  <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Active Perfumes</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {userPerfumes.map(perfume => (
                        <div key={perfume.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                          <span style={{ color: '#fff' }}>{perfume.perfume_name}</span>
                          
                          {/* 🚨 GRANTED / PURCHASED BADGE */}
                          <span style={{ 
                            fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold',
                            backgroundColor: perfume.is_granted ? 'rgba(255, 165, 0, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                            color: perfume.is_granted ? '#ffa500' : '#D4AF37'
                          }}>
                            {perfume.is_granted ? 'GRANTED' : 'PURCHASED'}
                          </span>

                          <button onClick={() => handleRemovePerfume(perfume.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Perfume Grant Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#111', border: '1px solid #D4AF37', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '400px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#D4AF37' }}>Grant Perfume</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ccc' }}>
              Granting a perfume to: <strong style={{ color: '#fff' }}>{getDisplayName(selectedUser)}</strong>
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Select a Perfume to Grant for Free</label>
            <select 
              value={selectedPerfumeToGrant} 
              onChange={(e) => setSelectedPerfumeToGrant(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '0.9rem', marginBottom: '20px', outline: 'none' }}
            >
              <option value="">-- Choose Perfume --</option>
              {dbPerfumes.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Earns {r.daily.toLocaleString()} UGX/day)</option>
              ))}
            </select>

            <button 
              onClick={handleGrantPerfume}
              disabled={!selectedPerfumeToGrant || processing}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', background: '#D4AF37', color: '#000', fontWeight: 'bold', cursor: (!selectedPerfumeToGrant || processing) ? 'not-allowed' : 'pointer', opacity: (!selectedPerfumeToGrant || processing) ? 0.5 : 1 }}
            >
              {processing ? 'Granting...' : 'Grant Perfume'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}