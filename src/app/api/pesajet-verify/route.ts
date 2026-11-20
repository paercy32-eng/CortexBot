import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PesaJet } from '@pesajet/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { reference } = await req.json(); // We will pass the merchant reference here

    const pesajet = new PesaJet({
      apiKey: process.env.PESAJET_API_KEY || "YOUR_API_KEY_HERE",
    });

    let isPaid = false;
    try {
      // Ask PesaJet for the status using the reference
      const payment = await pesajet.payments.get(reference);
      console.log('Polling Status:', payment?.status); // Helpful for debugging

      const currentStatus = String(payment?.status);
      
      if (currentStatus === 'COMPLETED' || currentStatus === 'SUCCESSFUL') {
        isPaid = true;
      }
    } catch (err: any) {
      console.log("PesaJet Poll Error:", err.message);
      return NextResponse.json({ success: false, message: 'Waiting for webhook' });
    }

    if (!isPaid) {
      return NextResponse.json({ success: false, message: 'Payment not completed yet' });
    }

    // Atomic Update: Only process if status is STILL 'pending'
    const { data: deposit, error: updateError } = await supabase
      .from('pending_deposits')
      .update({ status: 'verified' })
      .eq('txid', reference)
      .eq('status', 'pending')
      .select()
      .single();

    if (updateError || !deposit) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const depositAmount = Number(deposit.amount_usd);

    const { data: profile } = await supabase
      .from('profiles')
      .select('balance_usd, total_deposited, referred_by, raffle_chances')
      .eq('id', deposit.user_id)
      .single();

    if (!profile) throw new Error("Profile not found");

    // Award raffle chance if >= 100,000
    let newChances = Number(profile.raffle_chances || 0);
    if (depositAmount >= 100000) newChances += 1;

    await supabase.from('profiles').update({
      balance_usd: Number(profile.balance_usd || 0) + depositAmount,
      total_deposited: Number(profile.total_deposited || 0) + depositAmount,
      raffle_chances: newChances
    }).eq('id', deposit.user_id);

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

    return NextResponse.json({ success: true, message: 'Payment credited successfully' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
