-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "categorySource" TEXT,
ADD COLUMN     "notes" TEXT,
ALTER COLUMN "category" DROP NOT NULL;
