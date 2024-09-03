/*
  Warnings:

  - You are about to drop the column `profilImage` on the `List` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "List" DROP COLUMN "profilImage";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilImage" TEXT;
