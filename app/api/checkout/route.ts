import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { items, userId } = await request.json();
    
    // Add this debug log
    console.log('Checkout received raw items:', JSON.stringify(items, null, 2));
    console.log('First item extraInformation:', items[0]?.extraInformation);

    // Add detailed logging of the incoming data
    console.log('Raw checkout request data:', {
      items: items.map(item => ({
        spaceId: item.spaceId,
        extraInformation: {
          ...item.extraInformation,
          planAlaMedida: item.extraInformation?.planAlaMedida,
          planAlaMedidaAmount: item.extraInformation?.planAlaMedidaAmount
        }
      }))
    });

    // Create order and leases in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order first
      const newOrder = await tx.order.create({
        data: {
          userId,
        }
      });

      // Create leases for each item
      for (const item of items) {
        console.log('Processing checkout item:', {
          spaceId: item.spaceId,
          extraInfo: item.extraInformation,
          planAlaMedida: item.extraInformation?.planAlaMedida,
          planAlaMedidaAmount: item.extraInformation?.planAlaMedidaAmount
        });

        // Create lease directly in transaction
        const lease = await tx.lease.create({
          data: {
            mediaSpaceId: item.spaceId,
            customerName: item.extraInformation.customerName,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            amount: item.amount,
            statusId: 1,
            orderId: newOrder.id,
          }
        });

        // Create extra information in the same transaction
        await tx.leaseExtraInformation.create({
          data: {
            leaseId: lease.id,
            providerInfo: item.extraInformation.providerInfo || '',
            productDetails: item.extraInformation.productDetails || '',
            campaignRedirect: item.extraInformation.campaignRedirect || '',
            marketingGoals: item.extraInformation.marketingGoals || '',
            disclaimer: item.extraInformation.disclaimer || '',
            productUrl: item.extraInformation.productUrl || '',
            targetAudience: item.extraInformation.targetAudience || '',
            brandGraphics: item.extraInformation.brandGraphics || '',
            providerContact: item.extraInformation.providerContact || '',
            billingType: item.extraInformation.billingType || [],
            giftCampaignDetails: item.extraInformation.giftCampaignDetails || '',
            planAlaMedida: item.extraInformation.planAlaMedida ?? null,
            planAlaMedidaAmount: item.extraInformation.planAlaMedidaAmount ?? null
          }
        });

        // Update media space status
        await tx.mediaSpace.update({
          where: { id: item.spaceId },
          data: { status: 'leased' }
        });
      }

      return newOrder;
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Detailed error in checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create order and leases' },
      { status: 500 }
    );
  }
} 