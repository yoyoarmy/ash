import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const mediaType = searchParams.get('mediaType');
    const brandId = searchParams.get('brandId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const mediaSpaces = await prisma.mediaSpace.findMany({
      where: {
        storeId: parseInt(storeId),
        ...(mediaType && { mediaItem: { type: mediaType } }),
        store: brandId ? { brandId: parseInt(brandId) } : undefined,
        OR: [
          {
            leases: {
              none: {
                OR: [
                  {
                    status: {
                      name: {
                        in: ['Recibido', 'Asignado', 'Encendido', 'Evidencia Enviada', 'Reporte Enviado', 'Facturado']
                      }
                    },
                    endDate: {
                      gte: new Date()
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      include: {
        mediaItem: true,
        store: true,
        leases: {
          include: {
            status: true
          }
        }
      }
    });

    return NextResponse.json(mediaSpaces);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
} 