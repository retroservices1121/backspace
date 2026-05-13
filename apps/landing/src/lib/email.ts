// Resend integration for waitlist confirmation emails.
//
// The client is lazy-initialised so a missing `RESEND_API_KEY` does not
// crash boot — instead, sends silently no-op (with a warn) which keeps
// local dev / preview deploys functional without a real Resend account.
//
// Sends are fire-and-forget from the API route; failures are logged but
// never bubble back to the user (their handle is already saved).
import { Resend } from 'resend';

let cachedClient: Resend | null = null;
let warned = false;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warned) {
      console.warn(
        '[email] RESEND_API_KEY is not set — confirmation emails are disabled.',
      );
      warned = true;
    }
    return null;
  }
  if (!cachedClient) cachedClient = new Resend(key);
  return cachedClient;
}

const DEFAULT_FROM = 'Backspace <hello@backspacethat.com>';

export type WaitlistConfirmationParams = {
  to: string;
  handle: string | null;
  position: number;
  total: number;
  referralCode: string;
  // Host portion of the referral URL; e.g. "backspacethat.com" or the
  // Railway preview host. Provided by the caller so we don't hardcode.
  origin: string;
};

export async function sendWaitlistConfirmation(
  p: WaitlistConfirmationParams,
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;
  const handleSuffix = p.handle ? ` — @${p.handle} is reserved` : '';
  const subject = `You're on the Backspace list${handleSuffix}`;
  const referralUrl = `https://${p.origin}/r/${p.referralCode}`;

  const { html, text } = renderConfirmation({
    handle: p.handle,
    position: p.position,
    total: p.total,
    referralUrl,
  });

  try {
    const result = await resend.emails.send({
      from,
      to: p.to,
      subject,
      html,
      text,
    });
    if ('error' in result && result.error) {
      console.error('[email] resend send failed', result.error);
    }
  } catch (err) {
    console.error('[email] resend send threw', err);
  }
}

type RenderParams = {
  handle: string | null;
  position: number;
  total: number;
  referralUrl: string;
};

// Inline-style HTML email body. Email clients ignore <style> blocks
// inconsistently, so every visual rule lives on the element. Tested
// for the common cases (Gmail web/mobile, Apple Mail) — width capped
// at 560px for narrow viewports, dark theme.
function renderConfirmation(p: RenderParams): { html: string; text: string } {
  const positionStr = p.position.toLocaleString();
  const totalStr = p.total.toLocaleString();
  const handleLine = p.handle
    ? `Your handle <strong style="color:#ffffff;">@${escapeHtml(p.handle)}</strong> is held for you.`
    : 'Your spot on the list is locked in.';
  const handleTextLine = p.handle
    ? `Your handle @${p.handle} is held for you.`
    : 'Your spot on the list is locked in.';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>You're on the list — Backspace</title>
  </head>
  <body style="margin:0;padding:0;background:#08070d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#08070d;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#0f0d1a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
            <!-- Brand bar -->
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <span style="display:inline-block;font-weight:700;letter-spacing:-0.01em;font-size:18px;color:#ffffff;">backspace</span>
              </td>
            </tr>

            <!-- Headline -->
            <tr>
              <td style="padding:32px 24px 8px;">
                <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">
                  You're on the list.
                </h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.55;color:rgba(255,255,255,0.72);">
                  ${handleLine}
                </p>
              </td>
            </tr>

            <!-- Position card -->
            <tr>
              <td style="padding:20px 24px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(140deg, rgba(88,34,251,0.20), rgba(88,34,251,0.04));border:1px solid rgba(123,76,255,0.35);border-radius:12px;">
                  <tr>
                    <td style="padding:16px;">
                      <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);">
                        Your position
                      </div>
                      <div style="margin-top:4px;font-size:24px;font-weight:600;letter-spacing:-0.01em;color:#ffffff;">
                        #${positionStr} <span style="font-size:13px;color:rgba(255,255,255,0.5);font-weight:400;">/ ${totalStr}</span>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Referral -->
            <tr>
              <td style="padding:20px 24px 8px;">
                <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px;">
                  Skip the line — share your link
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    <td>
                      <a href="${escapeAttr(p.referralUrl)}" style="display:inline-block;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:13px;color:#7B4CFF;text-decoration:none;border:1px solid rgba(123,76,255,0.35);border-radius:10px;padding:12px 14px;word-break:break-all;">${escapeHtml(p.referralUrl)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:10px 0 0;font-size:13px;line-height:1.55;color:rgba(255,255,255,0.5);">
                  Each referral moves you roughly 150 spots up.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:24px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.4);">
                  You're getting this because you signed up at backspace. We only send launch-related updates. No spam, ever.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "You're on the list.",
    handleTextLine,
    '',
    `Your position: #${positionStr} of ${totalStr}.`,
    '',
    'Skip the line — share your link:',
    p.referralUrl,
    '',
    'Each referral moves you roughly 150 spots up.',
    '',
    "You're getting this because you signed up at backspace.",
    'No spam, ever.',
  ].join('\n');

  return { html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
