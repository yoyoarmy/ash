import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      id: 'asc'
    }
  });

  return NextResponse.json(brands);
} 