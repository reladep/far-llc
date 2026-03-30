import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const NOTIFY_EMAIL = 'maxwellbrain2026@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, aum, services, hasAdvisor, advisorName, message, turnstileToken } = body;

    // Validate required fields
    if (!name || !email || !turnstileToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify Turnstile captcha
    if (TURNSTILE_SECRET) {
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

    // Build service list
    const serviceLabels: Record<string, string> = {
      search: 'Advisor Search & Introductions',
      diligence: 'Due Diligence Review',
      negotiation: 'Fee Negotiation Support',
      monitoring: 'Ongoing Monitoring & Analysis',
    };
    const serviceList = (services || [])
      .map((s: string) => serviceLabels[s] || s)
      .join(', ');

    // Send notification email
    await resend.emails.send({
      from: 'Visor Index <notifications@visorindex.com>',
      to: NOTIFY_EMAIL,
      subject: `New Deep Dive Consultation Request — ${name}`,
      html: `
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; color: #0C1810;">
          <div style="background: #0a1c2a; padding: 24px 32px; color: #fff;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 600;">New Consultation Request</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,.5);">Deep Dive Analysis — Visor Index</p>
          </div>
          <div style="padding: 28px 32px; border: 1px solid #CAD8D0; border-top: none;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568; width: 160px;">Name</td>
                <td style="padding: 8px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #1A7A4A;">${email}</a></td>
              </tr>
              ${phone ? `<tr><td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Investable Assets</td>
                <td style="padding: 8px 0;">${aum || 'Not disclosed'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Has Existing Advisor</td>
                <td style="padding: 8px 0;">${hasAdvisor === 'yes' ? `Yes — ${advisorName || 'Name not provided'}` : hasAdvisor === 'no' ? 'No' : 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #5A7568;">Services Requested</td>
                <td style="padding: 8px 0;">${serviceList || 'None selected'}</td>
              </tr>
            </table>
            ${message ? `
              <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #CAD8D0;">
                <div style="font-weight: 600; color: #5A7568; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Message</div>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2E4438; white-space: pre-wrap;">${message}</p>
              </div>
            ` : ''}
          </div>
          <div style="padding: 12px 32px; font-size: 11px; color: #5A7568;">
            Submitted via visorindex.com/deep-dive
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Consultation form error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
