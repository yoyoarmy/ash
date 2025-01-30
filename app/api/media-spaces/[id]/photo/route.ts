import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { photo } = await request.json();
    const mediaSpaceId = parseInt(params.id);

    const updatedMediaSpace = await prisma.mediaSpace.update({
      where: { id: mediaSpaceId },
      data: { photo }
    });

    return NextResponse.json(updatedMediaSpace);
  } catch (error) {
    console.error('Error updating media space photo:', error);
    return NextResponse.json(
      { error: 'Failed to update media space photo' },
      { status: 500 }
    );
  }
} 