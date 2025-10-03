-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('CLIENT', 'PROVIDER', 'BILLER', 'TEAM');

-- CreateEnum
CREATE TYPE "FileTypes" AS ENUM ('FILE', 'FOLDER');

-- CreateEnum
CREATE TYPE "LegalRole" AS ENUM ('TEAM_LEAD', 'ASSOCIATE', 'PARALEGAL', 'ANALYST', 'INVESTIGATOR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FilledStatus" AS ENUM ('PENDING', 'COMPLETED', 'STUCK', 'PROCESSING', 'CANCELED');

-- CreateEnum
CREATE TYPE "signedStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PAID', 'UNPAID', 'DRAFT', 'SENT', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('HOURLY', 'MONTHLY', 'PROJECT_BASED', 'TASK_BASED', 'FIXED_FEE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('TO_DO', 'IN_PROGRESS', 'STUCK', 'DONE', 'OVER_DUE', 'IN_REVIEW');

-- CreateEnum
CREATE TYPE "Priorities" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('REJECTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "TimeStatus" AS ENUM ('PROCESSING', 'ENDED');

-- CreateEnum
CREATE TYPE "ProgressTypes" AS ENUM ('MAIL', 'MEETING', 'CHAT', 'CALL', 'COMMENT', 'TRANSCRIBTION', 'STATUS_CHANGED', 'MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'SCHEDULED', 'CANCELED', 'COMPLETED', 'PROCESSING');

-- CreateEnum
CREATE TYPE "Vote" AS ENUM ('ACCEPTED', 'REJECTED', 'PENDING');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('PLAIN_TEXT', 'MARKDOWN', 'IMAGE', 'VIDEOS', 'AUDIO', 'DOCUMENT', 'CALL');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('RINGING', 'PROCESSING', 'REJECTED', 'ENDED', 'NO_RESPONSE', 'LINE_BUSY');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "account_name" TEXT,
    "bring" TEXT DEFAULT 'null',
    "teams_member_count" TEXT DEFAULT 'null',
    "focus" TEXT[],
    "hear_about_as" TEXT DEFAULT 'null',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "active_status" TEXT NOT NULL DEFAULT 'Offline',
    "connect_mail_hash" TEXT,
    "encryption_key" TEXT,
    "encryption_vi" TEXT,
    "Role" "Roles" NOT NULL DEFAULT 'PROVIDER',
    "leader_id" INTEGER,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "UserTeam" (
    "team_member_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "leader_id" INTEGER NOT NULL,
    "role" "Roles" NOT NULL DEFAULT 'TEAM',
    "legalRole" "LegalRole",
    "customLegalRole" TEXT,

    CONSTRAINT "UserTeam_pkey" PRIMARY KEY ("team_member_id")
);

-- CreateTable
CREATE TABLE "Project" (
    "project_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "opposing" TEXT,
    "client_name" TEXT,
    "client_address" TEXT,
    "status" TEXT,
    "budget" INTEGER,
    "priority" TEXT,
    "filingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phases" TEXT[],

    CONSTRAINT "Project_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "TDocuments" (
    "t_document_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "description" TEXT,
    "key" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "TDocuments_pkey" PRIMARY KEY ("t_document_id")
);

-- CreateTable
CREATE TABLE "TemplateDocument" (
    "template_document_id" TEXT NOT NULL,
    "owner_id" INTEGER NOT NULL,

    CONSTRAINT "TemplateDocument_pkey" PRIMARY KEY ("template_document_id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "folder_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "file_type" "FileTypes" NOT NULL DEFAULT 'FOLDER',
    "template_document_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("folder_id")
);

-- CreateTable
CREATE TABLE "File" (
    "file_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "file_type" "FileTypes" NOT NULL DEFAULT 'FILE',
    "folder_id" TEXT NOT NULL,
    "lawyer_id" INTEGER,
    "client_id" INTEGER,
    "template_document_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "ProjectClient" (
    "project_client_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectClient_pkey" PRIMARY KEY ("project_client_id")
);

-- CreateTable
CREATE TABLE "Documents" (
    "document_id" TEXT NOT NULL,
    "project_client_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "description" TEXT,
    "name" TEXT,
    "key" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "Filled" (
    "filled_id" TEXT NOT NULL,
    "project_client_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "description" TEXT,
    "progress" TEXT,
    "date" TIMESTAMP(3),
    "name" TEXT,
    "key" TEXT,
    "status" "FilledStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Filled_pkey" PRIMARY KEY ("filled_id")
);

-- CreateTable
CREATE TABLE "signed" (
    "signed_id" TEXT NOT NULL,
    "project_client_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "file_url" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "key" TEXT,
    "sign_file_url" TEXT,
    "sign_size" INTEGER,
    "sign_mimeType" TEXT,
    "sign_filename" TEXT,
    "sign_key" TEXT,
    "sign_date" TIMESTAMP(3),
    "status" "signedStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signed_pkey" PRIMARY KEY ("signed_id")
);

-- CreateTable
CREATE TABLE "Updates" (
    "update_id" TEXT NOT NULL,
    "project_client_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "file_url" TEXT,

    CONSTRAINT "Updates_pkey" PRIMARY KEY ("update_id")
);

-- CreateTable
CREATE TABLE "Billing" (
    "billing_id" TEXT NOT NULL,
    "project_client_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" "BillingStatus" NOT NULL DEFAULT 'UNPAID',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "billing_type" "BillingType" NOT NULL DEFAULT 'HOURLY',
    "invoice_id" TEXT,
    "due_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("billing_id")
);

-- CreateTable
CREATE TABLE "BillingLineItem" (
    "line_item_id" TEXT NOT NULL,
    "billing_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_rate" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "user_id" INTEGER,
    "task_id" INTEGER,
    "time_entries" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingLineItem_pkey" PRIMARY KEY ("line_item_id")
);

-- CreateTable
CREATE TABLE "BillingConfig" (
    "config_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "billing_type" "BillingType" NOT NULL DEFAULT 'HOURLY',
    "hourly_rate" DOUBLE PRECISION,
    "monthly_salary" DOUBLE PRECISION,
    "project_fee" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingConfig_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "MemberRate" (
    "member_rate_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "billing_type" "BillingType" NOT NULL DEFAULT 'HOURLY',
    "hourly_rate" DOUBLE PRECISION,
    "monthly_salary" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberRate_pkey" PRIMARY KEY ("member_rate_id")
);

-- CreateTable
CREATE TABLE "TaskRate" (
    "task_rate_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "custom_rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskRate_pkey" PRIMARY KEY ("task_rate_id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "invoice_id" TEXT NOT NULL,
    "billing_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "biller_id" INTEGER NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billing_period_start" TIMESTAMP(3) NOT NULL,
    "billing_period_end" TIMESTAMP(3) NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "notes" TEXT,
    "terms_conditions" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "CaseAssignment" (
    "assignment_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "biller_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAssignment_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "project_member_id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_team_id" TEXT,
    "role" "Roles" NOT NULL DEFAULT 'TEAM',
    "legalRole" "LegalRole",
    "customLegalRole" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("project_member_id")
);

-- CreateTable
CREATE TABLE "Task" (
    "task_id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "Status" NOT NULL DEFAULT 'TO_DO',
    "created_by" INTEGER NOT NULL,
    "assigned_to" INTEGER,
    "phase" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "priority" "Priorities" NOT NULL DEFAULT 'NONE',
    "last_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stuckReason" TEXT,
    "overDueReason" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "Review" (
    "review_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "submissionDesc" TEXT NOT NULL,
    "file_url" TEXT,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "key" TEXT,
    "action" "ReviewAction",
    "rejectedReason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "TaskTime" (
    "time_id" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL DEFAULT 1,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3),
    "status" "TimeStatus" NOT NULL DEFAULT 'PROCESSING',
    "work_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTime_pkey" PRIMARY KEY ("time_id")
);

-- CreateTable
CREATE TABLE "TaskMember" (
    "task_member_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskMember_pkey" PRIMARY KEY ("task_member_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "Media" (
    "media_id" TEXT NOT NULL,
    "project_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER,
    "mimeType" TEXT,
    "filename" TEXT,
    "key" TEXT,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("media_id")
);

-- CreateTable
CREATE TABLE "OTP" (
    "otp" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "project_id" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "role" "Roles" NOT NULL,
    "legalRole" "LegalRole",
    "customLegalRole" TEXT,
    "user_id" INTEGER,
    "leader_id" INTEGER,
    "invited_email" TEXT,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcibtion" (
    "transcribtion_id" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "Transcibtion" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL DEFAULT 'Test',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcibtion_pkey" PRIMARY KEY ("transcribtion_id")
);

-- CreateTable
CREATE TABLE "Email" (
    "email_id" TEXT NOT NULL,
    "task_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "to_user" INTEGER DEFAULT 1,
    "project_id" INTEGER,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("email_id")
);

-- CreateTable
CREATE TABLE "TaskProgress" (
    "progress_id" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "type" "ProgressTypes" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "TaskProgress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "comment_id" TEXT NOT NULL,
    "project_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "meeting_id" TEXT NOT NULL,
    "task_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "heading" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isScheduled" BOOLEAN NOT NULL,
    "date" TIMESTAMP(3),
    "time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
    "duration" INTEGER NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("meeting_id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "meeting_participant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "vote" "Vote" DEFAULT 'PENDING',

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("meeting_participant_id")
);

-- CreateTable
CREATE TABLE "MeetingTranscibtion" (
    "meeting_transcribtion_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "transcribe" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingTranscibtion_pkey" PRIMARY KEY ("meeting_transcribtion_id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "conversation_id" TEXT NOT NULL,
    "name" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "last_message" TEXT,
    "task_id" INTEGER NOT NULL,
    "project_id" INTEGER,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "participant_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "conversation_id" TEXT NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("participant_id")
);

-- CreateTable
CREATE TABLE "Message" (
    "message_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "reciever_id" INTEGER NOT NULL,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_type" "ContentType" NOT NULL DEFAULT 'PLAIN_TEXT',
    "duration" TEXT DEFAULT '1min',
    "call_status" "CallStatus" NOT NULL DEFAULT 'RINGING',

    CONSTRAINT "Message_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Billing_invoice_id_key" ON "Billing"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "BillingConfig_project_id_key" ON "BillingConfig"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_billing_id_key" ON "Invoice"("billing_id");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "OTP_otp_key" ON "OTP"("otp");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_invited_email_key" ON "Invitation"("invited_email");

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTeam" ADD CONSTRAINT "UserTeam_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Folder"("folder_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_template_document_id_fkey" FOREIGN KEY ("template_document_id") REFERENCES "TemplateDocument"("template_document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("folder_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_template_document_id_fkey" FOREIGN KEY ("template_document_id") REFERENCES "TemplateDocument"("template_document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectClient" ADD CONSTRAINT "ProjectClient_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectClient" ADD CONSTRAINT "ProjectClient_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_project_client_id_fkey" FOREIGN KEY ("project_client_id") REFERENCES "ProjectClient"("project_client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Filled" ADD CONSTRAINT "Filled_project_client_id_fkey" FOREIGN KEY ("project_client_id") REFERENCES "ProjectClient"("project_client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signed" ADD CONSTRAINT "signed_project_client_id_fkey" FOREIGN KEY ("project_client_id") REFERENCES "ProjectClient"("project_client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Updates" ADD CONSTRAINT "Updates_project_client_id_fkey" FOREIGN KEY ("project_client_id") REFERENCES "ProjectClient"("project_client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_project_client_id_fkey" FOREIGN KEY ("project_client_id") REFERENCES "ProjectClient"("project_client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingLineItem" ADD CONSTRAINT "BillingLineItem_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "Billing"("billing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingLineItem" ADD CONSTRAINT "BillingLineItem_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingLineItem" ADD CONSTRAINT "BillingLineItem_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingConfig" ADD CONSTRAINT "BillingConfig_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRate" ADD CONSTRAINT "MemberRate_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "BillingConfig"("config_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberRate" ADD CONSTRAINT "MemberRate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRate" ADD CONSTRAINT "TaskRate_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "BillingConfig"("config_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "Billing"("billing_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_biller_id_fkey" FOREIGN KEY ("biller_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_biller_id_fkey" FOREIGN KEY ("biller_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAssignment" ADD CONSTRAINT "CaseAssignment_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "FK_ProjectMember_User_1" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "FK_ProjectMember_UserTeam_1" FOREIGN KEY ("user_team_id") REFERENCES "UserTeam"("team_member_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTime" ADD CONSTRAINT "TaskTime_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTime" ADD CONSTRAINT "TaskTime_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTime" ADD CONSTRAINT "TaskTime_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMember" ADD CONSTRAINT "TaskMember_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMember" ADD CONSTRAINT "TaskMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OTP" ADD CONSTRAINT "OTP_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcibtion" ADD CONSTRAINT "Transcibtion_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcibtion" ADD CONSTRAINT "Transcibtion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "Task"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("meeting_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscibtion" ADD CONSTRAINT "MeetingTranscibtion_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("meeting_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscibtion" ADD CONSTRAINT "MeetingTranscibtion_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "Conversation"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;
