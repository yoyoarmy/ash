import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    await sendEmail({
      to: email,
      subject: 'Test Email from AdSpaceHub',
      text: `
This is a test email from AdSpaceHub.

If you're receiving this, the email service is working correctly!

Time sent: ${new Date().toLocaleString()}
      `.trim()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
} 