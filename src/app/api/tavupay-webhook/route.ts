import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-TAVUPAY-Signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const secret = process.env.TAVUPAY_API_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Invalid TavuPay Webhook Signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    console.log('TavuPay Webhook Received:', body.event);

    if (body.event === 'collection.success' || body.event === 'collection.failed') {
      const transaction = body.data;
      const status = transaction.transactionStatus;
      const tavuReference = transaction.transactionSystemId;
      
      const supabase = await createClient();

      if (status === 'SUCCEEDED') {
        
        // 1. Find the pending deposit
        const { data: deposit, error: fetchError } = await supabase
          .from('pending_deposits')
          .select('user_id, amount_usd, status')
          .eq('txid', tavuReference)
          .single();

        if (fetchError || !deposit) {
          console.error('Deposit not found for reference:', tavuReference, fetchError);
          return new NextResponse(null, { status: 200 });
        }

        // Prevent double crediting if webhook fires twice
        if (deposit.status === 'success') {
            console.log('Deposit already processed.');
            return new NextResponse(null, { status: 200 });
        }

        // 2. Update the pending_deposits table to 'success'
        await supabase
          .from('pending_deposits')
          .update({ status: 'success' })
          .eq('txid', tavuReference);

        // 3. Fetch current profile balances to calculate the new totals
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance_usd, total_deposited')
          .eq('id', deposit.user_id)
          .single();

        if (profile && !profileError) {
          const currentBalance = Number(profile.balance_usd) || 0;
          const currentTotalDeposited = Number(profile.total_deposited) || 0;
          const depositAmount = Number(deposit.amount_usd) || 0;

          // 4. Update the user's profile with the new balances
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              balance_usd: currentBalance + depositAmount,
              total_deposited: currentTotalDeposited + depositAmount
            })
            .eq('id', deposit.user_id);
            
          if (updateError) {
            console.error('Failed to update user profile balance:', updateError);
          } else {
            console.log(`Successfully credited ${depositAmount} to user ${deposit.user_id}`);
          }
        }

      } else if (status === 'FAILED') {
        await supabase
          .from('pending_deposits')
          .update({ status: 'failed' })
          .eq('txid', tavuReference);
        
        console.log(`Payment ${tavuReference} failed`);
      }
    }

    return new NextResponse(null, { status: 202 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}