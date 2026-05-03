// import nodemailer from 'nodemailer';

// // Replace the createTransport implementation BEFORE mail-client.ts imports.
// const captured: any[] = [];
// const originalCreateTransport = nodemailer.createTransport.bind(nodemailer);
// (nodemailer as unknown as { createTransport: typeof originalCreateTransport }).createTransport =
//   () =>
//     ({
//       sendMail: async (opts: unknown) => {
//         captured.push(opts);
//         return { messageId: 'test', accepted: ['x'] };
//       },
//     }) as unknown as ReturnType<typeof originalCreateTransport>;

// Now lazy-import everything else so mail-client picks up the mocked transport.
const { sendLoginNotificationEmail } = await import(
  '../src/lib/login-notification/send-login-notification'
);

async function main() {
  await sendLoginNotificationEmail({
    userEmail: 'tester+alice@d3serve.xyz',
    sessionInfo: {
      sessionId: 'sess_123',
      loginMethod: 'Email',
      ipAddress: '203.0.113.5',
      userAgent: 'Mozilla/5.0',
      os: 'macOS',
      browser: 'Chrome 121',
      device: 'Mac',
      geolocation: {
        city: 'Paris',
        region: 'Île-de-France',
        country: 'France',
        countryCode: 'FR',
        countryEmoji: '🇫🇷',
        subdivision: 'FR75',
        lat: 48.8566,
        lng: 2.3522,
      },
      timestamp: new Date('2026-04-27T12:00:00Z'),
      isNewIp: true,
      isNewLocation: true,
      isFirstSession: false,
    },
  });

  if (captured.length !== 1) {
    console.error('expected exactly 1 sendMail call, got', captured.length);
    process.exit(1);
  }

  const opts = captured[0] as {
    subject: string;
    html: string;
    attachments: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
      cid?: string;
      contentDisposition?: string;
    }>;
  };

  console.log('subject:', opts.subject);
  console.log('attachments:', opts.attachments.length);
  for (const att of opts.attachments) {
    const head = att.content.subarray(0, 8);
    const isPng =
      head[0] === 0x89 &&
      head[1] === 0x50 &&
      head[2] === 0x4e &&
      head[3] === 0x47;
    console.log(
      `  -> filename=${att.filename}, mime=${att.contentType}, cid=${att.cid}, disposition=${att.contentDisposition}, bytes=${att.content.length}, isPng=${isPng}`,
    );
  }

  const cidRefInHtml = opts.html.match(/cid:[a-z0-9._@-]+/i);
  console.log('html cid reference:', cidRefInHtml?.[0] ?? '(none found)');

  const matches =
    opts.attachments.length === 1 &&
    opts.attachments[0].cid !== undefined &&
    cidRefInHtml?.[0] === `cid:${opts.attachments[0].cid}`;
  console.log('html ref matches attachment cid:', matches);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
