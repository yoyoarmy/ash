import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow ADMIN and ASSOCIATE roles to access all orders
    if (!['ADMIN', 'ASSOCIATE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        leases: {
          include: {
            status: true,
            mediaSpace: {
              include: {
                store: true,
                mediaItem: true
              }
            },
            extraInformation: {
              select: {
                planAlaMedida: true,
                planAlaMedidaAmount: true,
                productUrl: true,
                billingType: true,
                providerInfo: true,
                productDetails: true,
                campaignRedirect: true,
                marketingGoals: true,
                disclaimer: true,
                targetAudience: true,
                brandGraphics: true,
                providerContact: true,
                giftCampaignDetails: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add debug logging
    console.log('First order lease details:', {
      leaseId: orders[0]?.leases[0]?.id,
      extraInfo: orders[0]?.leases[0]?.extraInformation,
      amount: orders[0]?.leases[0]?.amount
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Add POST handler
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create order with just the user connection
    const order = await prisma.order.create({
      data: {
        user: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
} 