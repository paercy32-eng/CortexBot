'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Perfumes() {
  const supabase = createClient();
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [perfumes, setPerfumes] = useState<any[]>([]);
  const [userPerfumes, setUserPerfumes] = useState<any[]>([]);
  
  const [depositBalance, setDepositBalance] = useState<number>(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState<number>(0);
  
  const [activeTab, setActiveTab] = useState('All'); 
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, withdrawable_balance')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setDepositBalance(Number(profile.balance_usd || 0));
        setWithdrawableBalance(Number(profile.withdrawable_balance || 0));
      }

      const { data: owned } = await supabase
        .from('user_perfumes')
        .select('perfume_name, status')
        .eq('user_id', user.id);
      
      if (owned) setUserPerfumes(owned);

      const { data: dbPerfumes } = await supabase
        .from('perfumes')
        .select('*')
        .order('price', { ascending: true });

      if (dbPerfumes) setPerfumes(dbPerfumes);
      
      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const handleBuyPerfume = async (perfume: any) => {
    if (!user) return;

    const alreadyOwned = userPerfumes.some(r => r.perfume_name === perfume.name && r.status === 'active');
    if (alreadyOwned) return;

    let isFirstPurchase = userPerfumes.length === 0;
    let currentBalanceToUse = isFirstPurchase ? depositBalance : withdrawableBalance;
    let balanceName = isFirstPurchase ? 'Approved Deposit Balance' : 'Withdrawable Balance';

    if (currentBalanceToUse < perfume.price) {
      alert(`Insufficient ${balanceName}!\n\nYou need ${perfume.price.toLocaleString()} UGX to proceed.\n\n${isFirstPurchase ? 'Your first purchase must be fully funded by approved deposits.' : 'You cannot use locked AI income or deposit funds for subsequent purchases.'}`);
      return;
    }

    const actionText = perfume.plan_type === 'daily' ? 'buy' : 'lock in';
    if (!confirm(`Are you sure you want to ${actionText} ${perfume.name} for ${perfume.price.toLocaleString()} UGX?`)) return;

    setProcessingId(perfume.id);

    try {
      let updates: any = {};
      
      if (isFirstPurchase) {
        updates.balance_usd = depositBalance - perfume.price;
        setDepositBalance(updates.balance_usd);
      } else {
        updates.withdrawable_balance = withdrawableBalance - perfume.price;
        setWithdrawableBalance(updates.withdrawable_balance);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: purchaseError } = await supabase
        .from('user_perfumes')
        .insert({
          user_id: user.id,
          perfume_name: perfume.name,
          price_paid: perfume.price,
          daily_income: perfume.daily,
          cycle_days: perfume.cycle,
          status: 'active',
          plan_type: perfume.plan_type,
          is_granted: false, 
          last_payout: new Date().toISOString()
        });

      if (purchaseError) throw purchaseError;

      setUserPerfumes(prev => [...prev, { perfume_name: perfume.name, status: 'active' }]);
      alert(`Successfully ${actionText === 'buy' ? 'activated' : 'locked in'} ${perfume.name}!`);

    } catch (error: any) {
      alert("Error processing request: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPerfumes = perfumes.filter(p => activeTab === 'All' || p.category === activeTab);

  if (loading) return <div style={{ color: '#00ff41', padding: '50px', textAlign: 'center', backgroundColor: '#050505', minHeight: '100vh' }}>Loading Fragrances...</div>;

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#050505', minHeight: '100vh', color: 'white' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#00ff41', margin: 0 }}>Fragrance Store</h1>
        <span style={{ fontSize: '0.8rem', color: '#559955' }}>Showing {filteredPerfumes.length} Items</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #1a3c1a', paddingBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['All', 'Men', 'Women', 'Unisex'].map((tab) => (
          <span 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              color: activeTab === tab ? '#00ff41' : '#559955', 
              fontWeight: activeTab === tab ? 'bold' : 'normal', 
              whiteSpace: 'nowrap', 
              borderBottom: activeTab === tab ? '2px solid #00ff41' : 'none', 
              paddingBottom: '9px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Perfume List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {filteredPerfumes.map((perfume: any) => {
          const ownedPerfume = userPerfumes.find(r => r.perfume_name === perfume.name && r.status === 'active');
          const isOwned = !!ownedPerfume;

          return (
            <div key={perfume.id} style={{ background: '#0a1c0a', border: '1px solid #1a3c1a', borderRadius: '16px', padding: '15px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
              
              <div style={{ height: '200px', background: '#000', borderRadius: '12px', marginBottom: '15px', overflow: 'hidden', position: 'relative' }}>
                <img src={perfume.image} alt={perfume.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: perfume.plan_type === 'daily' ? 'rgba(0, 255, 65, 0.2)' : 'rgba(255, 165, 0, 0.2)', border: `1px solid ${perfume.plan_type === 'daily' ? '#00ff41' : '#ffa500'}`, color: perfume.plan_type === 'daily' ? '#00ff41' : '#ffa500', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                  {perfume.plan_type === 'daily' ? 'Daily Plan' : 'Locked Plan'}
                </div>
              </div>
              
              <h4 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#00ff41', fontFamily: 'Playfair Display, serif' }}>{perfume.name}</h4>
              <p style={{ fontSize: '0.85rem', color: '#559955', margin: '0 0 15px 0' }}>{perfume.brand}</p>
              
              {/* RESTORED THE 4-COLUMN GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', background: '#000', padding: '15px 10px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Price</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{Number(perfume.price).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Daily</div>
                  <div style={{ fontSize: '0.9rem', color: '#00ff41', fontWeight: 'bold' }}>{Number(perfume.daily).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Cycle</div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>{perfume.cycle} Days</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#559955', textTransform: 'uppercase' }}>Total</div>
                  <div style={{ fontSize: '0.9rem', color: '#00ff41', fontWeight: 'bold' }}>{Number(perfume.total).toLocaleString()}</div>
                </div>
              </div>

              <button 
                onClick={() => handleBuyPerfume(perfume)}
                disabled={processingId === perfume.id || isOwned}
                style={{ 
                  width: '100%', background: isOwned ? '#1a3c1a' : '#00ff41', 
                  color: isOwned ? '#00ff41' : '#000', fontWeight: 'bold', 
                  padding: '15px', borderRadius: '10px', border: isOwned ? '1px solid #00ff41' : 'none', 
                  cursor: (processingId === perfume.id || isOwned) ? 'not-allowed' : 'pointer', 
                  fontSize: '1.1rem',
                  transition: '0.2s'
                }}
              >
                {processingId === perfume.id 
                  ? 'Processing...' 
                  : isOwned 
                    ? (perfume.plan_type === 'daily' ? 'Active' : 'Locked in') 
                    : (perfume.plan_type === 'daily' ? 'Buy' : 'Lock in')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}