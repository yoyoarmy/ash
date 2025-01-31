import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { mediaSpaceId, startDate, endDate } = await request.json();
    
    // Get the media space with its media item and overlapping leases
    const mediaSpace = await prisma.mediaSpace.findUnique({
      where: { id: mediaSpaceId },
      include: {
        mediaItem: true,
        leases: {
          where: {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate) } },
              {
                status: {
                  name: {
                    not: 'Completado'
                  }
                }
              }
            ]
          },
          include: {
            status: true
          }
        }
      }
    });

    if (!mediaSpace) {
      return NextResponse.json({ error: 'Media space not found' }, { status: 404 });
    }

    // Get the capacity and count overlapping leases
    const capacity = mediaSpace.mediaItem.capacity;
    const overlappingLeases = mediaSpace.leases.length;
    const remainingCapacity = capacity - overlappingLeases;

    console.log('Availability check:', {
      capacity,
      overlappingLeases,
      remainingCapacity,
      requestedPeriod: { startDate, endDate },
      existingLeases: mediaSpace.leases.map(l => ({
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status.name
      }))
    });

    // Space is available if we haven't reached capacity
    if (remainingCapacity > 0) {
      return NextResponse.json({ 
        available: true,
        remainingCapacity,
        capacity,
        currentLeases: overlappingLeases
      });
    }

    // Space is at capacity for the requested dates
    return NextResponse.json({
      error: 'No hay espacio disponible para las fechas seleccionadas',
      capacity,
      currentLeases: overlappingLeases,
      overlappingLeases: mediaSpace.leases.map(lease => ({
        startDate: lease.startDate,
        endDate: lease.endDate,
        status: lease.status.name
      }))
    }, { status: 409 });

  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
} 