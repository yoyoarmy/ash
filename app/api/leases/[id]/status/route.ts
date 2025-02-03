import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !['ADMIN', 'ASSOCIATE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaseId = parseInt(params.id);
    const { statusId } = await request.json();

    const updatedLease = await prisma.lease.update({
      where: { id: leaseId },
      data: { statusId },
      include: {
        status: true,
        mediaSpace: {
          include: {
            store: true,
            mediaItem: true
          }
        },
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        extraInformation: true
      }
    });

    return NextResponse.json(updatedLease);
  } catch (error) {
    console.error('Error updating lease status:', error);
    return NextResponse.json(
      { error: 'Failed to update lease status' },
      { status: 500 }
    );
  }
} 