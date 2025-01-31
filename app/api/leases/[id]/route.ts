import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = parseInt(params.id);

    // Start a transaction to handle all operations
    await prisma.$transaction(async (tx) => {
      // Get the lease to find its mediaSpace
      const lease = await tx.lease.findUnique({
        where: { id: leaseId },
        select: { mediaSpaceId: true }
      });

      if (!lease) {
        throw new Error('Lease not found');
      }

      // First delete the LeaseExtraInformation
      await tx.leaseExtraInformation.deleteMany({
        where: {
          leaseId: leaseId
        }
      });

      // Then delete the Lease
      await tx.lease.delete({
        where: {
          id: leaseId
        }
      });

      // Check if there are any remaining active leases for this media space
      const remainingLeases = await tx.lease.findMany({
        where: {
          mediaSpaceId: lease.mediaSpaceId,
          status: {
            in: ['active', 'pending']
          }
        }
      });

      // If no remaining leases, update media space status to available
      if (remainingLeases.length === 0) {
        await tx.mediaSpace.update({
          where: { id: lease.mediaSpaceId },
          data: { status: 'available' }
        });
      }
    });

    return NextResponse.json({ message: 'Lease revoked successfully' });
  } catch (error) {
    console.error('Error revoking lease:', error);
    return NextResponse.json(
      { error: 'Failed to revoke lease' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leaseId = parseInt(params.id);
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        mediaSpace: {
          include: {
            store: true,
            mediaItem: true
          }
        },
        status: true,
        order: {
          include: {
            user: true
          }
        },
        extraInformation: true
      }
    });

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lease);
  } catch (error) {
    console.error('Error fetching lease:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lease' },
      { status: 500 }
    );
  }
} 