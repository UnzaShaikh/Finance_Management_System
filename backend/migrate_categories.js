const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.transaction.updateMany({
    where: { category: 'Uncategorized' },
    data: { category: 'others' }
  });
  console.log(`Migrated ${result.count} transactions to 'others' category.`);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
