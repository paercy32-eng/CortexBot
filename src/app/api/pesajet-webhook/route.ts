import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// We use the SERVICE_ROLE_KEY here because webhooks don't have a logged-in user.
// This allows the system to update any user's balance securely.
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

    // 1. Get the RAW text body (Crucial for HMAC verification)
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // 2. Verify the HMAC-SHA256 Signature
    const webhookSecret = process.env.PESAJET_WEBHOOK_SECRET || '';
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');

    if (digest !== signature) {
      console.error('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Process the event
    const { event, amount, reference } = payload;

    if (event === 'payment.completed') {
      console.log(`Payment completed for ref: ${reference}`);

      // 4. Find the pending deposit
      const { data: deposit, error: fetchError } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('txid', reference)
        .single();

      // If deposit doesn't exist or is already processed, ignore
      if (fetchError || !deposit || deposit.status !== 'pending') {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      const depositAmount = Number(amount);

      // 5. Mark deposit as verified
      await supabase
        .from('pending_deposits')
        .update({ status: 'verified' })
        .eq('id', deposit.id);

      // 6. Credit the User's balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, total_deposited, referred_by')
        .eq('id', deposit.user_id)
        .single();

      await supabase
        .from('profiles')
        .update({
          balance_usd: Number(profile.balance_usd || 0) + depositAmount,
          total_deposited: Number(profile.total_deposited || 0) + depositAmount
        })
        .eq('id', deposit.user_id);

      // 7. Process Multi-Level Commissions (25%, 2%, 1%)
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

        // Log the commission
        await supabase.from('transactions').insert({
          user_id: currentReferrer,
          type: 'COMMISSION',
          amount_usd: commissionAmount,
          status: 'completed'
        });

        currentReferrer = referrer.referred_by;
      }
    }

    // Always return 200 quickly so PesaJet knows we received it
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
          }
