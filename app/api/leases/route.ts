import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { sendEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log('Received lease data:', {
      ...data,
      extraInformation: {
        ...data.extraInformation,
        planAlaMedida: data.extraInformation?.planAlaMedida,
        planAlaMedidaAmount: data.extraInformation?.planAlaMedidaAmount
      }
    });

    // Validate dates
    const validationStartDate = new Date(data.startDate);
    const validationEndDate = new Date(data.endDate);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Check if dates are valid
    if (validationStartDate > validationEndDate) {
      return NextResponse.json({ 
        error: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      }, { status: 400 });
    }

    // Check if dates are within 1 year
    if (validationEndDate > oneYearFromNow) {
      return NextResponse.json({ 
        error: 'Las reservas no pueden ser más de un año en el futuro',
        maxDate: oneYearFromNow.toISOString()
      }, { status: 400 });
    }

    // First, check if we have capacity for these dates
    const mediaSpace = await prisma.mediaSpace.findUnique({
      where: { id: data.mediaSpaceId },
      include: {
        mediaItem: true,
        leases: {
      where: {
        AND: [
          {
                OR: [
                  {
                    AND: [
                      { startDate: { lte: new Date(data.endDate) } },
                      { endDate: { gte: new Date(data.startDate) } }
                    ]
                  }
                ]
              },
              {
                status: {
                  name: {
                    in: ['Recibido', 'Asignado', 'Encendido', 'Evidencia Enviada', 'Reporte Enviado', 'Facturado']
                  }
                }
              }
            ]
          },
          select: {
            startDate: true,
            endDate: true
          }
        }
      }
    });

    if (!mediaSpace) {
      return NextResponse.json({ error: 'Media space not found' }, { status: 404 });
    }

    const capacity = mediaSpace.mediaItem.capacity || 1;
    
    // Add this helper function at the top
    function getDatesBetween(start: Date, end: Date): string[] {
      const dates: string[] = [];
      const current = new Date(start);
      current.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(0, 0, 0, 0);

      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }

    // Pre-calculate all dates for existing leases
    const existingLeaseDates = mediaSpace.leases.reduce((acc, lease) => {
      const dates = getDatesBetween(lease.startDate, lease.endDate);
      dates.forEach(date => {
        acc.set(date, (acc.get(date) || 0) + 1);
      });
      return acc;
    }, new Map<string, number>());

    // Check new lease dates against existing ones
    const newLeaseDates = getDatesBetween(data.startDate, data.endDate);
    const datesAtCapacity = newLeaseDates.filter(date => 
      (existingLeaseDates.get(date) || 0) >= capacity
    );

    console.log('Capacity check:', {
      datesAtCapacity,
      capacity,
      dateOverlaps: Object.fromEntries(existingLeaseDates)
    });

    if (datesAtCapacity.length > 0) {
      return NextResponse.json({
        error: 'No capacity available for these dates',
        datesAtCapacity,
        capacity
      }, { status: 409 });
    }

    // Create the lease
    const lease = await prisma.lease.create({
        data: {
        mediaSpaceId: data.mediaSpaceId,
        customerName: data.customerName,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        amount: data.amount,
        statusId: 1, // Pending
        orderId: data.orderId,
      },
      include: {
        mediaSpace: {
          include: {
            store: true,
            mediaItem: true
          }
        }
        }
      });

      // Create the extra information
    if (data.extraInformation) {
      console.log('Received extraInformation:', data.extraInformation); // Debug log

      const extraInfo = await prisma.leaseExtraInformation.create({
        data: {
          leaseId: lease.id,
          providerInfo: data.extraInformation.providerInfo || '',
          productDetails: data.extraInformation.productDetails || '',
          campaignRedirect: data.extraInformation.campaignRedirect || '',
          marketingGoals: data.extraInformation.marketingGoals || '',
          disclaimer: data.extraInformation.disclaimer || '',
          productUrl: data.extraInformation.productUrl || '',
          targetAudience: data.extraInformation.targetAudience || '',
          brandGraphics: data.extraInformation.brandGraphics || '',
          providerContact: data.extraInformation.providerContact || '',
          billingType: data.extraInformation.billingType || [],
          giftCampaignDetails: data.extraInformation.giftCampaignDetails || '',
          planAlaMedida: data.extraInformation.planAlaMedida || null,
          planAlaMedidaAmount: data.extraInformation.planAlaMedidaAmount === '' 
            ? null 
            : data.extraInformation.planAlaMedidaAmount 
              ? parseFloat(data.extraInformation.planAlaMedidaAmount) 
              : null
        }
      });

      console.log('Created lease extra info:', extraInfo);
    }

    // Get the created lease with all its relations
    const createdLease = await prisma.lease.findUnique({
      where: { id: lease.id },
      include: {
        status: true,
        mediaSpace: {
          include: {
            store: true,
            mediaItem: true
          }
        },
        extraInformation: true // Make sure to include extraInformation
      }
    });

    console.log('Created lease:', {
      statusId: createdLease?.statusId,
      store: createdLease?.mediaSpace?.store,
      extraInfo: createdLease?.extraInformation
    });

    // If status is "Recibido" (status ID 1), send notification
    console.log('Checking status condition:', {
      currentStatusId: createdLease?.statusId,
      isRecibido: createdLease?.statusId === 1
    });
    
    if (createdLease?.statusId === 1) {
      try {
        console.log('Lease status is Recibido, attempting to send notification');
        console.log('Store brand ID:', createdLease?.mediaSpace?.store.brandId);
        
        // Get notification settings using raw query
        const notificationSettings = await prisma.$queryRaw`
          SELECT * FROM "NotificationSettings" 
          WHERE "brandId" = ${createdLease?.mediaSpace?.store.brandId}
          LIMIT 1
        `;

        console.log('Found notification settings:', notificationSettings);

        if (notificationSettings && notificationSettings[0]) {
          console.log('Attempting to send email to:', notificationSettings[0].email);
          await sendEmail({
            to: notificationSettings[0].email,
            subject: `Nueva Solicitud Recibida - ${createdLease?.mediaSpace?.store.name}`,
            text: `
Se ha recibido una nueva solicitud:

Información General:
Tienda: ${createdLease?.mediaSpace?.store.name}
Cliente: ${createdLease?.customerName}
Tipo de Medio: ${createdLease?.mediaSpace?.mediaItem.type}
Dimensiones: ${createdLease?.mediaSpace?.mediaItem.dimensions}
Fecha de Inicio: ${new Date(createdLease?.startDate).toLocaleDateString()}
Fecha de Fin: ${new Date(createdLease?.endDate).toLocaleDateString()}
Monto: $${createdLease?.amount}

Información de Campaña:
Información del Proveedor: ${createdLease?.extraInformation?.providerInfo || 'N/A'}
Detalles del Producto: ${createdLease?.extraInformation?.productDetails || 'N/A'}
URL del Producto: ${createdLease?.extraInformation?.productUrl || 'N/A'}
Redirección de Campaña: ${createdLease?.extraInformation?.campaignRedirect || 'N/A'}
Objetivos de Marketing: ${createdLease?.extraInformation?.marketingGoals || 'N/A'}
Público Objetivo: ${createdLease?.extraInformation?.targetAudience || 'N/A'}

Información Adicional:
Línea Gráfica: ${createdLease?.extraInformation?.brandGraphics || 'N/A'}
Contacto del Proveedor: ${createdLease?.extraInformation?.providerContact || 'N/A'}
Detalles de Campaña de Regalo: ${createdLease?.extraInformation?.giftCampaignDetails || 'N/A'}
Disclaimer: ${createdLease?.extraInformation?.disclaimer || 'N/A'}

${createdLease?.extraInformation?.planAlaMedida ? `Plan a la Medida URL: ${createdLease.extraInformation.planAlaMedida}
Monto Plan a la Medida: $${createdLease.extraInformation.planAlaMedidaAmount}` : ''}

Para ver más detalles, ingrese al sistema.
            `.trim()
          });
          console.log('Email sent successfully');
        } else {
          console.log('No notification settings found for brand ID:', createdLease?.mediaSpace?.store.brandId);
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }

    // Send additional email if lease is "Agrupado"
    if (createdLease?.extraInformation?.campaignRedirect === 'Agrupado') {
      try {
        await sendEmail({
          to: 'yoyo@adspacehub.com', // Replace with actual email
          subject: `Solicitud Agrupada Recibida - ${createdLease?.mediaSpace?.store.name}`,
          text: `
Se ha recibido una nueva solicitud AGRUPADA que requiere atención:

Información General:
Tienda: ${createdLease?.mediaSpace?.store.name}
Cliente: ${createdLease?.customerName}
Tipo de Medio: ${createdLease?.mediaSpace?.mediaItem.type}
Dimensiones: ${createdLease?.mediaSpace?.mediaItem.dimensions}
Fecha de Inicio: ${new Date(createdLease?.startDate).toLocaleDateString()}
Fecha de Fin: ${new Date(createdLease?.endDate).toLocaleDateString()}
Monto: $${createdLease?.amount}

Información de Campaña:
Información del Proveedor: ${createdLease?.extraInformation?.providerInfo || 'N/A'}
Detalles del Producto: ${createdLease?.extraInformation?.productDetails || 'N/A'}
URL del Producto: ${createdLease?.extraInformation?.productUrl || 'N/A'}
Redirección de Campaña: ${createdLease?.extraInformation?.campaignRedirect}
Objetivos de Marketing: ${createdLease?.extraInformation?.marketingGoals || 'N/A'}
Público Objetivo: ${createdLease?.extraInformation?.targetAudience || 'N/A'}

Información Adicional:
Línea Gráfica: ${createdLease?.extraInformation?.brandGraphics || 'N/A'}
Contacto del Proveedor: ${createdLease?.extraInformation?.providerContact || 'N/A'}
Detalles de Campaña de Regalo: ${createdLease?.extraInformation?.giftCampaignDetails || 'N/A'}
Disclaimer: ${createdLease?.extraInformation?.disclaimer || 'N/A'}

${createdLease?.extraInformation?.planAlaMedida ? `Plan a la Medida URL: ${createdLease.extraInformation.planAlaMedida}
Monto Plan a la Medida: $${createdLease.extraInformation.planAlaMedidaAmount}` : ''}

Para actualizar la URL de agrupación, visite:
http://localhost:3000/redirecciondecampana/${createdLease?.id}



          `.trim()
        });
        console.log('Agrupado notification email sent successfully');
      } catch (error) {
        console.error('Error sending agrupado notification:', error);
      }
    }

    return NextResponse.json(createdLease);
  } catch (error) {
    console.error('Error creating lease:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create lease' },
      { status: 500 }
    );
  }
}

