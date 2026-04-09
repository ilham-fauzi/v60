-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "coffeeGrams" REAL NOT NULL,
    "waterGrams" REAL NOT NULL,
    "ratio" REAL NOT NULL,
    "grindSize" TEXT NOT NULL,
    "temperature" REAL NOT NULL,
    "beanOrigin" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BrewStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetWeight" REAL NOT NULL,
    "targetSeconds" INTEGER NOT NULL,
    "temperature" REAL NOT NULL,
    "notes" TEXT,
    CONSTRAINT "BrewStage_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrewSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "finalWeight" REAL NOT NULL,
    "historyJson" TEXT,
    "sensoryFeedback" TEXT,
    CONSTRAINT "BrewSession_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
