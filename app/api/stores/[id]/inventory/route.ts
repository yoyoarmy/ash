import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { mediaItemId, quantity } = body;
    const storeId = parseInt(params.id);

    // First, delete all existing spaces for this item type
    await prisma.mediaSpace.deleteMany({
      where: {
        storeId,
        mediaItemId
      }
    });

    // Then create the new quantity of spaces
    if (quantity > 0) {
      await prisma.mediaSpace.createMany({
        data: Array(quantity).fill({
          storeId,
          mediaItemId,
          status: 'available'
        })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
} 