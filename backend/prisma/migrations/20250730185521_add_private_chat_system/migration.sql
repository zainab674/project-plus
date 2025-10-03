-- CreateTable
CREATE TABLE "PrivateConversation" (
    "private_conversation_id" TEXT NOT NULL,
    "user1_id" INTEGER NOT NULL,
    "user2_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateConversation_pkey" PRIMARY KEY ("private_conversation_id")
);

-- CreateTable
CREATE TABLE "PrivateMessage" (
    "private_message_id" TEXT NOT NULL,
    "private_conversation_id" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" "ContentType" NOT NULL DEFAULT 'PLAIN_TEXT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateMessage_pkey" PRIMARY KEY ("private_message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateConversation_user1_id_user2_id_task_id_key" ON "PrivateConversation"("user1_id", "user2_id", "task_id");

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateConversation" ADD CONSTRAINT "PrivateConversation_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_private_conversation_id_fkey" FOREIGN KEY ("private_conversation_id") REFERENCES "PrivateConversation"("private_conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMessage" ADD CONSTRAINT "PrivateMessage_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
