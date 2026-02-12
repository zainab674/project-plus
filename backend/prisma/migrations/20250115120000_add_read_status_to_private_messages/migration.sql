-- AlterTable
ALTER TABLE "PrivateMessage" ADD COLUMN "is_read" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PrivateMessage" ADD COLUMN "read_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PrivateMessage_is_read_idx" ON "PrivateMessage"("is_read");
CREATE INDEX "PrivateMessage_receiver_id_is_read_idx" ON "PrivateMessage"("receiver_id", "is_read");






