-- AlterTable
ALTER TABLE "BrewStage" ADD COLUMN "action" TEXT DEFAULT 'none';

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "iceGrams" REAL DEFAULT 0;
