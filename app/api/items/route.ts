import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received item data:', body);

    if (!body.type || !body.dimensions || body.basePrice === undefined || 
        body.leaseDuration === undefined || body.capacity === undefined || 
        body.mediaItemTypeId === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: type, dimensions, basePrice, leaseDuration, capacity, mediaItemTypeId' },
        { status: 400 }
      );
    }

    const item = await prisma.mediaItem.create({
      data: {
        type: body.type,
        dimensions: body.dimensions,
        basePrice: parseFloat(body.basePrice),
        leaseDuration: parseInt(body.leaseDuration),
        format: body.format,
        capacity: parseInt(body.capacity),
        mediaItemTypeId: parseInt(body.mediaItemTypeId)
      }
    });

    console.log('Created item:', item);
    return NextResponse.json(item);
  } catch (error) {
    // Safe error logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Error creating item:', errorMessage);
    
    // Handle Prisma errors
    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Failed to create item',
        message: error.message
      }, { status: 500 });
    }

    // Generic error
    return NextResponse.json({
      error: 'Failed to create item'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const items = await prisma.mediaItem.findMany();
    return NextResponse.json(items);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Error fetching items:', errorMessage);
    
    return NextResponse.json({
      error: 'Failed to fetch items'
    }, { status: 500 });
  }
} 