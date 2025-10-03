-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "UserRegistrationRequest" (
    "request_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "account_name" TEXT,
    "bring" TEXT,
    "teams_member_count" TEXT,
    "focus" TEXT[],
    "hear_about_as" TEXT,
    "company_name" VARCHAR(200),
    "reason" TEXT,
    "team_size" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "approved_at" TIMESTAMP(3),
    "approved_by" INTEGER,

    CONSTRAINT "UserRegistrationRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRegistrationRequest_email_key" ON "UserRegistrationRequest"("email");

-- CreateIndex
CREATE INDEX "UserRegistrationRequest_status_idx" ON "UserRegistrationRequest"("status");

-- CreateIndex
CREATE INDEX "UserRegistrationRequest_created_at_idx" ON "UserRegistrationRequest"("created_at");

-- AddForeignKey
ALTER TABLE "UserRegistrationRequest" ADD CONSTRAINT "UserRegistrationRequest_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
