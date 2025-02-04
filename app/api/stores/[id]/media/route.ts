import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const selectedDate = dateParam ? new Date(dateParam) : new Date();

    const mediaSpaces = await prisma.mediaSpace.findMany({
      where: {
        storeId: parseInt(params.id)
      },
      include: {
        mediaItem: true,
        leases: {
          where: {
            AND: [
              { statusId: { not: 7 } },
              {
                OR: [
                  // Active leases on selected date
                  {
                    AND: [
                      { startDate: { lte: selectedDate } },
                      { endDate: { gte: selectedDate } }
                    ]
                  },
                  // Future active leases
                  {
                    startDate: { gt: selectedDate }
                  },
                  // Past active leases
                  {
                    endDate: { lt: selectedDate }
                  }
                ]
              }
            ]
          },
          orderBy: {
            startDate: 'asc'
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            customerName: true,
            amount: true
          }
        }
      }
    });

    const formattedSpaces = mediaSpaces.map(space => ({
      ...space,
      currentLeases: space.leases.filter(lease => 
        lease.status.id !== 7 &&
        new Date(lease.startDate) <= selectedDate && 
        new Date(lease.endDate) >= selectedDate
      ),
      pastLeases: space.leases.filter(lease => 
        lease.status.id !== 7 &&
        new Date(lease.endDate) < selectedDate
      ),
      upcomingLeases: space.leases.filter(lease => 
        lease.status.id !== 7 &&
        new Date(lease.startDate) > selectedDate
      ),
      status: space.leases.some(lease => 
        lease.status.id !== 7 &&
        new Date(lease.startDate) <= selectedDate && 
        new Date(lease.endDate) >= selectedDate
      ) ? 'leased' : 'available'
    }));

    return NextResponse.json(formattedSpaces);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch media spaces' },
      { status: 500 }
    );
  }
}

// POST endpoint for adding media spaces
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { mediaItemId, quantity } = body;

    // Create the specified number of media spaces
    await prisma.mediaSpace.createMany({
      data: Array(quantity).fill({
        storeId: parseInt(params.id),
        mediaItemId: mediaItemId,
        status: 'available'
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add media space' },
      { status: 500 }
    );
  }
} 