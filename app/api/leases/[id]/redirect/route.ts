import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { campaignRedirect } = data;

    // First check if extraInformation exists for this lease
    const existingInfo = await prisma.leaseExtraInformation.findUnique({
      where: {
        leaseId: parseInt(params.id)
      }
    });

    let updatedLease;
    
    if (existingInfo) {
      // Update existing record
      updatedLease = await prisma.leaseExtraInformation.update({
        where: {
          leaseId: parseInt(params.id)
        },
        data: {
          campaignRedirect
        }
      });
    } else {
      // Create new record if it doesn't exist
      updatedLease = await prisma.leaseExtraInformation.create({
        data: {
          leaseId: parseInt(params.id),
          campaignRedirect,
          // Add required fields with default values
          providerInfo: '',
          productDetails: '',
          marketingGoals: '',
          disclaimer: '',
          productUrl: '',
          targetAudience: '',
          brandGraphics: '',
          providerContact: '',
          billingType: [],
          giftCampaignDetails: ''
        }
      });
    }

    return NextResponse.json(updatedLease);
  } catch (error) {
    console.error('Error updating lease redirect:', error);
    return NextResponse.json(
      { error: 'Failed to update lease redirect' },
      { status: 500 }
    );
  }
} 