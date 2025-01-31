import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    const mediaSpace = await prisma.mediaSpace.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        mediaItem: true,
        leases: {
          where: {
            AND: [
              { startDate: { lte: new Date(end) } },
              { endDate: { gte: new Date(start) } },
              {
                status: {
                  name: {
                    in: ['Recibido', 'Asignado', 'Encendido', 'Evidencia Enviada', 'Reporte Enviado', 'Facturado']
                  }
                }
              }
            ]
          }
        }
      }
    });

    if (!mediaSpace) {
      return NextResponse.json({ error: 'Media space not found' }, { status: 404 });
    }

    const capacity = mediaSpace.mediaItem.capacity || 1;
    const dateAvailability = new Map<string, number>();

    // Calculate availability for each date in range
    mediaSpace.leases.forEach(lease => {
      const leaseStart = new Date(lease.startDate);
      const leaseEnd = new Date(lease.endDate);
      
      for (let d = new Date(leaseStart); d <= leaseEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateAvailability.set(dateStr, (dateAvailability.get(dateStr) || 0) + 1);
      }
    });

    // Format response
    const dates = Array.from(dateAvailability.entries()).map(([date, count]) => ({
      date,
      isAvailable: count < capacity
    }));

    return NextResponse.json({ dates });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
} 