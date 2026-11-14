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
      console.error('❌ Missing signature header');
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    // Read the raw body as text EXACTLY as PesaJet sent it
    const rawBody = await req.text();
    const webhookSecret = process.env.PESAJET_WEBHOOK_SECRET || '';

    // Calculate our own signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');

    // Compare signatures safely
    const a = Buffer.from(signature);
    const b = Buffer.from(digest);
    
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error('❌ Signature mismatch!');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // ✅ If we reach here, the signature is 100% valid
    console.log('✅ Signature verified successfully');
    
    const payload = JSON.parse(rawBody);
    const { event, reference } = payload;

    if (event === 'payment.completed') {
      console.log(`💰 Payment completed for ref: ${reference}`);

      const { data: deposit, error: fetchError } = await supabase
        .from('pending_deposits')
        .select('*')
        .eq('txid', reference)
        .single();

      if (fetchError || !deposit || deposit.status !== 'pending') {
        return NextResponse.json({ received: true, message: 'Already processed' });
      }

      // 🚨 CRITICAL FIX: Use the amount the user requested, NOT the PesaJet fee-inflated amount
      const depositAmount = Number(deposit.amount_usd); 

      await supabase
        .from('pending_deposits')
        .update({ status: 'verified' })
        .eq('id', deposit.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('balance_usd, total_deposited, referred_by, raffle_chances')
        .eq('id', deposit.user_id)
        .single();

      if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });

      const newBalance = Number(profile.balance_usd || 0) + depositAmount;
      const newTotalDeposited = Number(profile.total_deposited || 0) + depositAmount;
      
      let newChances = Number(profile.raffle_chances || 0);
      if (depositAmount >= 500000) newChances += 1;

      await supabase
        .from('profiles')
        .update({
          balance_usd: newBalance,
          total_deposited: newTotalDeposited,
          raffle_chances: newChances
        })
        .eq('id', deposit.user_id);

      // 12% Level 1 Commission
      if (profile.referred_by) {
        const commissionAmount = depositAmount * 0.12;
        const { data: referrer } = await supabase
          .from('profiles')
          .select('balance_usd, team_commission')
          .eq('id', profile.referred_by)
          .single();

        if (referrer) {
          await supabase
            .from('profiles')
            .update({ 
              balance_usd: Number(referrer.balance_usd || 0) + commissionAmount,
              team_commission: Number(referrer.team_commission || 0) + commissionAmount
            })
            .eq('id', profile.referred_by);

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
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
