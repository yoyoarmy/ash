import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);

    // Start a transaction to handle all deletions
    await prisma.$transaction(async (tx) => {
      // 1. Get all leases for this order
      const leases = await tx.lease.findMany({
        where: { orderId },
        include: { extraInformation: true }
      });

      // 2. Delete lease extra information for each lease
      for (const lease of leases) {
        if (lease.extraInformation) {
          await tx.leaseExtraInformation.delete({
            where: { leaseId: lease.id }
          });
        }
      }

      // 3. Delete all leases for this order
      await tx.lease.deleteMany({
        where: { orderId }
      });

      // 4. Finally delete the order
      await tx.order.delete({
        where: { id: orderId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 