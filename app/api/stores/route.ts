import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received store data:', body);

    if (!body.name || !body.location || !body.brandId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const store = await prisma.store.create({
      data: {
        name: body.name,
        location: body.location,
        brandId: body.brandId,
        mediaSpaces: {
          create: []
        }
      }
    });

    console.log('Created store:', store);
    return NextResponse.json(store);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Error creating store:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to create store',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandIdParam = searchParams.get('brandId');
    console.log('\n=== STORES API CALLED ===');
    console.log('🔍 URL:', request.url);
    console.log('🔍 brandIdParam:', brandIdParam, 'type:', typeof brandIdParam);

    // Safely parse the brandId
    const brandId = brandIdParam ? parseInt(brandIdParam, 10) : NaN;
    console.log('🔍 Parsed brandId:', brandId, 'type:', typeof brandId);

    // If no valid brandId (NaN) => return ALL stores
    if (isNaN(brandId)) {
      console.log('📋 No valid brandId, returning ALL stores');
      const allStores = await prisma.store.findMany({
        include: {
          mediaSpaces: {
            include: {
              mediaItem: {
                include: {
                  mediaItemType: true
                }
              },
              leases: {
                where: {
                  endDate: { gte: new Date() }
                }
              }
            }
          },
          brand: true
        }
      });
      console.log(`📋 Found ${allStores.length} total stores`);
      return NextResponse.json(allStores);
    }

    // Fetch the brand from Prisma
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, name: true }
    });
    console.log('🏢 Found brand:', JSON.stringify(brand, null, 2));

    // If no brand found, return empty array
    if (!brand) {
      console.log('❌ No brand found for brandId:', brandId);
      return NextResponse.json([]);
    }

    // If it's Novey y Cochez (id: 1) => return ONLY stores with brandId 2 and 3
    if (brand.id === 1) {
      console.log('🔄 Brand is Novey y Cochez, fetching stores for brands 2 and 3');
      const stores = await prisma.store.findMany({
        where: {
          brandId: {
            in: [2, 3]
          }
        },
        include: {
          mediaSpaces: {
            include: {
              mediaItem: {
                include: {
                  mediaItemType: true
                }
              },
              leases: {
                where: {
                  endDate: { gte: new Date() }
                }
              }
            }
          },
          brand: true
        }
      });
      console.log(`✅ Found ${stores.length} stores for Novey y Cochez`);
      return NextResponse.json(stores);
    }

    // Otherwise, filter by the specific brandId
    console.log('🎯 Filtering by specific brandId:', brandId);
    const stores = await prisma.store.findMany({
      where: { brandId },
      include: {
        mediaSpaces: {
          include: {
            mediaItem: {
              include: {
                mediaItemType: true
              }
            },
            leases: {
              where: {
                endDate: { gte: new Date() }
              }
            }
          }
        },
        brand: true
      }
    });
    console.log(`✅ Found ${stores.length} stores for brand ${brandId}`);

    return NextResponse.json(stores);
  } catch (error) {
    console.error('❌ Error in GET /stores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    );
  }
}
