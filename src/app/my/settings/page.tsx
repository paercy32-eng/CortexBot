'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  // Card details state
  const [boundName, setBoundName] = useState('');
  const [boundPhone, setBoundPhone] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const [cardMsg, setCardMsg] = useState({ text: '', isError: false });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
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
        setBoundName(profile.bound_name || '');
        setBoundPhone(profile.bound_phone || '');
      }
      setLoading(false);
    };
    fetchUserData();
  }, [router, supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg({ text: '', isError: false });

    try {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordMsg({ text: 'Password updated successfully!', isError: false });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordMsg({ text: error.message, isError: true });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCard(true);
    setCardMsg({ text: '', isError: false });

    try {
      if (boundName.trim().length < 2) throw new Error("Please enter a valid full name.");
      if (boundPhone.trim().length < 9) throw new Error("Please enter a valid phone number.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from('profiles')
        .update({ bound_name: boundName.trim(), bound_phone: boundPhone.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setCardMsg({ text: 'Card details updated successfully!', isError: false });
    } catch (error: any) {
      setCardMsg({ text: error.message, isError: true });
    } finally {
      setSavingCard(false);
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
          Settings
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Update Password Section */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#00bfff', marginBottom: '20px', marginTop: 0 }}>Update Password</h2>
          
          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input 
                type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                style={{ width: '100%', padding: '15px 15px 15px 45px', backgroundColor: '#121c2d', border: '1px solid #00bfff', borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none' }} 
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input 
                type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                style={{ width: '100%', padding: '15px 15px 15px 45px', backgroundColor: '#121c2d', border: '1px solid #00bfff', borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none' }} 
              />
            </div>

            {passwordMsg.text && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: passwordMsg.isError ? '#ff4444' : '#00ff00' }}>{passwordMsg.text}</p>
            )}

            <button type="submit" disabled={savingPassword} style={{ padding: '12px', backgroundColor: '#00bfff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: savingPassword ? 'not-allowed' : 'pointer', opacity: savingPassword ? 0.7 : 1 }}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Update Card Details Section */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: '#00bfff', marginBottom: '20px', marginTop: 0 }}>Card Details</h2>
          
          <form onSubmit={handleUpdateCard} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input 
                type="text" placeholder="Registered Full Name" value={boundName} onChange={(e) => setBoundName(e.target.value)} required
                style={{ width: '100%', padding: '15px 15px 15px 45px', backgroundColor: '#121c2d', border: '1px solid #00bfff', borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none' }} 
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888', width: '20px', height: '20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <input 
                type="tel" placeholder="Mobile Money Number" value={boundPhone} onChange={(e) => setBoundPhone(e.target.value)} required
                style={{ width: '100%', padding: '15px 15px 15px 45px', backgroundColor: '#121c2d', border: '1px solid #00bfff', borderRadius: '8px', color: 'white', fontSize: '0.95rem', outline: 'none' }} 
              />
            </div>

            {cardMsg.text && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: cardMsg.isError ? '#ff4444' : '#00ff00' }}>{cardMsg.text}</p>
            )}

            <button type="submit" disabled={savingCard} style={{ padding: '12px', backgroundColor: '#00bfff', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: savingCard ? 'not-allowed' : 'pointer', opacity: savingCard ? 0.7 : 1 }}>
              {savingCard ? 'Saving...' : 'Update Card Details'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
