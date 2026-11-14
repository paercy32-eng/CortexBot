import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { phone, password, inviteCode, referralCode } = await req.json();

    // Use the Service Role Key to bypass email sending
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let referrerId = null;

    // 1. Find the inviter if a code was provided
    if (inviteCode && inviteCode.trim() !== '') {
      const { data: referrer } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('referral_code', inviteCode.trim())
        .single();
      
      if (referrer) referrerId = referrer.id;
    }

    // 2. Create the user using Admin API (No emails sent!)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${phone}@cortexbot.com`,
      password: password,
      email_confirm: true, // Automatically confirm them
      user_metadata: {
        phone: phone,
        referred_by: referrerId,
        referral_code: referralCode,
      }
    });

    if (authError) throw authError;

    return NextResponse.json({ success: true, message: 'User created successfully' });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
