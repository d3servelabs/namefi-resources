import nodemailer from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { config, secrets } from '#lib/env';

const transportOptions: SMTPTransport.Options = config.SMTP_SECURE
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
  port: config.SMTP_PORT || 464,
  ...transportOptions,
});

export async function sendMail({
  to,
  cc = [],
  bcc = [],
  subject,
  content,
  from = 'Namefi <support@namefi.io>',
}: {
  cc?: string[];
  bcc?: string[];
  subject: string;
  from?: string;
  to: string[];
  content: { plain?: string; html: string };
}) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: from, // sender address
    to: to, // list of receivers
    cc,
    bcc,
    subject, // Subject line
    text: content.plain, // plain text body
    html: content.html, // html body
  });

  return info;
}
