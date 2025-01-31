import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        mediaSpaces: {
          include: {
            mediaItem: true,
            leases: {
              include: {
                status: true
              }
            }
          }
        }
      }
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const totalRevenue = store.mediaSpaces.reduce((total, space) => {
      const spaceRevenue = space.leases.reduce((sum, lease) => sum + lease.amount, 0);
      return total + spaceRevenue;
    }, 0);

    const storeWithRevenue = {
      ...store,
      historicalRevenue: totalRevenue
    };

    return NextResponse.json(storeWithRevenue);
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const store = await prisma.store.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        name: body.name,
        location: body.location,
      }
    });

    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.mediaSpace.deleteMany({
      where: {
        storeId: parseInt(params.id)
      }
    });

    await prisma.store.delete({
      where: {
        id: parseInt(params.id)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete store' },
      { status: 500 }
    );
  }
} 