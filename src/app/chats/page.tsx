'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Chats() {
  const [assignedManager, setAssignedManager] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // Manager Data (Using placeholders for images, you can replace URLs later)
  const managers = [
    {
      id: 'james',
      name: 'James',
      role: 'Account Manager',
      telegram: 'cnsko09',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 'sarah',
      name: 'Sarah',
      role: 'Support Specialist',
      telegram: 'aaaaa56590p',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop',
    },
    {
      id: 'molly',
      name: 'Molly',
      role: 'AI Platform Assistant',
      telegram: 'root67u',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=400&auto=format&fit=crop',
    }
  ];

  useEffect(() => {
    const fetchManager = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('assigned_manager')
        .eq('id', user.id)
        .single();

      if (profile && profile.assigned_manager) {
        setAssignedManager(profile.assigned_manager);
      }
      setLoading(false);
    };
    fetchManager();
  }, [router, supabase]);

  const handleSelectManager = async (manager: any) => {
    if (processing) return;
    setProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // 1. Save the manager to the database so they can't change it later
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_manager: manager.id })
        .eq('id', user.id);

      if (error) throw error;

      // 2. Update local state
      setAssignedManager(manager.id);

      // 3. Open Telegram
      window.open(`https://t.me/${manager.telegram}`, '_blank');

    } catch (error) {
      alert("Error saving manager. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>Loading...</div>;

  // Find the assigned manager object
  const currentManager = managers.find(m => m.id === assignedManager);

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #333' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#00bfff', flex: 1, textAlign: 'center' }}>
          Choose your manager
        </h1>
        <div style={{ width: '24px' }}></div> {/* Spacer for centering */}
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* If a manager is already assigned, lock the UI to only show them */}
        {assignedManager && currentManager ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px', color: '#888' }}>Your Manager</h2>
            <div style={{ width: '100%', maxWidth: '300px', background: '#0a0a0a', border: '1px solid #00bfff', borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(0,191,255,0.2)' }}>
              <img 
                src={currentManager.image} 
                alt={currentManager.name} 
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00bfff', margin: '0 auto 15px auto' }} 
              />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: '0 0 5px 0' }}>{currentManager.name}</h3>
              <p style={{ color: '#888', margin: '0 0 20px 0', fontSize: '0.9rem' }}>{currentManager.role}</p>
              
              <a 
                href={`https://t.me/${currentManager.telegram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'block', width: '100%', background: '#00bfff', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem' }}
              >
                Chat with me
              </a>
            </div>
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '20px', textAlign: 'center' }}>
              You have been permanently assigned to {currentManager.name}.
            </p>
          </div>
        ) : (
          
          /* If no manager assigned yet, show the grid */
          <>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>
              Please select a manager to proceed. You can only do this once.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              {managers.slice(0, 2).map((manager) => (
                <div key={manager.id} style={{ background: 'url("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400") center/cover', border: '1px solid #00bfff', borderRadius: '12px', padding: '15px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={manager.image} alt={manager.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00bfff', marginBottom: '10px' }} />
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', margin: '0 0 5px 0' }}>{manager.name}</h3>
                    <p style={{ color: '#ccc', margin: '0 0 15px 0', fontSize: '0.75rem' }}>{manager.role}</p>
                    <button 
                      onClick={() => handleSelectManager(manager)}
                      disabled={processing}
                      style={{ background: '#00bfff', color: '#000', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                    >
                      Chat with me
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Full width bottom card for Molly */}
            <div style={{ background: 'url("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400") center/cover', border: '1px solid #00bfff', borderRadius: '12px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}></div>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={managers[2].image} alt={managers[2].name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #00bfff', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', margin: '0 0 5px 0' }}>{managers[2].name}</h3>
                <p style={{ color: '#ccc', margin: '0 0 15px 0', fontSize: '0.85rem' }}>{managers[2].role}</p>
                <button 
                  onClick={() => handleSelectManager(managers[2])}
                  disabled={processing}
                  style={{ background: '#00bfff', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Chat with me
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
            }
