import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leases/check`, {
      method: 'POST'
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
} 