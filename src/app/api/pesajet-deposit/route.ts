import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, phone, reference } = body;

    // ⚠️ REPLACE THIS with your actual PesaJet API key
    // You can find this in your PesaJet dashboard
    const PESAJET_API_KEY = process.env.PESAJET_API_KEY || "YOUR_API_KEY_HERE";

    // PesaJet uses Basic Auth. We encode the API key to Base64.
    const authHeader = 'Basic ' + Buffer.from(PESAJET_API_KEY + ':').toString('base64');

    // Send the request to PesaJet
    const response = await fetch('https://api.pesajet.com/v1/collections', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'UGX',
        phone: phone,
        reference: reference,
        description: 'CortexBot Wallet Deposit'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate payment');
    }

    // Return the transaction ID from PesaJet back to the frontend
    return NextResponse.json({ 
      success: true, 
      transactionId: data.transactionId || data.id,
      status: data.status 
    });

  } catch (error: any) {
    console.error('PesaJet Error:', error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}
