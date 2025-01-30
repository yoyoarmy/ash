import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const mediaItemTypes = await prisma.mediaItemType.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(mediaItemTypes);
  } catch (error) {
    console.error('Error fetching media item types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media item types' },
      { status: 500 }
    );
  }
} 