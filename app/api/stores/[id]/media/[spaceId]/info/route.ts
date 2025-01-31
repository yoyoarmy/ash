import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; spaceId: string } }
) {
  try {
    const body = await request.json();
    const { info } = body;

    const updatedSpace = await prisma.mediaSpace.update({
      where: {
        id: parseInt(params.spaceId),
      },
      data: {
        info: info
      }
    });

    return NextResponse.json(updatedSpace);
  } catch (error) {
    console.error('Full error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update media space info' },
      { status: 500 }
    );
  }
} 