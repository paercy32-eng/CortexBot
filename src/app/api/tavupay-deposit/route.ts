import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount, orderId, description } = body;

    // Basic validation
    if (!phone || !amount) {
      return NextResponse.json(
        { ok: false, error: 'Phone and amount are required' },
        { status: 400 }
      );
    }

    // Ensure amount is a minimum of 500 UGX as per TavuPay docs
    if (amount < 500) {
      return NextResponse.json(
        { ok: false, error: 'Minimum amount is 500 UGX' },
        { status: 400 }
      );
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
        idempotencyKey: orderId || `order-${Date.now()}`, // Use your DB order ID here
        description: description || 'Wallet Deposit',
        // If you didn't set a callback URL in the TavuPay dashboard, uncomment below:
        // callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/tavupay-webhook`
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('TavuPay Deposit Error:', data);
      return NextResponse.json(
        { ok: false, error: data.error || data.message || 'Failed to initiate deposit' },
        { status: response.status }
      );
    }

    // Returns { ok: true, message: "...", reference: "C012345..." }
    return NextResponse.json(data);

  } catch (error) {
    console.error('Deposit Route Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}