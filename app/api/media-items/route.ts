import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get('typeId');
    const storeId = searchParams.get('storeId');

    if (!typeId || !storeId) {
      return NextResponse.json(
        { error: 'Type ID and Store ID are required' },
        { status: 400 }
      );
    }

    // First get all media items of the selected type
    const mediaItems = await prisma.mediaItem.findMany({
      where: {
        mediaItemTypeId: parseInt(typeId),
        // Only get media items that exist in the selected store
        mediaSpaces: {
          some: {
            storeId: parseInt(storeId)
          }
        }
      },
      include: {
        mediaItemType: true,
        mediaSpaces: {
          where: {
            storeId: parseInt(storeId)
          }
        }
      }
    });

    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Error fetching media items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
} 