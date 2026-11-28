import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json({ ok: false, error: 'Reference is required' }, { status: 400 });
    }

    const response = await fetch(`https://api.tavupay.lat/v1/payments?reference=${reference}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.TAVUPAY_API_KEY!,
        'X-API-Secret': process.env.TAVUPAY_API_SECRET!,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: data.error || 'Failed to verify' }, { status: response.status });
    }

    if (data.status === 'successful' || data.status === 'SUCCEEDED') {
      const supabase = await createClient();

      const { data: deposit } = await supabase
        .from('pending_deposits')
        .select('user_id, amount_usd, status')
        .eq('txid', reference)
        .single();

      if (deposit && deposit.status === 'pending') {
        
        const depositAmount = Number(deposit.amount_usd);

        // 🚨 CRITICAL: Update status to success FIRST
        const { error: updateError } = await supabase
          .from('pending_deposits')
          .update({ status: 'success' })
          .eq('txid', reference);

        if (updateError) {
            console.error("Failed to update deposit status:", updateError);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('balance_usd, total_deposited')
          .eq('id', deposit.user_id)
          .single();

        if (profile) {
          const currentBalance = Number(profile.balance_usd) || 0;
          const currentTotalDeposited = Number(profile.total_deposited) || 0;

          await supabase
            .from('profiles')
            .update({ 
              balance_usd: currentBalance + depositAmount,
              total_deposited: currentTotalDeposited + depositAmount
            })
            .eq('id', deposit.user_id);
            
          await supabase.from('transactions').insert({
            user_id: deposit.user_id,
            type: 'DEPOSIT',
            amount_usd: depositAmount,
            status: 'completed'
          });
        }
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Verify Route Error:', error);
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}