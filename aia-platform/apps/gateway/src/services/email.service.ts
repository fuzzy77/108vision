import type { Transporter } from 'nodemailer';
import { getEnv } from '../lib/env.js';

let _transporter: Transporter | null = null;

async function createTransporter(): Promise<Transporter | null> {
  const env = getEnv();

  if (!env.SMTP_HOST) {
    return null;
  }

  const nodemailer = await import('nodemailer');

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
}

async function getTransporter(): Promise<Transporter | null> {
  if (!_transporter) {
    _transporter = await createTransporter();
  }
  return _transporter;
}

function devLog(to: string, subject: string, link?: string): void {
  console.log(
    JSON.stringify({
      level: 'info',
      message: '[email-dev] Would send email',
      to,
      subject,
      ...(link ? { link } : {}),
    }),
  );
}

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
      <tr>
        <td style="background:#4F46E5;padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">108 AI</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          ${body}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Hai ricevuto questa email perché sei registrato su 108 AI. Non rispondere a questa email.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buttonHtml(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;background:#4F46E5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px;margin-top:24px;">${text}</a>`;
}

export const emailService = {
  async sendInvite(
    to: string,
    tenantName: string,
    inviteToken: string,
    invitedBy: string,
  ): Promise<boolean> {
    const env = getEnv();
    const acceptUrl = `${env.APP_URL}/auth/accept-invite?token=${inviteToken}`;
    const subject = `Sei stato invitato a ${tenantName} su 108 AI`;

    const transporter = await getTransporter();
    if (!transporter) {
      devLog(to, subject, acceptUrl);
      return true;
    }

    const html = baseTemplate(
      subject,
      `<h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Sei stato invitato</h1>
      <p style="margin:0 0 4px;color:#374151;font-size:15px;"><strong>${invitedBy}</strong> ti ha invitato a unirsi a <strong>${tenantName}</strong> su 108 AI.</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Accetta l'invito per configurare il tuo account. Il link è valido per 7 giorni.</p>
      ${buttonHtml(acceptUrl, 'Accetta invito')}
      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">Oppure copia questo link nel browser:<br/><span style="color:#4F46E5;">${acceptUrl}</span></p>`,
    );

    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.log(
        JSON.stringify({
          level: 'error',
          message: 'Failed to send invite email',
          to,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return false;
    }
  },

  async sendPasswordReset(to: string, resetToken: string): Promise<boolean> {
    const env = getEnv();
    const resetUrl = `${env.APP_URL}/auth/reset-password?token=${resetToken}`;
    const subject = 'Reimposta la tua password — 108 AI';

    const transporter = await getTransporter();
    if (!transporter) {
      devLog(to, subject, resetUrl);
      return true;
    }

    const html = baseTemplate(
      subject,
      `<h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Reimposta la password</h1>
      <p style="margin:0;color:#374151;font-size:15px;">Hai richiesto di reimpostare la password del tuo account 108 AI.</p>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Il link è valido per 1 ora. Se non hai richiesto tu il reset, ignora questa email.</p>
      ${buttonHtml(resetUrl, 'Reimposta password')}
      <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;">Oppure copia questo link nel browser:<br/><span style="color:#4F46E5;">${resetUrl}</span></p>`,
    );

    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.log(
        JSON.stringify({
          level: 'error',
          message: 'Failed to send password reset email',
          to,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return false;
    }
  },

  async sendBudgetAlert(
    to: string,
    tenantName: string,
    usagePercent: number,
    currentCostUsd: number,
  ): Promise<boolean> {
    const formattedPercent = Math.round(usagePercent);
    const formattedCost = currentCostUsd.toFixed(2);
    const subject = `Avviso budget: ${formattedPercent}% consumato — ${tenantName}`;

    const transporter = await getTransporter();
    if (!transporter) {
      devLog(to, subject);
      return true;
    }

    const env = getEnv();
    const html = baseTemplate(
      subject,
      `<h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Avviso utilizzo budget</h1>
      <p style="margin:0;color:#374151;font-size:15px;">Il tenant <strong>${tenantName}</strong> ha consumato il <strong>${formattedPercent}%</strong> del budget mensile.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fef3c7;border-radius:6px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">Costo corrente: $${formattedCost}</p>
            <p style="margin:4px 0 0;color:#92400e;font-size:13px;">Se il limite viene superato, le richieste AI verranno limitate al tier economico.</p>
          </td>
        </tr>
      </table>
      ${buttonHtml(`${env.APP_URL}/dashboard/usage`, 'Visualizza utilizzo')}`,
    );

    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.log(
        JSON.stringify({
          level: 'error',
          message: 'Failed to send budget alert email',
          to,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return false;
    }
  },
};
