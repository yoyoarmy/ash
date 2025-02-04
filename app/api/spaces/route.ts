import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const mediaItemTypeId = searchParams.get('mediaItemTypeId');

    const spaces = await prisma.mediaSpace.findMany({
      where: {
        store: brandId ? {
          brandId: parseInt(brandId)
        } : undefined,
        mediaItem: mediaItemTypeId ? {
          mediaItemTypeId: parseInt(mediaItemTypeId)
        } : undefined
      },
      include: {
        mediaItem: true,
        store: true,
        leases: {
          where: {
            AND: [
              {
                status: {
                  name: {
                    not: 'Completado'
                  }
                }
              },
              {
                endDate: {
                  gte: new Date()
                }
              }
            ]
          }
        }
      }
    });

    // Add availability information
    const spacesWithAvailability = spaces.map(space => {
      const activeLeases = space.leases.length;
      const capacity = space.mediaItem.capacity;
      const availableSlots = capacity - activeLeases;

      return {
        ...space,
        availableSlots,
        isAtCapacity: availableSlots <= 0,
        currentCapacity: `${activeLeases}/${capacity}`
      };
    });

    return NextResponse.json(spacesWithAvailability);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
      { status: 500 }
    );
  }
} 