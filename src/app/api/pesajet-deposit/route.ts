import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, phone, reference } = body;

    // 1. Calculate the 3.5% PesaJet fee and add it to the total
    const originalAmount = Number(amount);
    const finalAmount = Math.ceil(originalAmount * 1.035); // Rounds up to ensure no decimals

    // 2. Format Phone Number to E.164 (e.g., 0771234567 -> +256771234567)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+256' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+256' + formattedPhone;
    }

    // 3. Detect Provider
    let provider = 'mtn'; // Default
    if (
      formattedPhone.startsWith('+25670') || 
      formattedPhone.startsWith('+25675') || 
      formattedPhone.startsWith('+25674')
    ) {
      provider = 'airtel';
    }

    // 4. Get API Key
    const PESAJET_API_KEY = process.env.PESAJET_API_KEY || "YOUR_API_KEY_HERE";

    // 5. Send Request to PesaJet using the FINAL inflated amount
    const response = await fetch('https://payments.pesajet.com/api/v1/collections', {
      method: 'POST',
      headers: {
        'X-API-Key': PESAJET_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalAmount, // Send the amount with the fee added
        currency: 'UGX',
        phoneNumber: formattedPhone,
        provider: provider,
        reference: reference,
        description: 'CortexBot Wallet Deposit'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate payment');
    }

    // 6. Return transaction ID to the frontend
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
