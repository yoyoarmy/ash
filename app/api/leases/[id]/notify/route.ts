import { NextResponse } from 'next/server';
import { sendEmail } from '@/app/lib/email';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { lease, redirectUrl } = await request.json();

    await sendEmail({
      to: 'yoyo@adspacehub.com',
      subject: `URL de Agrupación Actualizada - ${lease.mediaSpace.store.name}`,
      text: `
Se ha actualizado la URL de agrupación para la siguiente solicitud:

Información General:
Tienda: ${lease.mediaSpace.store.name}
Cliente: ${lease.customerName}
Tipo de Medio: ${lease.mediaSpace.mediaItem.type}

Nueva URL de Agrupación: ${redirectUrl}

Para ver más detalles, ingrese al sistema.
      `.trim()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 