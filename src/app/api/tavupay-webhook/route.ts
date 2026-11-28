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

    if (
      body.event === 'collection.success' || 
      body.event === 'collection.failed' ||
      body.event === 'payment.successful' ||
      body.event === 'payment.failed'
    ) {
      const transaction = body.data;
      
      const status = transaction.transactionStatus || transaction.status;
      
      // Look for TavuPay's reference
      const searchReference = transaction.transactionSystemId || transaction.reference;
      
      const supabase = await createClient();

      if (status === 'SUCCEEDED' || status === 'successful' || body.event === 'payment.successful') {
        
        // 1. Find the pending deposit using TavuPay's reference
        const { data: deposit, error: fetchError } = await supabase
          .from('pending_deposits')
          .select('user_id, amount_usd, status')
          .eq('txid', searchReference)
          .single();

        if (fetchError || !deposit) {
          console.error('Deposit not found for reference:', searchReference, fetchError);
          return new NextResponse(null, { status: 200 });
        }

        if (deposit.status === 'success') {
            console.log('Deposit already processed.');
            return new NextResponse(null, { status: 200 });
        }

        // 2. Update the pending_deposits table
        await supabase
          .from('pending_deposits')
          .update({ status: 'success' })
          .eq('txid', searchReference);

        // 3. Fetch current profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance_usd, total_deposited')
          .eq('id', deposit.user_id)
          .single();

        if (profile && !profileError) {
          const currentBalance = Number(profile.balance_usd) || 0;
          const currentTotalDeposited = Number(profile.total_deposited) || 0;
          const depositAmount = Number(deposit.amount_usd) || 0;

          // 4. Update the profile balance
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

      } else {
        // Handle failures
        await supabase
          .from('pending_deposits')
          .update({ status: 'failed' })
          .eq('txid', searchReference);
        
        console.log(`Payment ${searchReference} failed`);
      }
    }

    return new NextResponse(null, { status: 202 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
