import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
      const reference = transaction.transactionSystemId; // EPY211001492
      const externalRef = transaction.transactionExternalReference; // Your orderId
      const amount = Number(transaction.amount);

      if (status === 'SUCCEEDED') {
        // TODO: Update your database here!
        // await db.transaction.update({ where: { id: externalRef }, data: { status: 'SUCCESS' } });
        console.log(`Payment ${reference} succeeded for ${amount} UGX`);
      } else if (status === 'FAILED') {
        // TODO: Update your database here!
        console.log(`Payment ${reference} failed`);
      }
    }

    // 5. Acknowledge receipt (TavuPay recommends 202)
    return new NextResponse(null, { status: 202 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}