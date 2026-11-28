'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminPerfumes() {
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDaily, setEditDaily] = useState<string>('');
  const [editCycle, setEditCycle] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchPerfumes = async () => {
    const { data, error } = await supabase
      .from('perfumes')
      .select('*')
      .order('price', { ascending: true });
    
    if (data) setPerfumes(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      fetchPerfumes();
    };
    checkAdmin();
  }, [router, supabase]);

  const startEdit = (perfume: any) => {
    setEditingId(perfume.id);
    setEditPrice(perfume.price.toString());
    setEditDaily(perfume.daily.toString());
    setEditCycle(perfume.cycle.toString());
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
        .from('perfumes')
        .update({ price, daily, cycle, total })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPerfumes(perfumes.map(r => r.id === id ? { ...r, price, daily, cycle, total } : r));
      setEditingId(null);
      alert('Perfume updated successfully!');

    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: '#D4AF37', padding: '50px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading Perfumes...</div>;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#D4AF37', margin: 0 }}>Manage Perfumes</h1>
      </div>

      <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>
        Tap on any fragrance to edit its Price, Daily Yield, or Lock Cycle. The Total Return will auto-calculate.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {perfumes.map((perfume) => {
          const isEditing = editingId === perfume.id;
          
          return (
            <div key={perfume.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={perfume.image} alt={perfume.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{perfume.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{perfume.brand}</p>
                  </div>
                </div>
                {!isEditing && (
                  <button onClick={() => startEdit(perfume)} style={{ background: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', padding: '5px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div style={{ backgroundColor: '#0a0a0a', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Price (UGX)</label>
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Daily Yield</label>
                      <input type="number" value={editDaily} onChange={(e) => setEditDaily(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Cycle (Days)</label>
                      <input type="number" value={editCycle} onChange={(e) => setEditCycle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#D4AF37', fontWeight: 'bold' }}>
                      Total Return: {(Number(editDaily) * Number(editCycle)).toLocaleString()} UGX
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={cancelEdit} disabled={saving} style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 15px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        Cancel
                      </button>
                      <button onClick={() => saveEdit(perfume.id)} disabled={saving} style={{ background: '#D4AF37', border: 'none', color: '#000', padding: '8px 20px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', backgroundColor: '#0a0a0a', padding: '10px', borderRadius: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>PRICE</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{Number(perfume.price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>DAILY</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#D4AF37', fontWeight: 'bold' }}>{Number(perfume.daily).toLocaleString()}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>CYCLE</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{perfume.cycle} Days</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>TOTAL</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#D4AF37', fontWeight: 'bold' }}>{Number(perfume.total).toLocaleString()}</p>
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