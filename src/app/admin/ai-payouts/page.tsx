'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AiPayouts() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const supabase = createClient();
  const router = useRouter();

  const processPayouts = async () => {
    if (!confirm('This will calculate daily AI income for all active robots and unlock any finished cycles. Proceed?')) return;
    
    setLoading(true);
    setLogs(['Starting processing...']);

    try {
      // 1. Fetch all active robots
      const { data: activeRobots, error: robotError } = await supabase
        .from('user_robots')
        .select('*')
        .eq('status', 'active');

      if (robotError) throw robotError;
      if (!activeRobots || activeRobots.length === 0) {
        setLogs(prev => [...prev, 'No active robots found.']);
        setLoading(false);
        return;
      }

      let processedCount = 0;

      for (const bot of activeRobots) {
        const createdDate = new Date(bot.created_at);
        const now = new Date();
        const diffTime = now.getTime() - createdDate.getTime();
        const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Check if there are new days to pay
        if (daysElapsed > (bot.days_paid || 0)) {
          let daysToPay = daysElapsed - (bot.days_paid || 0);
          
          // Cap at cycle_days so we don't overpay
          if (daysElapsed > bot.cycle_days) {
            daysToPay = bot.cycle_days - (bot.days_paid || 0);
          }

          if (daysToPay > 0) {
            const amountToPay = daysToPay * Number(bot.daily_income);

            // Fetch current profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('locked_ai_income')
              .eq('id', bot.user_id)
              .single();

            // Add to Locked Income
            await supabase
              .from('profiles')
              .update({ locked_ai_income: Number(profile?.locked_ai_income || 0) + amountToPay })
              .eq('id', bot.user_id);

            // Update days paid on robot
            await supabase
              .from('user_robots')
              .update({ days_paid: daysElapsed })
              .eq('id', bot.id);

            setLogs(prev => [...prev, `Paid ${amountToPay.toLocaleString()} UGX to user ${bot.user_id.substring(0,5)}... (Locked)`]);
          }
        }

        // Check if cycle has ended
        if (daysElapsed >= bot.cycle_days && bot.status === 'active') {
          const totalIncome = bot.cycle_days * Number(bot.daily_income);

          const { data: profile } = await supabase
            .from('profiles')
            .select('locked_ai_income, withdrawable_balance')
            .eq('id', bot.user_id)
            .single();

          // Move from Locked to Withdrawable
          await supabase
            .from('profiles')
            .update({ 
              locked_ai_income: Math.max(0, Number(profile?.locked_ai_income || 0) - totalIncome),
              withdrawable_balance: Number(profile?.withdrawable_balance || 0) + totalIncome
            })
            .eq('id', bot.user_id);

          // Mark robot as completed
          await supabase
            .from('user_robots')
            .update({ status: 'completed' })
            .eq('id', bot.id);

          setLogs(prev => [...prev, `🔓 Unlocked ${totalIncome.toLocaleString()} UGX for user ${bot.user_id.substring(0,5)}... (Cycle Finished)`]);
        }
        
        processedCount++;
      }

      setLogs(prev => [...prev, `Successfully processed ${processedCount} active robots!`]);

    } catch (err: any) {
      setLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: 'white', padding: '20px 15px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: '#00bfff', cursor: 'pointer', marginRight: '15px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#00bfff', margin: 0 }}>AI Payouts</h1>
      </div>

      <div style={{ background: '#121c2d', border: '1px solid #333', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '0.9rem', color: '#ccc', lineHeight: '1.5', marginBottom: '20px' }}>
          Clicking this button will scan all active robots. It will add their daily income to the user's <strong>Locked Balance</strong>. If a robot's cycle has finished, it will move that money to the user's <strong>Withdrawable Balance</strong>.
        </p>

        <button 
          onClick={processPayouts}
          disabled={loading}
          style={{ width: '100%', padding: '15px', borderRadius: '8px', border: 'none', background: '#00bfff', color: '#000', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Processing Robots...' : 'Process Daily AI Income'}
        </button>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '15px', maxHeight: '400px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px', marginTop: 0 }}>Processing Logs</h3>
          {logs.map((log, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: log.includes('Error') ? '#ff4444' : log.includes('🔓') ? '#00ff00' : '#ccc', marginBottom: '5px', fontFamily: 'monospace' }}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
        }
