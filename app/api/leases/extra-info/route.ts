import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate that lease exists first
    const lease = await prisma.lease.findUnique({
      where: { id: data.leaseId }
    });

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      );
    }

    const extraInfo = await prisma.leaseExtraInformation.create({
      data: {
        leaseId: data.leaseId,
        providerInfo: data.providerInfo,
        productDetails: data.productDetails,
        campaignRedirect: data.campaignRedirect,
        marketingGoals: data.marketingGoals,
        disclaimer: data.disclaimer,
        productUrl: data.productUrl,
        targetAudience: data.targetAudience,
        brandGraphics: data.brandGraphics || null,
        providerContact: data.providerContact,
        billingType: data.billingType,
        giftCampaignDetails: data.giftCampaignDetails || null,
        planAlaMedida: data.planAlaMedida || null,
        planAlaMedidaAmount: data.planAlaMedidaAmount || null
      },
    });

    return NextResponse.json(extraInfo);
  } catch (error) {
    console.error('Error creating lease extra information:', error);
    return NextResponse.json(
      { error: 'Failed to create lease extra information' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 