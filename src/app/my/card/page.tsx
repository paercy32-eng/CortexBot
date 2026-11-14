'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function BindCard() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchCardDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('bound_name, bound_phone')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFullName(profile.bound_name || '');
        setPhone(profile.bound_phone || '');
      }
      setLoading(false);
    };
    fetchCardDetails();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setIsError(false);

    try {
      if (fullName.trim().length < 2) throw new Error("Please enter a valid full name.");
      if (phone.trim().length < 9) throw new Error("Please enter a valid phone number.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from('profiles')
        .update({ 
          bound_name: fullName.trim(), 
          bound_phone: phone.trim() 
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Card details saved successfully!');
      setIsError(false);
    } catch (error: any) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #333' }}>
        <button onClick={() => router.push('/my')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#00bfff', flex: 1, textAlign: 'center' }}>
          Bind Account
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '30px 20px' }}>
        
        <p style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center', marginBottom: '30px', lineHeight: '1.5' }}>
          Enter the exact name and mobile money number you want to use for withdrawals.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Full Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Full Name (Registered)</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>Mobile Money Number</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <input 
                type="tel" 
                placeholder="e.g. 0771234567" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', padding: '18px 18px 18px 45px', backgroundColor: 'transparent', border: '1px solid #00bfff', borderRadius: '30px', color: 'white', fontSize: '1rem', outline: 'none' }}
              />
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div style={{ padding: '15px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem', backgroundColor: isError ? 'rgba(255,0,0,0.1)' : 'rgba(0,255,0,0.1)', color: isError ? '#ff4444' : '#00ff00' }}>
              {message}
            </div>
          )}

          {/* Save Button */}
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              padding: '18px', marginTop: '10px',
              backgroundColor: 'transparent', border: '1px solid #00bfff', 
              borderRadius: '30px', color: '#00bfff', fontSize: '1.1rem', 
              fontFamily: 'Playfair Display, serif', cursor: saving ? 'not-allowed' : 'pointer', 
              boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)' 
            }}
          >
            {saving ? 'Saving...' : 'Save Account Details'}
          </button>
        </form>
      </div>
    </div>
  );
                         }
