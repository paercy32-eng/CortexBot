import { NextResponse } from 'next/server';
import { PesaJet } from '@pesajet/sdk';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, phone, reference } = body;

    // Initialize SDK
    const pesajet = new PesaJet({
      apiKey: process.env.PESAJET_API_KEY || "YOUR_API_KEY_HERE",
    });

    // 1. Add the 3.5% PesaJet fee to the amount
    const originalAmount = Number(amount);
    const finalAmount = Math.ceil(originalAmount * 1.035);

    // 2. Format Phone Number
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+256' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+256' + formattedPhone;
    }

    // 3. Detect Provider (Explicitly typed to satisfy the SDK)
    let provider: 'mtn' | 'airtel' = 'mtn'; 
    if (
      formattedPhone.startsWith('+25670') || 
      formattedPhone.startsWith('+25675') || 
      formattedPhone.startsWith('+25674')
    ) {
      provider = 'airtel';
    }

    // 4. Trigger the prompt using the SDK
    const payment = await pesajet.payments.create({
      amount: finalAmount, // Send the inflated amount to PesaJet
      currency: 'UGX',
      phoneNumber: formattedPhone,
      provider: provider,
      reference: reference,
      description: 'CortexBot Wallet Deposit'
    });

    return NextResponse.json({ 
      success: true, 
      transactionId: payment.transactionId,
      status: payment.status 
    });

  } catch (error: any) {
    console.error('PesaJet Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate payment' }, 
      { status: 500 }
    );
  }
}
