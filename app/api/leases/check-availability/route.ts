import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { mediaSpaceId, startDate, endDate } = await request.json();

    const overlappingLease = await prisma.lease.findFirst({
      where: {
        mediaSpaceId,
        status: {
          name: {
            not: 'Completado'
          }
        },
        AND: [
          {
            startDate: {
              lte: new Date(endDate)
            }
          },
          {
            endDate: {
              gte: new Date(startDate)
            }
          }
        ]
      },
      include: {
        status: true
      }
    });

    if (overlappingLease) {
      return NextResponse.json(
        {
          available: false,
          conflictingLease: {
            startDate: overlappingLease.startDate,
            endDate: overlappingLease.endDate,
            status: overlappingLease.status.name
          }
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
} 