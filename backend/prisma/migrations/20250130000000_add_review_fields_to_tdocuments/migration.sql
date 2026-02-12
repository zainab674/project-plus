-- AlterTable
ALTER TABLE "TDocuments" ADD COLUMN IF NOT EXISTS "reviewed_by" INTEGER,
ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;


