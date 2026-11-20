import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // 1. Get the raw body as text
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('X-Webhook-Signature');
    const webhookSecret = process.env.PESAJET_WEBHOOK_SECRET || '';

    // 2. Verify Signature
    if (signature) {
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const digest = hmac.update(rawBody).digest('hex');
      
      const a = Buffer.from(signature);
      const b = Buffer.from(digest);
      
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        console.error('❌ Webhook signature mismatch');
        // We log it but don't return 401 immediately so we can debug the payload below if it's a false negative
      } else {
        console.log('✅ Webhook signature verified');
      }
    } else {
      console.log('⚠️ No signature header found, proceeding to parse body anyway for debugging.');
    }

    // 3. Parse the payload
    const payload = JSON.parse(rawBody);
    console.log('📦 PesaJet Webhook Payload:', JSON.stringify(payload, null, 2));

    // PesaJet might send the event in different formats. Let's handle the most common ones.
    const event = payload.event || payload.event_type;
    const status = payload.status || payload.transaction?.status;
    
    // Find the reference. It might be at the root, or inside 'data' or 'transaction'
    const reference = payload.reference || payload.data?.reference || payload.transaction?.reference;

    if (!reference) {
      console.error('❌ No reference found in payload');
      return NextResponse.json({ error: 'No reference' }, { status: 400 });
    }

    // 4. Process if successful
    if (event === 'payment.completed' || event === 'collection.completed' || status === 'COMPLETED' || status === 'SUCCESSFUL') {
      console.log(`💰 Payment completed for ref: ${reference}`);

      // Atomic Update: Only process if status is STILL 'pending'
      const { data: deposit, error: updateError } = await supabase
        .from('pending_deposits')
        .update({ status: 'verified' })
        .eq('txid', reference)
        .eq('status', 'pending')
        .select()
        .single();

      if (updateError || !deposit) {
        console.log(`⚠️ Deposit already processed or not found for ref: ${reference}`);
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      const depositAmount = Number(deposit.amount_usd);

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, total_deposited, referred_by, raffle_chances')
        .eq('id', deposit.user_id)
        .single();

      if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      // Calculate balances and raffle chances (Changed to 100,000)
      let newChances = Number(profile.raffle_chances || 0);
      if (depositAmount >= 100000) {
        newChances += 1;
        console.log(`🎟️ Awarded 1 raffle chance to user ${deposit.user_id}`);
      }

      await supabase.from('profiles').update({
        balance_usd: Number(profile.balance_usd || 0) + depositAmount,
        total_deposited: Number(profile.total_deposited || 0) + depositAmount,
        raffle_chances: newChances
      }).eq('id', deposit.user_id);

      // Give 12% Commission to Level 1 Referrer
      if (profile.referred_by) {
        const commissionAmount = depositAmount * 0.12;
        const { data: referrer } = await supabase
          .from('profiles')
          .select('withdrawable_balance')
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
      console.log(`✅ Successfully credited ${depositAmount} to user ${deposit.user_id}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
