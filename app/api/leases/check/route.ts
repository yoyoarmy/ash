import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First, get all media spaces with expired leases
    const mediaSpacesWithExpiredLeases = await prisma.mediaSpace.findMany({
      where: {
        AND: [
          {
            status: 'leased'
          },
          {
            leases: {
              some: {
                AND: [
                  { statusId: { not: 7 } },  // Not completed
                  { endDate: { lt: today } }
                ]
              }
            }
          }
        ]
      },
      select: {
        id: true
      }
    });

    // Update the expired leases
    const expiredLeases = await prisma.$transaction([
      // Update lease statuses
      prisma.lease.updateMany({
        where: {
          statusId: { not: 7 },  // Not completed
          endDate: { lt: today }
        },
        data: {
          statusId: 7  // Set to completed
        }
      }),
      // Update media space statuses
      prisma.mediaSpace.updateMany({
        where: {
          id: {
            in: mediaSpacesWithExpiredLeases.map(space => space.id)
          }
        },
        data: {
          status: 'available'  // Set to available
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      completedLeases: expiredLeases[0].count,
      updatedSpaces: expiredLeases[1].count
    });
  } catch (error) {
    console.error('Error checking leases:', error);
    return NextResponse.json(
      { error: 'Failed to check leases' },
      { status: 500 }
    );
  }
}         