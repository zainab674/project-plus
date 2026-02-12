-- CreateTable
CREATE TABLE "MessageRead" (
    "message_read_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("message_read_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_message_id_user_id_key" ON "MessageRead"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "MessageRead_message_id_idx" ON "MessageRead"("message_id");

-- CreateIndex
CREATE INDEX "MessageRead_user_id_idx" ON "MessageRead"("user_id");

-- CreateIndex
CREATE INDEX "MessageRead_read_at_idx" ON "MessageRead"("read_at");

-- CreateIndex
CREATE INDEX "Message_is_group_chat_idx" ON "Message"("is_group_chat");

-- CreateIndex
CREATE INDEX "Message_project_id_idx" ON "Message"("project_id");

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;






