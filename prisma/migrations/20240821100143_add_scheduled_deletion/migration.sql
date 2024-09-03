/*
  Warnings:

  - You are about to drop the column `itemId` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `isMovie` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tmdbId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isMovie` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_itemId_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "scheduledDeletion" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "itemId",
ADD COLUMN     "isMovie" BOOLEAN NOT NULL,
ADD COLUMN     "scheduledDeletion" TIMESTAMP(3),
ADD COLUMN     "tmdbId" INTEGER NOT NULL,
ALTER COLUMN "rating" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "isMovie" BOOLEAN NOT NULL;
