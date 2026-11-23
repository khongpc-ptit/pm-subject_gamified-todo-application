import nodemailer from 'nodemailer';
export async function sendResetEmail(email: string, token: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM || !process.env.CLIENT_URL) throw new Error('SMTP_HOST, SMTP_FROM and CLIENT_URL are required');
  const url = new URL('/reset-password', process.env.CLIENT_URL);
  url.searchParams.set('token', token);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  });
  await transport.sendMail({ from: process.env.SMTP_FROM, to: email, subject: 'Đặt lại mật khẩu Questline', text: `Liên kết có hiệu lực 15 phút và chỉ dùng một lần: ${url.toString()}` });
}
