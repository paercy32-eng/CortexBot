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
    const payload = JSON.parse(rawBody);

    const webhookSecret = process.env.PESAJET_WEBHOOK_SECRET || '';
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');

    if (digest !== signature) {
      console.error('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const { event, amount, reference } = payload;

    if (event === 'payment.completed') {
      console.log(`Payment completed for ref: ${reference}`);

      const { data: deposit, error: fetchError } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('txid', reference)
        .single();

      if (fetchError || !deposit || deposit.status !== 'pending') {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      const depositAmount = Number(amount);

      await supabase
        .from('pending_deposits')
        .update({ status: 'verified' })
        .eq('id', deposit.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, total_deposited, referred_by')
        .eq('id', deposit.user_id)
        .single();

      // 🚨 THIS IS THE FIX: Check if profile exists to satisfy TypeScript
      if (!profile) {
        console.error('Profile not found for user:', deposit.user_id);
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      await supabase
        .from('profiles')
        .update({
          balance_usd: Number(profile.balance_usd || 0) + depositAmount,
          total_deposited: Number(profile.total_deposited || 0) + depositAmount
        })
        .eq('id', deposit.user_id);

      let currentReferrer = profile.referred_by;
      const commissions = [0.25, 0.02, 0.01];

      for (let i = 0; i < commissions.length; i++) {
        if (!currentReferrer) break;

        const commissionAmount = depositAmount * commissions[i];
        
        const { data: referrer } = await supabase
          .from('profiles')
          .select('balance_usd, referred_by')
          .eq('id', currentReferrer)
          .single();

        if (!referrer) break;

        await supabase
          .from('profiles')
          .update({ balance_usd: Number(referrer.balance_usd || 0) + commissionAmount })
          .eq('id', currentReferrer);

        await supabase.from('transactions').insert({
          user_id: currentReferrer,
          type: 'COMMISSION',
          amount_usd: commissionAmount,
          status: 'completed'
        });

        currentReferrer = referrer.referred_by;
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
