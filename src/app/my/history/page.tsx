'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      let combinedHistory: any[] = [];

      // 1. Fetch Deposits
      const { data: deposits } = await supabase
        .from('pending_deposits')
        .select('amount_usd, status, created_at')
        .eq('user_id', user.id);
      
      if (deposits) {
        deposits.forEach(d => combinedHistory.push({
          type: 'deposit',
          title: 'Deposit',
          amount: Number(d.amount_usd),
          status: d.status,
          date: new Date(d.created_at)
        }));
      }

      // 2. Fetch Withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('amount_usd, status, created_at')
        .eq('user_id', user.id);
      
      if (withdrawals) {
        withdrawals.forEach(w => combinedHistory.push({
          type: 'withdrawal',
          title: 'Withdrawal',
          amount: Number(w.amount_usd),
          status: w.status,
          date: new Date(w.created_at)
        }));
      }

      // 3. Fetch Commissions / Salaries (From transactions table)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_usd, type, status, created_at')
        .eq('user_id', user.id);
      
      if (transactions) {
        transactions.forEach(t => combinedHistory.push({
          type: t.type === 'COMMISSION' ? 'commission' : 'salary',
          title: t.type === 'COMMISSION' ? 'Referral Commission' : 'Fragrance Yield',
          amount: Number(t.amount_usd),
          status: t.status,
          date: new Date(t.created_at)
        }));
      }

      // 4. Fetch Raffle Wins
      const { data: raffles } = await supabase
        .from('raffle_history')
        .select('perfume_name, won_at')
        .eq('user_id', user.id);
      
      if (raffles) {
        raffles.forEach(r => combinedHistory.push({
          type: 'raffle',
          title: `Won: ${r.perfume_name}`,
          amount: 0, 
          status: 'completed',
          date: new Date(r.won_at)
        }));
      }

      // Sort all history by date (Newest first)
      combinedHistory.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setHistoryList(combinedHistory);
      setLoading(false);
    };
    
    fetchHistory();
  }, [router, supabase]);

  const filteredHistory = activeTab === 'all' 
    ? historyList 
    : historyList.filter(item => item.type === activeTab);

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #222' }}>
        <button onClick={() => router.push('/my')} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#D4AF37', flex: 1, textAlign: 'center' }}>
          Bill & History
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', padding: '15px', overflowX: 'auto', borderBottom: '1px solid #222', scrollbarWidth: 'none' }}>
        {['all', 'deposit', 'withdrawal', 'commission', 'raffle'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '20px', 
              border: `1px solid ${activeTab === tab ? '#D4AF37' : '#333'}`,
              backgroundColor: activeTab === tab ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
              color: activeTab === tab ? '#D4AF37' : '#888',
              fontWeight: 'bold',
              textTransform: 'capitalize',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* History List */}
      <div style={{ padding: '15px' }}>
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" style={{ marginBottom: '15px' }}>
               <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <p style={{ color: '#888' }}>No {activeTab === 'all' ? '' : activeTab} records found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredHistory.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', border: '1px solid #222', padding: '15px', borderRadius: '12px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* Icon based on type */}
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backgroundColor: item.type === 'deposit' ? 'rgba(212, 175, 55, 0.1)' : item.type === 'withdrawal' ? 'rgba(255,0,0,0.1)' : item.type === 'raffle' ? 'rgba(255,165,0,0.1)' : 'rgba(212, 175, 55, 0.1)'
                  }}>
                    {item.type === 'deposit' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>}
                    {item.type === 'withdrawal' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>}
                    {item.type === 'commission' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                    {item.type === 'salary' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
                    {item.type === 'raffle' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffa500" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  </div>
                  
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                      {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {item.amount > 0 && (
                    <p style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 'bold', color: item.type === 'withdrawal' ? '#ff4444' : '#D4AF37' }}>
                      {item.type === 'withdrawal' ? '-' : '+'}{item.amount.toLocaleString()} UGX
                    </p>
                  )}
                  <p style={{ 
                    margin: 0, fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold',
                    color: item.status === 'completed' || item.status === 'verified' || item.status === 'approved' || item.status === 'success' ? '#D4AF37' : 
                           item.status === 'pending' ? '#ffa500' : '#ff4444'
                  }}>
                    {item.status}
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