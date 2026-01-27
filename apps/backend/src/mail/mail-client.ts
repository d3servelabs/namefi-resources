import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type smtpTransport from 'nodemailer/lib/smtp-transport';
import { config, secrets } from '#lib/env';

const transportOptions: smtpTransport.Options = config.SMTP_SECURE
  ? { secure: true }
  : {
      secure: false,
      tls: { rejectUnauthorized: false },
      debug: true,
      authMethod: 'PLAIN',
    };

if (secrets.SMTP_USERNAME) {
  transportOptions.auth = {
    user: secrets.SMTP_USERNAME,
    pass: secrets.SMTP_PASSWORD,
  };
}

const transporter: Mail = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  ...transportOptions,
});

export interface SendMailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: { plain?: string; html: string };
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  replyTo?: (string | Mail.Address)[];
}

export async function sendMail({
  to,
  cc = [],
  bcc = [],
  subject,
  content,
  from = 'Namefi <support@namefi.io>',
  replyTo = [],
  attachments = [],
}: SendMailInput) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: from, // sender address
    to: to, // list of receivers
    cc,
    bcc,
    subject, // Subject line
    replyTo,
    text: content.plain, // plain text body
    html: content.html, // html body
    attachments: attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || 'text/plain',
    })),
    headers: {
      ses: 'no-track',
    },
  });

  return info;
}
