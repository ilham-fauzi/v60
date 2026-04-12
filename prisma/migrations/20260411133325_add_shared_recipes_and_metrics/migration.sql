-- CreateTable
CREATE TABLE "shared_recipes" (
    "token_id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "share_chain" TEXT NOT NULL DEFAULT '[]',
    "created_at" INTEGER NOT NULL,
    "expires_at" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event" TEXT NOT NULL,
    "anon_id" TEXT,
    "token_id" TEXT,
    "local_id" TEXT,
    "source" TEXT,
    "created_at" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "shared_recipes_expires_at_idx" ON "shared_recipes"("expires_at");

-- CreateIndex
CREATE INDEX "metrics_event_idx" ON "metrics"("event");

-- CreateIndex
CREATE INDEX "metrics_anon_id_idx" ON "metrics"("anon_id");

-- CreateIndex
CREATE INDEX "metrics_local_id_idx" ON "metrics"("local_id");
