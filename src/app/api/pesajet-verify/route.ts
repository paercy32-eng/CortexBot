import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PesaJet } from '@pesajet/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { reference } = await req.json();

    const pesajet = new PesaJet({
      apiKey: process.env.PESAJET_API_KEY || "YOUR_API_KEY_HERE",
    });

    // 1. Ask PesaJet for the status
    let isPaid = false;
    try {
      const payment = await pesajet.payments.get(reference);
      
      // Cast status to string to bypass the missing "COMPLETED" type in the SDK
      const currentStatus = String(payment?.status);
      
      if (currentStatus === 'COMPLETED' || currentStatus === 'SUCCESSFUL') {
        isPaid = true;
      }
    } catch (err) {
      // If fetching by reference fails, we return false and let the webhook handle the credit.
      return NextResponse.json({ success: false, message: 'Waiting for webhook' });
    }

    if (!isPaid) {
      return NextResponse.json({ success: false, message: 'Payment not completed yet' });
    }

    // 2. Find the pending deposit
    const { data: deposit } = await supabase
      .from('pending_deposits')
      .select('*')
      .eq('txid', reference)
      .single();

    if (!deposit || deposit.status !== 'pending') {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const depositAmount = Number(deposit.amount_usd);

    // 3. Mark as verified
    await supabase.from('pending_deposits').update({ status: 'verified' }).eq('id', deposit.id);

    // 4. Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance_usd, total_deposited, referred_by, raffle_chances')
      .eq('id', deposit.user_id)
      .single();

    if (!profile) throw new Error("Profile not found");

    // 5. Calculate balances and raffle chances
    let newChances = Number(profile.raffle_chances || 0);
    if (depositAmount >= 500000) newChances += 1;

    await supabase.from('profiles').update({
      balance_usd: Number(profile.balance_usd || 0) + depositAmount,
      total_deposited: Number(profile.total_deposited || 0) + depositAmount,
      raffle_chances: newChances
    }).eq('id', deposit.user_id);

    // 6. Give 12% Commission to the referrer (Level 1 only)
    if (profile.referred_by) {
      const commissionAmount = depositAmount * 0.12;
      const { data: referrer } = await supabase.from('profiles').select('balance_usd, team_commission').eq('id', profile.referred_by).single();
      
      if (referrer) {
        await supabase.from('profiles').update({
          balance_usd: Number(referrer.balance_usd || 0) + commissionAmount,
          team_commission: Number(referrer.team_commission || 0) + commissionAmount
        }).eq('id', profile.referred_by);

        await supabase.from('transactions').insert({
          user_id: profile.referred_by,
          type: 'COMMISSION',
          amount_usd: commissionAmount,
          status: 'completed'
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Payment credited successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
      }
