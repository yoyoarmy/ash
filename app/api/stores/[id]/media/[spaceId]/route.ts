import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE endpoint for removing a media space
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const storeId = parseInt(params.id);
    const spaceId = parseInt(params.spaceId);

    // First check if the media space exists and belongs to the store
    const mediaSpace = await prisma.mediaSpace.findFirst({
      where: {
        id: spaceId,
        storeId: storeId
      }
    });

    if (!mediaSpace) {
      return NextResponse.json(
        { error: 'Media space not found' },
        { status: 404 }
      );
    }

    // Check if there are any active leases
    const activeLease = await prisma.lease.findFirst({
      where: {
        mediaSpaceId: spaceId,
        status: {
          name: {
            not: 'Completado'  // Check for any non-completed lease
          }
        },
        endDate: {
          gte: new Date()
        }
      }
    });

    if (activeLease) {
      return NextResponse.json(
        { error: 'Cannot delete media space with active leases' },
        { status: 400 }
      );
    }

    // If no active leases, delete the media space
    await prisma.mediaSpace.delete({
      where: {
        id: spaceId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media space:', error);
    return NextResponse.json(
      { error: 'Failed to remove media space' },
      { status: 500 }
    );
  }
} 