import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const mediaItems = await prisma.mediaItem.findMany({
      select: {
        id: true,
        type: true,
        dimensions: true,
        basePrice: true,
        leaseDuration: true,
        capacity: true
      },
      orderBy: {
        type: 'asc'
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body); // Debug log

    // Validate required fields
    if (!body.type || !body.dimensions || !body.basePrice || !body.leaseDuration || !body.capacity || !body.format || !body.mediaItemTypeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const mediaItem = await prisma.mediaItem.create({
      data: {
        type: body.type,
        dimensions: body.dimensions,
        basePrice: body.basePrice,
        leaseDuration: body.leaseDuration,
        capacity: body.capacity,
        format: body.format,
        mediaItemTypeId: body.mediaItemTypeId
      }
    });

    console.log('Created media item:', mediaItem); // Debug log
    return NextResponse.json(mediaItem);
  } catch (error) {
    console.error('Error creating media item:', error);
    return NextResponse.json(
      { error: 'Failed to create media item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 