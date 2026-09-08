/*
  Warnings:

  - You are about to drop the column `latitude` on the `Cafe` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Cafe` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cafe" (
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
INSERT INTO "new_Cafe" ("address", "createdAt", "description", "id", "image", "imageType", "name", "rating", "travelTime", "updatedAt") SELECT "address", "createdAt", "description", "id", "image", "imageType", "name", "rating", "travelTime", "updatedAt" FROM "Cafe";
DROP TABLE "Cafe";
ALTER TABLE "new_Cafe" RENAME TO "Cafe";
CREATE INDEX "Cafe_rating_idx" ON "Cafe"("rating");
CREATE INDEX "Cafe_createdAt_idx" ON "Cafe"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
