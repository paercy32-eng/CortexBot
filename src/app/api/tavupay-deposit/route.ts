import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, orderId, description } = body;

    if (!phone || !amount) {
      return NextResponse.json({ ok: false, error: 'Phone and amount are required' }, { status: 400 });
    }

    if (amount < 500) {
      return NextResponse.json({ ok: false, error: 'Minimum amount is 500 UGX' }, { status: 400 });
    }

    const response = await fetch('https://api.tavupay.lat/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.TAVUPAY_API_KEY!,
        'X-API-Secret': process.env.TAVUPAY_API_SECRET!,
      },
      body: JSON.stringify({
        type: 'collection',
        phone: phone,
        amount: Number(amount),
        idempotencyKey: orderId || `order-${Date.now()}`,
        description: description || 'Wallet Deposit',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: data.error || data.message || 'Failed' }, { status: response.status });
    }

    // We return the data, which includes TavuPay's 'reference'
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
