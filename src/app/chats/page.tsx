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

  // Updated Manager Data for Fragrance Files
  const managers = [
    {
      id: 'camara',
      name: 'Camara',
      role: 'Senior Fragrance Consultant',
      telegram: 'Camara0899',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop', // Professional male portrait
    },
    {
      id: 'amina',
      name: 'Amina',
      role: 'VIP Client Advisor',
      telegram: 'aaaaa565800',
      image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop', // Professional female portrait
    },
    {
      id: 'chen',
      name: 'Chen',
      role: 'Fragrance Concierge',
      telegram: 'cnsko09',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop', // Another professional portrait
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

      const { error } = await supabase
        .from('profiles')
        .update({ assigned_manager: manager.id })
        .eq('id', user.id);

      if (error) throw error;

      setAssignedManager(manager.id);
      window.open(`https://t.me/${manager.telegram}`, '_blank');

    } catch (error) {
      alert("Error saving manager. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ color: '#D4AF37', padding: '20px', textAlign: 'center', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>Loading...</div>;

  const currentManager = managers.find(m => m.id === assignedManager);

  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', color: 'white', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 15px', borderBottom: '1px solid #222' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: 0, color: '#D4AF37', flex: 1, textAlign: 'center' }}>
          Choose your consultant
        </h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div style={{ padding: '20px 15px' }}>
        
        {/* If a manager is already assigned */}
        {assignedManager && currentManager ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '20px', color: '#A0A0A0' }}>Your Personal Consultant</h2>
            <div style={{ width: '100%', maxWidth: '300px', background: '#111', border: '1px solid #D4AF37', borderRadius: '16px', padding: '20px', textAlign: 'center', boxShadow: '0 0 20px rgba(212, 175, 55, 0.15)' }}>
              <img 
                src={currentManager.image} 
                alt={currentManager.name} 
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D4AF37', margin: '0 auto 15px auto' }} 
              />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', margin: '0 0 5px 0' }}>{currentManager.name}</h3>
              <p style={{ color: '#A0A0A0', margin: '0 0 20px 0', fontSize: '0.9rem' }}>{currentManager.role}</p>
              
              <a 
                href={`https://t.me/${currentManager.telegram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'block', width: '100%', background: '#D4AF37', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem' }}
              >
                Chat on Telegram
              </a>
            </div>
            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '20px', textAlign: 'center' }}>
              You have been permanently assigned to {currentManager.name}.
            </p>
          </div>
        ) : (
          
          /* If no manager assigned yet */
          <>
            <p style={{ color: '#A0A0A0', fontSize: '0.9rem', marginBottom: '20px' }}>
              Please select a consultant to proceed. You can only do this once.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              {managers.slice(0, 2).map((manager) => (
                <div key={manager.id} style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '15px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={manager.image} alt={manager.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37', marginBottom: '10px' }} />
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', margin: '0 0 5px 0' }}>{manager.name}</h3>
                    <p style={{ color: '#A0A0A0', margin: '0 0 15px 0', fontSize: '0.75rem' }}>{manager.role}</p>
                    <button 
                      onClick={() => handleSelectManager(manager)}
                      disabled={processing}
                      style={{ background: 'transparent', color: '#D4AF37', border: '1px solid #D4AF37', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                    >
                      Chat with me
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Full width bottom card */}
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={managers[2].image} alt={managers[2].name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37', marginBottom: '10px' }} />
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', margin: '0 0 5px 0' }}>{managers[2].name}</h3>
                <p style={{ color: '#A0A0A0', margin: '0 0 15px 0', fontSize: '0.85rem' }}>{managers[2].role}</p>
                <button 
                  onClick={() => handleSelectManager(managers[2])}
                  disabled={processing}
                  style={{ background: '#D4AF37', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
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