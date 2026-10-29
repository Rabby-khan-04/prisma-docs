/*
  Warnings:

  - Made the column `display_name` on table `customers` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "display_name" SET NOT NULL;
