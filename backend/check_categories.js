const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.findMany({
    select: { category: true }
  });
  const categories = [...new Set(transactions.map(t => t.category))];
  console.log('Current Category Values in DB:', categories);
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
