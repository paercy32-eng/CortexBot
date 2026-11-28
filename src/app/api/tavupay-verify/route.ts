import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { ok: false, error: 'Reference is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.tavupay.lat/v1/payments?reference=${reference}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.TAVUPAY_API_KEY!,
        'X-API-Secret': process.env.TAVUPAY_API_SECRET!,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || data.message || 'Failed to verify' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Verify Route Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}