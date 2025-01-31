import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Delete existing brands
    await prisma.$executeRaw`TRUNCATE TABLE "Brand" CASCADE`;

    // Create new brands
    const brands = await Promise.all([
      prisma.brand.create({
        data: { name: 'Novey' }
      }),
      prisma.brand.create({
        data: { name: 'Cochez' }
      }),
      prisma.brand.create({
        data: { name: 'Kohler' }
      })
    ]);

    console.log('Created brands:', brands);
    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      error: 'Failed to seed brands', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 