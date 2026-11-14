'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminRobots() {
  const [robots, setRobots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDaily, setEditDaily] = useState<string>('');
  const [editCycle, setEditCycle] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchRobots = async () => {
    const { data, error } = await supabase
      .from('robots')
      .select('*')
      .order('price', { ascending: true });
    
    if (data) setRobots(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      fetchRobots();
    };
    checkAdmin();
  }, [router, supabase]);

  const startEdit = (robot: any) => {
    setEditingId(robot.id);
    setEditPrice(robot.price.toString());
    setEditDaily(robot.daily.toString());
    setEditCycle(robot.cycle.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
    setEditDaily('');
    setEditCycle('');
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const price = Number(editPrice);
      const daily = Number(editDaily);
      const cycle = Number(editCycle);
      const total = daily * cycle; // Auto-calculate total

      if (price <= 0 || daily <= 0 || cycle <= 0) {
        throw new Error("Values must be greater than 0");
      }

      const { error } = await supabase
        .from('robots')
        .update({ price, daily, cycle, total })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setRobots(robots.map(r => r.id === id ? { ...r, price, daily, cycle, total } : r));
      setEditingId(null);
      alert('Robot updated successfully!');

    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading Robots...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>Manage Robots</h1>
      </div>

      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>
        Tap on any robot to edit its Price, Daily Income, or Lock Cycle. The Total Return will auto-calculate.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {robots.map((bot) => {
          const isEditing = editingId === bot.id;
          
          return (
            <div key={bot.id} style={{ background: '#121c2d', border: '1px solid #333', borderRadius: '12px', padding: '15px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={bot.image} alt={bot.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{bot.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{bot.category}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button onClick={() => startEdit(bot)} style={{ background: 'transparent', border: '1px solid #00bfff', color: '#00bfff', padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div style={{ backgroundColor: '#0a0a0a', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Price (UGX)</label>
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Daily Income</label>
                      <input type="number" value={editDaily} onChange={(e) => setEditDaily(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '0.9rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Cycle (Days)</label>
                      <input type="number" value={editCycle} onChange={(e) => setEditCycle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '0.9rem' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#00ff00', fontWeight: 'bold' }}>
                      Total Return: {(Number(editDaily) * Number(editCycle)).toLocaleString()} UGX
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={cancelEdit} disabled={saving} style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 15px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={() => saveEdit(bot.id)} disabled={saving} style={{ background: '#00bfff', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', backgroundColor: '#0a0a0a', padding: '10px', borderRadius: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>PRICE</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{Number(bot.price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>DAILY</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#00bfff', fontWeight: 'bold' }}>{Number(bot.daily).toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>CYCLE</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{bot.cycle} Days</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>TOTAL</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#00ff00', fontWeight: 'bold' }}>{Number(bot.total).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
