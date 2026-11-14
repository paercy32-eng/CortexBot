'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminWithdrawals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchRequests = async () => {
    setLoading(true);
    // Fetch pending withdrawals and join with the user's profile to get their name and phone
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        profiles (
          full_name,
          phone
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }); // Oldest first

    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') return router.push('/');

      fetchRequests();
    };
    checkAdmin();
  }, [router, supabase]);

  const handleApprove = async (request: any) => {
    if (!confirm(`Confirm you have sent ${Number(request.amount_usd).toLocaleString()} UGX to ${request.profiles?.phone}?`)) return;
    setProcessing(request.id);

    try {
      // 1. Update request status to approved
      const { error: reqError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // 2. Update user's total withdrawn amount
      const { data: profile } = await supabase.from('profiles').select('total_withdrawn').eq('id', request.user_id).single();
      
      await supabase.from('profiles').update({
        total_withdrawn: Number(profile?.total_withdrawn || 0) + Number(request.amount_usd)
      }).eq('id', request.user_id);

      alert('Withdrawal approved successfully!');
      fetchRequests(); // Refresh list

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: any) => {
    if (!confirm(`Are you sure you want to reject this request? The ${Number(request.amount_usd).toLocaleString()} UGX will be refunded to the user's balance.`)) return;
    setProcessing(request.id);

    try {
      // 1. Update request status to rejected
      const { error: reqError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // 2. Refund the amount back to the user's wallet balance
      const { data: profile } = await supabase.from('profiles').select('balance_usd').eq('id', request.user_id).single();
      
      await supabase.from('profiles').update({
        balance_usd: Number(profile?.balance_usd || 0) + Number(request.amount_usd)
      }).eq('id', request.user_id);

      alert('Withdrawal rejected and funds refunded to user.');
      fetchRequests(); // Refresh list

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Loading Requests...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', padding: '20px 15px', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>Pending Withdrawals</h1>
      </div>

      {requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px dashed #333' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" style={{ marginBottom: '15px' }}>
             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          <p style={{ color: '#888', margin: 0 }}>No pending withdrawal requests.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {requests.map((req) => (
            <div key={req.id} style={{ background: '#121c2d', border: '1px solid #333', borderRadius: '12px', padding: '15px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#fff' }}>{req.profiles?.full_name || 'User'}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', fontFamily: 'monospace' }}>{req.profiles?.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888' }}>Requested On</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#ccc' }}>
                    {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.85rem', color: '#888' }}>Amount to Send:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00ff00' }}>{Number(req.amount_usd).toLocaleString()} UGX</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => handleApprove(req)}
                  disabled={processing === req.id}
                  style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#00ff00', color: '#000', fontWeight: 'bold', cursor: processing === req.id ? 'not-allowed' : 'pointer', opacity: processing === req.id ? 0.5 : 1 }}
                >
                  {processing === req.id ? 'Processing...' : 'Approve'}
                </button>
                
                <button 
                  onClick={() => handleReject(req)}
                  disabled={processing === req.id}
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ff4444', backgroundColor: 'transparent', color: '#ff4444', fontWeight: 'bold', cursor: processing === req.id ? 'not-allowed' : 'pointer', opacity: processing === req.id ? 0.5 : 1 }}
                >
                  {processing === req.id ? 'Processing...' : 'Reject'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
              }
