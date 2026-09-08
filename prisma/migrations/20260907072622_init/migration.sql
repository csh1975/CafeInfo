-- CreateTable
CREATE TABLE "Cafe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "travelTime" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "image" BLOB,
    "imageType" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Cafe_rating_idx" ON "Cafe"("rating");

-- CreateIndex
CREATE INDEX "Cafe_createdAt_idx" ON "Cafe"("createdAt");
