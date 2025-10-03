-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "acted_by_id" INTEGER,
ADD COLUMN     "submitted_by_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_acted_by_id_fkey" FOREIGN KEY ("acted_by_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
