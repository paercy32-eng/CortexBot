import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-TAVUPAY-Signature');

    if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 401 });

    const secret = process.env.TAVUPAY_API_SECRET!;
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    console.log('TavuPay Webhook Received:', body.event);

    if (
      body.event === 'collection.success' || body.event === 'collection.failed' ||
      body.event === 'payment.successful' || body.event === 'payment.failed'
    ) {
      const transaction = body.data;
      const status = transaction.transactionStatus || transaction.status;
      const searchReference = transaction.transactionSystemId || transaction.reference;
      const supabase = await createClient();

      if (status === 'SUCCEEDED' || status === 'successful' || body.event === 'payment.successful') {
        
        const { data: deposit } = await supabase
          .from('pending_deposits')
          .select('user_id, amount_usd, status')
          .eq('txid', searchReference)
          .single();

        if (deposit && deposit.status === 'pending') {
          
          // 🚨 USE THE ORIGINAL AMOUNT SAVED IN THE DATABASE (e.g., 20,000)
          const depositAmount = Number(deposit.amount_usd);

          await supabase.from('pending_deposits').update({ status: 'success' }).eq('txid', searchReference);

          const { data: profile } = await supabase
            .from('profiles')
            .select('balance_usd, total_deposited')
            .eq('id', deposit.user_id)
            .single();

          if (profile) {
            const currentBalance = Number(profile.balance_usd) || 0;
            const currentTotalDeposited = Number(profile.total_deposited) || 0;

            await supabase
              .from('profiles')
              .update({ 
                balance_usd: currentBalance + depositAmount, // Credits exactly 20,000
                total_deposited: currentTotalDeposited + depositAmount // Admin panel records 20,000
              })
              .eq('id', deposit.user_id);
              
            await supabase.from('transactions').insert({
              user_id: deposit.user_id,
              type: 'DEPOSIT',
              amount_usd: depositAmount, // History records 20,000
              status: 'completed'
            });
          }
        }
      } else {
        await supabase.from('pending_deposits').update({ status: 'failed' }).eq('txid', searchReference);
      }
    }

    return new NextResponse(null, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}