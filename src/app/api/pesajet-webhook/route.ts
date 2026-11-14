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

    // 1. Read the raw body as text BEFORE parsing it as JSON
    const rawBody = await req.text();

    // 2. Compute the expected HMAC signature using your secret
    const webhookSecret = process.env.PESAJET_WEBHOOK_SECRET || '';
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');

    // 3. Compare signatures using a constant-time comparison to prevent timing attacks
    const a = Buffer.from(signature);
    const b = Buffer.from(digest);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.error('Webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 4. Verification successful! Now it's safe to parse the payload
    const payload = JSON.parse(rawBody);
    const { event, amount, reference } = payload;

    if (event === 'payment.completed') {
      console.log(`Payment completed for ref: ${reference}`);

      // ... (The rest of your existing logic for processing the deposit, 
      //      updating balances, and calculating the 12% commission remains exactly the same)
      // ... (Make sure to paste the rest of your original code here)
    }

    // Always return 200 OK quickly to acknowledge receipt
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
