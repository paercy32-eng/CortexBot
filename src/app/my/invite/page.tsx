'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function InvitePage() {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralLink, setReferralLink] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchInviteData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profile && profile.referral_code) {
        setReferralCode(profile.referral_code);
        
        // Use the environment variable, or fallback to the current origin
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        setReferralLink(`${baseUrl}/register?ref=${profile.referral_code}`);
      }

      // 2. Fetch all users directly referred by this user
      const { data: directReferrals } = await supabase
        .from('profiles')
        .select('full_name, phone, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      if (directReferrals) {
        setReferrals(directReferrals);
      }

      // 3. Fetch total commission earned
      const { data: commissions } = await supabase
        .from('transactions')
        .select('amount_usd')
        .eq('user_id', user.id)
        .eq('type', 'COMMISSION');

      if (commissions) {
        const total = commissions.reduce((sum, tx) => sum + Number(tx.amount_usd), 0);
        setTotalCommission(total);
      }

      setLoading(false);
    };
    fetchInviteData();
  }, [router, supabase]);

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #222' }}>
        <button onClick={() => router.push('/my')} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#D4AF37', flex: 1, textAlign: 'center' }}>
          Invite & Earn
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* Rules Notice */}
        <div style={{ border: '1px solid #D4AF37', borderRadius: '12px', padding: '15px', textAlign: 'center', backgroundColor: 'rgba(212, 175, 55, 0.05)', marginBottom: '20px' }}>
          <p style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '0.9rem', lineHeight: '1.5', color: '#ccc' }}>
            Earn <strong style={{color: '#D4AF37'}}>12% commission</strong> on every deposit made by your direct Level 1 referrals.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#888' }}>Total Invites</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{referrals.length}</h3>
          </div>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#888' }}>Commission Earned</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#D4AF37' }}>{totalCommission.toLocaleString()} UGX</h3>
          </div>
        </div>

        {/* Referral Code Section */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Your Referral Code</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={referralCode || 'Loading...'} 
              readOnly 
              style={{ flex: 1, padding: '15px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: 'bold', outline: 'none' }}
            />
            <button 
              onClick={() => copyToClipboard(referralCode, 'code')}
              style={{ padding: '0 20px', backgroundColor: '#D4AF37', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Referral Link Section */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Your Invite Link</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={referralLink || 'Loading...'} 
              readOnly 
              style={{ flex: 1, padding: '15px', backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
            <button 
              onClick={() => copyToClipboard(referralLink, 'link')}
              style={{ padding: '0 20px', backgroundColor: '#D4AF37', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {copiedLink ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Referrals List */}
        <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37', fontSize: '1.2rem', marginBottom: '15px' }}>My Direct Referrals</h3>
        
        {referrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#111', borderRadius: '12px', border: '1px dashed #333' }}>
            <p style={{ color: '#888', margin: 0 }}>You haven't invited anyone yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {referrals.map((ref, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', border: '1px solid #222', padding: '15px', borderRadius: '10px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff' }}>{ref.full_name || 'Anonymous User'}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{ref.phone}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#D4AF37' }}>
                    {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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