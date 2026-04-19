import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit } from '@/lib/rate-limit';

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const NOTIFY_EMAIL = 'maxwellbrain2026@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const blocked = await checkRateLimit(req, '/api/contact', { limit: 5, windowMs: 60_000 });
    if (blocked) return blocked;

    if (!process.env.RESEND_API_KEY) {
      console.error('[contact] RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();
    const { name, email, subject, message, turnstileToken } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Enforce max message length
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    // Verify Turnstile captcha
    if (TURNSTILE_SECRET) {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Captcha required' }, { status: 400 });
      }
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: TURNSTILE_SECRET, response: turnstileToken }),
      });
      const result = await verification.json();
      if (!result.success) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 403 });
      }
    }

    // Send notification email
    await resend.emails.send({
      from: 'Visor Index <notifications@visorindex.com>',
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: `Contact Form: ${subject} — ${name}`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; color: #0C1810;">
          <div style="background: #0a1c2a; padding: 24px 32px; color: #fff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">New Contact Message</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,.5);">${subject}</p>
          </div>
          <div style="padding: 28px 32px; border: 1px solid #CAD8D0; border-top: none;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568; width: 120px;">Name</td>
                <td style="padding: 8px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1A7A4A;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Subject</td>
                <td style="padding: 8px 0;">${subject}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #CAD8D0;">
              <div style="font-weight: 600; color: #5A7568; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Message</div>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2E4438; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <div style="padding: 12px 32px; font-size: 11px; color: #5A7568;">
            Submitted via visorindex.com/contact
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
