/*
  Warnings:

  - A unique constraint covering the columns `[config_id,user_id]` on the table `MemberRate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MemberRate_config_id_user_id_key" ON "MemberRate"("config_id", "user_id");
