import { PrismaClient, serviceCategory as ServiceCategoryEnum } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const serviceCategories = [
  ServiceCategoryEnum.TOWING,
  ServiceCategoryEnum.FLAT_TIRE,
  ServiceCategoryEnum.FUEL_DELIVERY,
  ServiceCategoryEnum.LOCKOUT,
  ServiceCategoryEnum.EMERGENCY,
  ServiceCategoryEnum.OTHER
];

async function main() {
  // Create fields for each service category
  for (const category of serviceCategories) {
    await prisma.field.upsert({
      where: { name: category },
      update: {},
      create: { name: category }
    });
  }

  // Create one provider per category
  for (const category of serviceCategories) {
    // Find the field ID
    const field = await prisma.field.findUnique({ where: { name: category } });
    if (!field) continue;
    const hashedPassword = await bcrypt.hash('Provider123!', 10);
    // Assign two categories per provider for demonstration
    const categoriesForProvider = [category];
    if (serviceCategories.indexOf(category) < serviceCategories.length - 1) {
      categoriesForProvider.push(serviceCategories[serviceCategories.indexOf(category) + 1]);
    }
    await prisma.provider.upsert({
      where: { email: `provider_${category.toLowerCase()}@example.com` },
      update: {},
      create: {
        email: `provider_${category.toLowerCase()}@example.com`,
        password: hashedPassword,
        fullName: `Provider ${category.replace('_', ' ')}`,
        phone: `+123456789${serviceCategories.indexOf(category).toString().padStart(2, '0')}`,
        photo: 'https://example.com/photo.jpg',
        serviceCategories: categoriesForProvider,
        fieldId: field.id
      }
    });
  }

  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
    },
  });
}

main()
  .then(() => {
    console.log('Seed completed.');
    return prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
