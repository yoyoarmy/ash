import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create status types first
  const statusTypes = [
    'Recibido',
    'Asignado',
    'Encendido',
    'Evidencia Enviada',
    'Reporte Enviado',
    'Facturado',
    'Completado'
  ];

  console.log('Creating status types...');
  
  for (const statusName of statusTypes) {
    await prisma.status.upsert({
      where: { name: statusName },
      update: {},
      create: { name: statusName }
    });
  }

  // Ensure status exists before querying
  const defaultStatus = await prisma.status.findUnique({
    where: { name: 'Recibido' }
  });

  if (!defaultStatus) {
    throw new Error('Default status not found after insert.');
  }

  console.log('Status types inserted successfully.');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('mariana', 10);
  const hashedPassword2 = await bcrypt.hash('joseph', 10);

  // Create users
  await prisma.user.upsert({
    where: { email: 'mariana.cordero@cochezycia.com' },
    update: {},
    create: {
      name: 'Mariana Cordero',
      email: 'mariana.cordero@cochezycia.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'joseph@ad.com' },
    update: {},
    create: {
      name: 'Joseph',
      email: 'joseph@ad.com',
      password: hashedPassword2,
      role: 'ADVERTISER',
    },
  });

  console.log('Users created successfully.');

  // Create brands
  const noveycochez = await prisma.brand.create({
    data: {
      name: 'Novey y Cochez',
    },
  });

  const novey = await prisma.brand.create({
    data: {
      name: 'Novey',
    },
  });

  const cochez = await prisma.brand.create({
    data: {
      name: 'Cochez',
    },
  });

  // Create media item types first
  const bastidores = await prisma.mediaItemType.create({
    data: {
      name: 'Bastidores de tiendas',
    },
  });

  const television = await prisma.mediaItemType.create({
    data: {
      name: 'Televisión',
    },
  });

  const pantallas = await prisma.mediaItemType.create({
    data: {
      name: 'Pantallas digitales',
    },
  });

  const mediosdigitales = await prisma.mediaItemType.create({
    data: {
      name: 'Medios Digitales',
    },
  });

  const banners = await prisma.mediaItemType.create({
    data: {
      name: 'Banners',
    },
  });

  const mupis = await prisma.mediaItemType.create({
    data: {
      name: 'Mupis',
    },
  });

  const planAlaMedida = await prisma.mediaItemType.create({
    data: {
      name: 'Plan a la medida',
    },
  });

  const noveyStores = [
    { name: 'Novey.com.pa', location: 'Web', brandId: novey.id },
    { name: 'Novey Medios Digitales', location: 'Digital', brandId: novey.id },
    { name: 'Novey Pauta en TV', location: 'Television', brandId: novey.id },
    { name: 'Novey Albrook', location: 'Albrook', brandId: novey.id },
    { name: 'Novey Arraiján', location: 'Arraiján', brandId: novey.id },
    { name: 'Novey Brisas del Golf', location: 'Brisas del Golf', brandId: novey.id },
    { name: 'Novey Calidonia', location: 'Calidonia', brandId: novey.id },
    { name: 'Novey Costa del Este', location: 'Costa del Este', brandId: novey.id },
    { name: 'Novey David', location: 'David', brandId: novey.id },
    { name: 'Novey La Doña', location: 'La Doña', brandId: novey.id },
    { name: 'Novey Los Angeles', location: 'Los Angeles', brandId: novey.id },
    { name: 'Novey Obarrio', location: 'Obarrio', brandId: novey.id },
    { name: 'Novey Plan a la medida', location: 'Plan a la medida', brandId: novey.id },
  ];

  for (const store of noveyStores) {
    await prisma.store.create({ data: store });
  }


  // Create stores for Cochez
  const cochezStores = [
    { name: 'Cochezycia.com', location: 'Web', brandId: cochez.id },
    { name: 'Cochez Medios Digitales', location: 'Digital', brandId: cochez.id },
    { name: 'Cochez Pauta en TV', location: 'Television', brandId: cochez.id },
    { name: 'Cochez Brisas del Golf', location: 'Brisas del Golf', brandId: cochez.id },
    { name: 'Cochez Penonomé', location: 'Penonomé', brandId: cochez.id },
    { name: 'Cochez Santiago', location: 'Santiago', brandId: cochez.id },
    { name: 'Cochez San Miguelito', location: 'San Miguelito', brandId: cochez.id },
    { name: 'Cochez Plan a la medida', location: 'Plan a la medida', brandId: cochez.id },
  ];

  for (const store of cochezStores) {
    await prisma.store.create({ data: store });
  }

  
  // Create media items
  const mediaItems = [
    { type: 'Bastidores', dimensions: "27' x 8'", format: 'Impreso', basePrice: 3000, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "19' x 19'", format: 'Impreso', basePrice: 2800, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "51' x 13'", format: 'Impreso', basePrice: 3100, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "45' x 10'", format: 'Impreso', basePrice: 3000, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "60' x 20'", format: 'Impreso', basePrice: 4000, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "40' x 16'", format: 'Impreso', basePrice: 3000, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "74' x 12'", format: 'Impreso', basePrice: 3500, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "69' x 16'", format: 'Impreso', basePrice: 3700, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Bastidores', dimensions: "60' x 15'", format: 'Impreso', basePrice: 4900, leaseDuration: 90, capacity: 1, mediaItemTypeId: bastidores.id },
    { type: 'Pantallas', dimensions: "10 segundos 560 pix x 1200 px", format: 'Video', basePrice: 1200, leaseDuration: 7, capacity: 12, mediaItemTypeId: pantallas.id },
    { type: 'Pantallas', dimensions: "10 segundos formato MP4 / 640x360 pix", format: 'Video', basePrice: 1200, leaseDuration: 7, capacity: 12, mediaItemTypeId: pantallas.id },
    { type: 'Mupi Indors 55 pulgadas', dimensions: "1080 x 1920 / 15 ss / 12,000 rotaciones al mes", format: 'Video', basePrice: 600, leaseDuration: 30, capacity: 7, mediaItemTypeId: mupis.id },
    { type: 'TV Abierta', dimensions: "1920x1080 pixeles / Mov o MP4", format: 'Video', basePrice: 2750, leaseDuration: 7, capacity: 4, mediaItemTypeId: television.id },
    { type: 'Sticky Banner', dimensions: '250,000 impresiones', format: 'Arte + Texto', basePrice: 300, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id  },
    { type: 'Banner Carrusel #2', dimensions: '250,000 impresiones', format: 'Arte + Productos', basePrice: 700, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Pinboard Banner 2, 5 y 6', dimensions: '250,000 impresiones', format: 'Arte', basePrice: 450, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Pinboard #2', dimensions: '200,000 impresiones', format: 'Artes', basePrice: 670, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Botom Banner #1', dimensions: '200,000 impresiones', format: 'Arte', basePrice: 400, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Botom Banner #4', dimensions: '200,000 impresiones', format: 'Arte', basePrice: 400, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Botom Banner #5', dimensions: '200,000 impresiones', format: 'Arte', basePrice: 400, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Botom Banner #6', dimensions: '200,000 impresiones', format: 'Arte', basePrice: 400, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Sticky Banner', dimensions: '80,000 impresiones', format: 'Arte + Texto', basePrice: 300, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Pinboard Banner 3 y 4', dimensions: '80,000 impresiones', format: 'Arte', basePrice: 450, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Banner Carrusel #1', dimensions: '80,000 impresiones', format: 'Arte + Productos', basePrice: 700, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Lower Banner #1', dimensions: '80,000 impresiones', format: 'Arte', basePrice: 400, leaseDuration: 15, capacity: 1, mediaItemTypeId: banners.id },
    { type: 'Facebook e Instagram', dimensions: 'Alcance de 230K y 500 clics', format: 'Arte', basePrice: 850, leaseDuration: 30, capacity: 1000, mediaItemTypeId: mediosdigitales.id },
    { type: 'Youtube', dimensions: 'Alcance de 309K y 500 clics, 20 segundos', format: 'Video animado', basePrice: 1700, leaseDuration: 30, capacity: 1000, mediaItemTypeId: mediosdigitales.id },
    { type: 'TikTok', dimensions: '1,000 clics, 20 segundos', format: 'Video', basePrice: 1950, leaseDuration: 30, capacity: 1000, mediaItemTypeId: mediosdigitales.id },
    { type: 'Programática en páginas web', dimensions: '2,200 clics, 360x600 px / 320x500 px / 320x50 px / 728x90 px / 300x250 px / 160x600 px', format: 'Arte', basePrice: 1400, leaseDuration: 30, capacity: 1000, mediaItemTypeId: mediosdigitales.id },
    { type: 'Demmand Gen: Youtube, Gmail, Red de Noticias de Google', dimensions: '5,000 clics, Video:1920x1080 px (horizontal), 1080x1920 px (vertical), 1080x1080 px (cuadrado), Arte: 1200 px x 3280px, Imagen cuadrada: 1200 px x 1200 px, Imagen vertical: 960 px x 1200', format: 'Arte y Video', basePrice: 1950, leaseDuration: 30, capacity: 1000, mediaItemTypeId: mediosdigitales.id },
    { type: 'Instagram: Post', dimensions: 'Alcance promedio de 50K cuentas', format: 'Arte', basePrice: 700, leaseDuration: 7, capacity: 1, mediaItemTypeId: mediosdigitales.id },
    { type: 'Instagram: Set de 3 historias', dimensions: 'Alcance promedio de 4K cuentas', format: 'Arte', basePrice: 500, leaseDuration: 30, capacity: 3, mediaItemTypeId: mediosdigitales.id },
    { type: 'Plan a la medida', dimensions: 'A la medida', format: 'A la medida', basePrice: 1, leaseDuration: 1, capacity: 1000, mediaItemTypeId: planAlaMedida.id },
  ];

  for (const mediaItem of mediaItems) {
    await prisma.mediaItem.create({ data: mediaItem });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
