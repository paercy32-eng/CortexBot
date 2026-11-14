'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { ROBOTS } from '@/data/robots';

export default function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [allUserRobots, setAllUserRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRobotToGrant, setSelectedRobotToGrant] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchUsersAndRobots = async () => {
    setLoading(true);
    
    // Fetch all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (profiles) setUsers(profiles);

    // Fetch all active robots
    const { data: robots } = await supabase
      .from('user_robots')
      .select('*')
      .eq('status', 'active');
      
    if (robots) setAllUserRobots(robots);
    
    setLoading(false);
  };

  useEffect(() => {
    // Check admin
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      fetchUsersAndRobots();
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
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
      alert(`User ${currentStatus ? 'Unbanned' : 'Banned'} successfully!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleGrantRobot = async () => {
    if (!selectedRobotToGrant || !selectedUser) return;
    setProcessing(true);

    try {
      const robotData = ROBOTS.find(r => r.id === selectedRobotToGrant);
      if (!robotData) throw new Error("Robot not found");

      const { error } = await supabase.from('user_robots').insert({
        user_id: selectedUser.id,
        robot_name: robotData.name,
        price_paid: robotData.price,
        daily_income: robotData.daily,
        cycle_days: robotData.cycle,
        status: 'active',
        last_payout: new Date().toISOString()
      });

      if (error) throw error;
      
      alert(`${robotData.name} granted successfully!`);
      setSelectedRobotToGrant('');
      fetchUsersAndRobots(); // Refresh list

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveRobot = async (robotId: string) => {
    if (!confirm("Are you sure you want to remove this robot? The user will stop earning from it.")) return;
    setProcessing(true);

    try {
      const { error } = await supabase.from('user_robots').delete().eq('id', robotId);
      if (error) throw error;
      
      alert("Robot removed successfully!");
      fetchUsersAndRobots(); // Refresh list

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.phone || '').includes(searchQuery) || 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading Users...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>Manage Users</h1>
      </div>

      {/* Search Bar */}
      <input 
        type="text" 
        placeholder="Search by phone or name..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '1rem', marginBottom: '20px', outline: 'none' }}
      />

      {/* Users List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredUsers.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center' }}>No users found.</p>
        ) : (
          filteredUsers.map((user) => {
            const userRobots = allUserRobots.filter(r => r.user_id === user.id);

            return (
              <div key={user.id} style={{ background: '#121c2d', border: '1px solid #333', borderRadius: '12px', padding: '15px' }}>
                
                {/* User Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#fff' }}>{user.full_name || 'Anonymous User'}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', fontFamily: 'monospace' }}>{user.phone}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#00bfff', fontWeight: 'bold' }}>
                      Balance: {Number(user.balance_usd || 0).toLocaleString()} UGX
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      onClick={() => toggleBan(user.id, user.is_banned)}
                      style={{ 
                        padding: '6px 12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer',
                        backgroundColor: user.is_banned ? '#ff4444' : 'transparent',
                        color: user.is_banned ? '#fff' : '#ff4444',
                        borderWidth: '1px', borderStyle: 'solid', borderColor: '#ff4444'
                      }}
                    >
                      {user.is_banned ? 'Unban User' : 'Ban User'}
                    </button>
                    
                    <button 
                      onClick={() => setSelectedUser(user)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #00bfff', backgroundColor: 'transparent', color: '#00bfff', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Manage Robots
                    </button>
                  </div>
                </div>

                {/* Active Robots List */}
                {userRobots.length > 0 && (
                  <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Active Robots</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {userRobots.map(robot => (
                        <div key={robot.id} style={{ backgroundColor: 'rgba(0, 191, 255, 0.1)', border: '1px solid rgba(0, 191, 255, 0.3)', padding: '5px 10px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                          <span>{robot.robot_name}</span>
                          <button onClick={() => handleRemoveRobot(robot.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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

      {/* Robot Grant Modal */}
      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#121c2d', border: '1px solid #00bfff', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '400px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#00bfff' }}>Grant Robot</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ccc' }}>
              Granting a robot to: <strong style={{ color: '#fff' }}>{selectedUser.full_name || selectedUser.phone}</strong>
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Select a Robot to Grant for Free</label>
            <select 
              value={selectedRobotToGrant} 
              onChange={(e) => setSelectedRobotToGrant(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#0a0a0a', color: '#fff', fontSize: '0.9rem', marginBottom: '20px', outline: 'none' }}
            >
              <option value="">-- Choose Robot --</option>
              {ROBOTS.map(r => (
                <option key={r.id} value={r.id}>{r.name} (Earns {r.daily} UGX/day)</option>
              ))}
            </select>

            <button 
              onClick={handleGrantRobot}
              disabled={!selectedRobotToGrant || processing}
              style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', background: '#00bfff', color: '#000', fontWeight: 'bold', cursor: (!selectedRobotToGrant || processing) ? 'not-allowed' : 'pointer', opacity: (!selectedRobotToGrant || processing) ? 0.5 : 1 }}
            >
              {processing ? 'Granting...' : 'Grant Robot'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
          }
