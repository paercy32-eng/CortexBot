import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server'; // Make sure this path matches your project

export async function POST(request: Request) {
  try {
    // 1. Get raw body and signature header
    const rawBody = await request.text();
    const signature = request.headers.get('X-TAVUPAY-Signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // 2. Verify HMAC-SHA256 Signature
    const secret = process.env.TAVUPAY_API_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Invalid TavuPay Webhook Signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parse the validated body
    const body = JSON.parse(rawBody);
    
    // 4. Handle the event
    console.log('TavuPay Webhook Received:', body.event);

    if (body.event === 'collection.success' || body.event === 'collection.failed') {
      const transaction = body.data;
      
      const status = transaction.transactionStatus; // "SUCCEEDED" or "FAILED"
      const tavuReference = transaction.transactionSystemId; // EPY211001492
      
      // Initialize Supabase (server-side)
      const supabase = await createClient();

      if (status === 'SUCCEEDED') {
        // Step A: Update the pending_deposits table to 'success'
        const { error: depositError } = await supabase
          .from('pending_deposits')
          .update({ status: 'success' })
          .eq('txid', tavuReference);

        if (depositError) {
          console.error('Failed to update pending deposit:', depositError);
        }

        // Step B: You need to credit the user's balance here.
        // This depends on your DB structure. Example:
        // 1. Fetch the deposit to get the user_id and amount
        // 2. Add the amount to the user's profile/wallet table
        
        console.log(`Payment ${tavuReference} succeeded for ${transaction.amount} UGX`);
      } else if (status === 'FAILED') {
        // Update the pending_deposits table to 'failed'
        const { error: failError } = await supabase
          .from('pending_deposits')
          .update({ status: 'failed' })
          .eq('txid', tavuReference);

        if (failError) {
          console.error('Failed to update failed deposit:', failError);
        }
        
        console.log(`Payment ${tavuReference} failed`);
      }
    }

    // 5. Acknowledge receipt (TavuPay recommends 202)
    return new NextResponse(null, { status: 202 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}