-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "is_group_chat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "project_id" INTEGER,
ADD COLUMN     "task_id" INTEGER,
ALTER COLUMN "reciever_id" DROP NOT NULL;
