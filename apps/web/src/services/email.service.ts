import sgMail from "@sendgrid/mail";
import { env } from "../lib/env.js";

const OTP_EXPIRY_MINUTES = 10;

function buildOtpHtml(otp: string, email: string): string {
  // Render each digit in its own styled cell
  const digitCells = otp
    .split("")
    .map(
      (d) => `
      <td style="width:52px;height:62px;text-align:center;vertical-align:middle;
                 background:linear-gradient(160deg,rgba(124,58,237,0.22),rgba(99,56,221,0.1));
                 border:1.5px solid rgba(124,58,237,0.45);border-radius:12px;
                 box-shadow:0 0 14px rgba(124,58,237,0.18) inset;">
        <span style="font-size:32px;font-weight:800;color:#ffffff;
                     text-shadow:0 0 20px rgba(167,130,255,0.7);letter-spacing:0;">${d}</span>
      </td>
      <td style="width:8px;"></td>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Verify your email · Enrich It</title>
</head>
<body style="margin:0;padding:0;background:#0c0820;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer bg -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(160deg,#0c0820 0%,#150b32 55%,#0c0820 100%);min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 20px 56px;">

        <!-- Width cap -->
        <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">

          <!-- ── Logo ── -->
          <tr>
            <td align="center" style="padding-bottom:36px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6738dd,#9f7aea);width:46px;height:46px;
                             border-radius:13px;text-align:center;vertical-align:middle;
                             box-shadow:0 6px 22px rgba(103,56,221,0.55);">
                    <span style="color:#ffffff;font-size:22px;line-height:46px;">✦</span>
                  </td>
                  <td style="padding-left:11px;color:#ffffff;font-size:26px;font-weight:700;
                             letter-spacing:-0.6px;vertical-align:middle;">
                    Enrich&nbsp;<span style="color:#9f7aea;">it</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Card ── -->
          <tr>
            <td style="background:linear-gradient(190deg,#1b1040 0%,#120b2e 100%);
                       border-radius:28px;
                       border:1px solid rgba(124,58,237,0.3);
                       box-shadow:0 40px 90px rgba(83,52,174,0.55),
                                  0 0 0 1px rgba(255,255,255,0.03) inset;
                       overflow:hidden;">

              <!-- rainbow top bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#7c3aed 0%,#6f4cc6 40%,#a78bfa 100%);
                             border-radius:28px 28px 0 0;"></td>
                </tr>
              </table>

              <!-- body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:52px 52px 44px;">

                    <!-- envelope icon -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:30px;">
                          <div style="display:inline-block;width:76px;height:76px;
                                      background:linear-gradient(135deg,rgba(124,58,237,0.28),rgba(99,56,221,0.14));
                                      border-radius:22px;border:1px solid rgba(124,58,237,0.4);
                                      text-align:center;line-height:76px;font-size:38px;
                                      box-shadow:0 8px 28px rgba(124,58,237,0.3);">✉️</div>
                        </td>
                      </tr>
                    </table>

                    <!-- heading -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:10px;">
                          <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:800;
                                     letter-spacing:-0.6px;line-height:1.2;">
                            Verify your email address
                          </h1>
                        </td>
                      </tr>
                    </table>

                    <!-- sub -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:40px;">
                          <p style="margin:0;color:#9182c0;font-size:15px;line-height:1.65;">
                            We sent a one-time code to<br/>
                            <strong style="color:#c4b4f0;">${email}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- digit boxes -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:38px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr>
                              ${digitCells}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- expiry badge -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:40px;">
                          <table cellpadding="0" cellspacing="0"
                                 style="background:rgba(245,158,11,0.09);
                                        border:1px solid rgba(245,158,11,0.28);
                                        border-radius:10px;">
                            <tr>
                              <td style="padding:12px 22px;color:#f59e0b;font-size:13px;
                                         font-weight:600;text-align:center;letter-spacing:0.2px;">
                                ⏱&nbsp;&nbsp;This code expires in ${OTP_EXPIRY_MINUTES} minutes
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- divider -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="height:1px;background:linear-gradient(90deg,transparent,rgba(124,58,237,0.3),transparent);
                                   padding-bottom:32px;"></td>
                      </tr>
                    </table>

                    <!-- security note -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <p style="margin:0;color:#4e4570;font-size:13px;line-height:1.65;max-width:380px;">
                            If you didn't create an Enrich&nbsp;It account, you can safely ignore this
                            email — nothing will change.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;color:#2e2748;font-size:12px;">
                © 2025 Enrich It · All rights reserved
              </p>
              <p style="margin:6px 0 0;color:#241e3a;font-size:11px;">
                Powered by AI-driven data enrichment
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

export class EmailService {
  private ready = false;

  private init(): void {
    if (this.ready) return;
    if (!env.SENDGRID_API_KEY) {
      throw new Error(
        "SENDGRID_API_KEY is not set. Add it to your .env file to enable email sending.",
      );
    }
    sgMail.setApiKey(env.SENDGRID_API_KEY);
    this.ready = true;
  }

  async sendOtp(toEmail: string, otp: string): Promise<void> {
    this.init();
    const from = env.SENDGRID_FROM_EMAIL ?? "noreply@enrichit.com";

    await sgMail.send({
      to: toEmail,
      from,
      subject: `${otp} – your Enrich It verification code`,
      html: buildOtpHtml(otp, toEmail),
    });
  }
}