// Helper function to update lease statuses
async function updateLeaseStatuses() {
  const now = new Date();
  
  // Find all active leases that have ended
  const expiredLeases = await prisma.lease.findMany({
    where: {
      statusId: { not: 7 },
      endDate: {
        lt: now
      }
    }
  });

  // Update their status to completed
  if (expiredLeases.length > 0) {
    await prisma.lease.updateMany({
      where: {
        id: {
          in: expiredLeases.map(lease => lease.id)
        }
      },
      data: {
        statusId: 7
      }
    });
  }
}

// Add this helper function at the top of the file
function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

// In the GET endpoint, modify the date availability check
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const mediaSpaceId = searchParams.get('mediaSpaceId');

    if (date && mediaSpaceId) {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(now.getFullYear() + 1);

      // Check if date is within valid range
      if (checkDate < now || checkDate > oneYearFromNow) {
        return NextResponse.json({
          date: checkDate,
          isBlocked: true,
          reason: 'Date must be between today and one year from now',
          maxDate: oneYearFromNow.toISOString()
        });
      }

      // Get existing leases for this media space
      const existingLeases = await prisma.lease.findMany({
        where: {
          mediaSpaceId: parseInt(mediaSpaceId),
          AND: [
            { startDate: { lte: checkDate } },
            { endDate: { gte: checkDate } },
            {
              status: {
                name: {
                  in: ['Recibido', 'Asignado', 'Encendido', 'Evidencia Enviada', 'Reporte Enviado', 'Facturado']
                }
              }
            }
          ]
        },
        select: {
          startDate: true,
          endDate: true
        }
      });

      const mediaSpace = await prisma.mediaSpace.findUnique({
        where: { id: parseInt(mediaSpaceId) },
        include: { mediaItem: true }
      });

      if (!mediaSpace) {
        return NextResponse.json({ error: 'Media space not found' }, { status: 404 });
      }

      const capacity = mediaSpace.mediaItem.capacity || 1;
      const isBlocked = existingLeases.length >= capacity;

      // Log for debugging
      console.log('Date availability check:', {
        date: checkDate,
        existingLeases: existingLeases.length,
        capacity,
        isBlocked
      });

      return NextResponse.json({
        date: checkDate,
        isBlocked,
        bookedDates: existingLeases
      });
    }

    // Rest of the GET endpoint code...
    const leases = await prisma.lease.findMany({
      include: {
        status: true,
        mediaSpace: {
          include: {
            store: true,
            mediaItem: true
          }
        },
        order: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        extraInformation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(leases || []);
  } catch (error) {
    console.error('Error fetching leases:', error);
    return NextResponse.json([]);
  }
}

// Update the sendNotificationEmail function
async function sendNotificationEmail(lease: any) {
  try {
    // Get the store's brand
    const store = await prisma.store.findUnique({
      where: { id: lease.mediaSpace.storeId },
      select: { 
        brandId: true,
        name: true 
      }
    });

    if (!store) return;

    // Get notification settings for this brand
    const settings = await prisma.notificationSettings.findFirst({
      where: { brandId: store.brandId }
    });

    if (!settings) return;

    // Send email using Resend
    await sendEmail({
      to: settings.email,
      subject: `Nueva Solicitud Recibida - ${store.name}`,
      text: `
Se ha recibido una nueva solicitud:

Información General:
Tienda: ${lease.mediaSpace.store.name}
Cliente: ${lease.customerName}
Tipo de Medio: ${lease.mediaSpace.mediaItem.type}
Dimensiones: ${lease.mediaSpace.mediaItem.dimensions}
Fecha de Inicio: ${new Date(lease.startDate).toLocaleDateString()}
Fecha de Fin: ${new Date(lease.endDate).toLocaleDateString()}
Monto: $${lease.amount}

Información de Campaña:
Información del Proveedor: ${lease.extraInformation?.providerInfo || 'N/A'}
Detalles del Producto: ${lease.extraInformation?.productDetails || 'N/A'}
URL del Producto: ${lease.extraInformation?.productUrl || 'N/A'}
Redirección de Campaña: ${lease.extraInformation?.campaignRedirect || 'N/A'}
Objetivos de Marketing: ${lease.extraInformation?.marketingGoals || 'N/A'}
Público Objetivo: ${lease.extraInformation?.targetAudience || 'N/A'}

Información Adicional:
Línea Gráfica: ${lease.extraInformation?.brandGraphics || 'N/A'}
Contacto del Proveedor: ${lease.extraInformation?.providerContact || 'N/A'}
Detalles de Campaña de Regalo: ${lease.extraInformation?.giftCampaignDetails || 'N/A'}
Disclaimer: ${lease.extraInformation?.disclaimer || 'N/A'}

${lease.extraInformation?.planAlaMedida ? `Plan a la Medida URL: ${lease.extraInformation.planAlaMedida}
Monto Plan a la Medida: $${lease.extraInformation.planAlaMedidaAmount}` : ''}

Para ver más detalles, ingrese al sistema.
      `.trim()
    });

  } catch (error) {
    console.error('Error sending notification email:', error);
  }
} 