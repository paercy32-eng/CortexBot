import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const rawBody = await req.text();
    const webhookSecret = process.env.PESAJET_WEBHOOK_SECRET || '';

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');

    const a = Buffer.from(signature);
    const b = Buffer.from(digest);
    
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, reference } = payload;

    if (event === 'payment.completed') {
      
      // 1. Atomic Update: Only process if status is STILL 'pending'
      const { data: deposit, error: updateError } = await supabase
        .from('pending_deposits')
        .update({ status: 'verified' })
        .eq('txid', reference)
        .eq('status', 'pending') // 🚨 This prevents double-crediting
        .select()
        .single();

      // If no data returned, it means it was already processed by the polling system
      if (updateError || !deposit) {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      const depositAmount = Number(deposit.amount_usd);

      // 2. Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, total_deposited, referred_by, raffle_chances')
        .eq('id', deposit.user_id)
        .single();

      if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });

      // 3. Calculate balances and raffle chances
      let newChances = Number(profile.raffle_chances || 0);
      if (depositAmount >= 500000) newChances += 1;

      await supabase.from('profiles').update({
        balance_usd: Number(profile.balance_usd || 0) + depositAmount,
        total_deposited: Number(profile.total_deposited || 0) + depositAmount,
        raffle_chances: newChances
      }).eq('id', deposit.user_id);

      // 4. Give 12% Commission to Level 1 Referrer
      if (profile.referred_by) {
        const commissionAmount = depositAmount * 0.12;
        
        const { data: referrer } = await supabase
          .from('profiles')
          .select('withdrawable_balance') // Commission goes to Withdrawable
          .eq('id', profile.referred_by)
          .single();

        if (referrer) {
          await supabase.from('profiles').update({
            withdrawable_balance: Number(referrer.withdrawable_balance || 0) + commissionAmount
          }).eq('id', profile.referred_by);

          await supabase.from('transactions').insert({
            user_id: profile.referred_by,
            type: 'COMMISSION',
            amount_usd: commissionAmount,
            status: 'completed'
          });
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
