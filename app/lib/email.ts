import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ 
  to, 
  subject, 
  text 
}: { 
  to: string; 
  subject: string; 
  text: string;
}) {
  try {
    const data = await resend.emails.send({
      from: 'notifications@notification.adspacehub.com',
      to,
      subject,
      text,
    });

    console.log('Email sent:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
} 