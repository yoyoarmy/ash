import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const mediaItemTypes = await prisma.mediaItemType.findMany({
      include: {
        mediaItems: {
          include: {
            mediaSpaces: {
              include: {
                leases: {
                  where: {
                    statusId: {
                      not: 7 // Not completed
                    }
                  },
                  select: {
                    id: true,
                    startDate: true,
                    endDate: true,
                    statusId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log('API Response:', JSON.stringify(mediaItemTypes, null, 2));
    return NextResponse.json(mediaItemTypes);
  } catch (error) {
    console.error('Error fetching media item types:', error);
    return NextResponse.json(
      { error: 'Error fetching media item types' },
      { status: 500 }
    );
  }
} 