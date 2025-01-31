import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mediaSpaceId = parseInt(params.id);

    // Get the media space with its media item and active leases
    const mediaSpace = await prisma.mediaSpace.findUnique({
      where: { id: mediaSpaceId },
      include: {
        mediaItem: true,
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

    if (!mediaSpace) {
      return NextResponse.json({ error: 'Media space not found' }, { status: 404 });
    }

    console.log('Media Space Details:', {
      id: mediaSpace.id,
      capacity: mediaSpace.mediaItem.capacity,
      activeLeases: mediaSpace.leases.length
    });

    // Create a map of dates to number of active leases
    const dateCapacities = new Map();
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    // For each lease, mark its dates in the map
    mediaSpace.leases.forEach(lease => {
      const start = new Date(lease.startDate);
      const end = new Date(lease.endDate);
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const currentCount = dateCapacities.get(dateStr) || 0;
        dateCapacities.set(dateStr, currentCount + 1);
      }
    });

    // Convert the map to an array of objects
    const dateCapacitiesArray = Array.from(dateCapacities.entries()).map(([date, activeLeases]) => ({
      date,
      activeLeases,
      remainingCapacity: mediaSpace.mediaItem.capacity - activeLeases,
      isAtCapacity: activeLeases >= mediaSpace.mediaItem.capacity
    }));

    console.log('Date Capacities Sample:', dateCapacitiesArray.slice(0, 5));

    return NextResponse.json({
      capacity: mediaSpace.mediaItem.capacity,
      dateCapacities: dateCapacitiesArray,
      totalLeases: mediaSpace.leases.length
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
} 