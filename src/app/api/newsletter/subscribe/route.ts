import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const blocked = checkRateLimit(req, '/api/newsletter', { limit: 5, windowMs: 60_000 });
  if (blocked) return blocked;

  // TODO: wire to email service (Resend, Mailchimp, etc.)
  return NextResponse.json({ ok: true });
}
