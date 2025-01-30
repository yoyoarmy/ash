import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('Found brands:', brands);
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brand = await prisma.brand.create({
      data: {
        name: body.name,
      }
    });
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json(
      { error: 'Failed to create brand' },
      { status: 500 }
    );
  }
} 