import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Add debug logging
    console.log('Prisma instance:', !!prisma);
    console.log('NotificationSettings model:', !!prisma?.notificationSettings);
    
    const settings = await prisma.$queryRaw`
      SELECT * FROM "NotificationSettings"
    `;
    
    console.log('Found settings:', settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { brandId, email } = await request.json();
    console.log('Received request:', { brandId, email });
    
    if (!brandId || !email) {
      return NextResponse.json(
        { error: 'brandId and email are required' }, 
        { status: 400 }
      );
    }

    const brandIdNum = Number(brandId);
    
    // Use raw query instead of Prisma client methods
    const settings = await prisma.$queryRaw`
      INSERT INTO "NotificationSettings" ("brandId", "email", "createdAt", "updatedAt")
      VALUES (${brandIdNum}, ${email}, NOW(), NOW())
      ON CONFLICT ("brandId") 
      DO UPDATE SET "email" = ${email}, "updatedAt" = NOW()
      RETURNING *
    `;

    console.log('Settings saved:', settings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save settings' }, 
      { status: 500 }
    );
  }
} 