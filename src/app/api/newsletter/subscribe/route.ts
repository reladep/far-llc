import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: wire to email service (Resend, Mailchimp, etc.)
  return NextResponse.json({ ok: true });
}
