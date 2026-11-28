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
  const [searchQuery, setSearchQuery] = useState('');
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
      alert(`Insufficient ${balanceName}!\n\nYou need ${perfume.price.toLocaleString()} UGX to proceed.`);
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

  const filteredPerfumes = perfumes.filter(p => {
    const matchesTab = activeTab === 'All' || p.category === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a', color: '#D4AF37' }}>
      <svg className="spinner" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
      </svg>
      <style>{`.spinner { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '20px 15px', backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '80px' }}>
      
      {/* Header & Search */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem', color: '#D4AF37', margin: '0 0 15px 0' }}>The Collection</h1>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search fragrances..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '25px', border: '1px solid #333', background: '#111', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />
          <svg style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', stroke: '#888' }} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid #222', paddingBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {['All', 'Men', 'Women', 'Unisex'].map((tab) => (
          <span 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              color: activeTab === tab ? '#D4AF37' : '#666', 
              fontWeight: activeTab === tab ? 'bold' : 'normal', 
              whiteSpace: 'nowrap', 
              borderBottom: activeTab === tab ? '2px solid #D4AF37' : 'none', 
              paddingBottom: '9px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              letterSpacing: '1px'
            }}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Perfume Grid (2 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {filteredPerfumes.map((perfume: any) => {
          const ownedPerfume = userPerfumes.find(r => r.perfume_name === perfume.name && r.status === 'active');
          const isOwned = !!ownedPerfume;

          return (
            <div key={perfume.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '10px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              <div style={{ height: '140px', background: '#000', borderRadius: '10px', marginBottom: '10px', overflow: 'hidden', position: 'relative' }}>
                <img src={perfume.image} alt={perfume.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: '1px solid #D4AF37', color: '#D4AF37', padding: '2px 8px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {perfume.category}
                </div>
              </div>
              
              <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{perfume.name}</h4>
              <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 10px 0' }}>{perfume.brand}</p>
              
              {/* Price & Yield Info */}
              <div style={{ marginTop: 'auto', background: '#0a0a0a', borderRadius: '8px', padding: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#666' }}>Price</span>
                  <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 'bold' }}>{Number(perfume.price).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#666' }}>Daily</span>
                  <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 'bold' }}>{Number(perfume.daily).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', color: '#666' }}>Cycle</span>
                  <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 'bold' }}>{perfume.cycle} Days</span>
                </div>
              </div>

              <button 
                onClick={() => handleBuyPerfume(perfume)}
                disabled={processingId === perfume.id || isOwned}
                style={{ 
                  width: '100%', background: isOwned ? '#222' : '#D4AF37', 
                  color: isOwned ? '#D4AF37' : '#000', fontWeight: 'bold', 
                  padding: '10px', borderRadius: '8px', border: isOwned ? '1px solid #D4AF37' : 'none', 
                  cursor: (processingId === perfume.id || isOwned) ? 'not-allowed' : 'pointer', 
                  fontSize: '0.85rem',
                  transition: '0.2s'
                }}
              >
                {processingId === perfume.id 
                  ? '...' 
                  : isOwned 
                    ? 'Owned' 
                    : 'Buy'}
              </button>
            </div>
          );
        })}
      </div>
      
      {filteredPerfumes.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          No fragrances found.
        </div>
      )}
    </div>
  );
}