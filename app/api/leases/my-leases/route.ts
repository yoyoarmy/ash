import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Get user's name from the session
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const leases = await prisma.lease.findMany({
      where: {
        OR: [
          { customerName: user.name || '' },  // Match by name
          { customerName: session.user.email }  // Or by email as fallback
        ]
      },
      include: {
        mediaSpace: {
          include: {
            mediaItem: true,
            store: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(leases);
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json(
      { error: 'Error al cargar arriendos' },
      { status: 500 }
    );
  }
} 