-- Clean up orphaned messages: set project_id to NULL for messages where project doesn't exist
UPDATE "Message" 
SET "project_id" = NULL 
WHERE "project_id" IS NOT NULL 
AND "project_id" NOT IN (SELECT "project_id" FROM "Project");

-- Add recipient_ids column
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "recipient_ids" JSON;

-- Drop existing foreign key constraint if it exists (in case of previous failed attempts)
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_project_id_fkey";

-- Add foreign key constraint for project relation
-- This will only work if all project_id values are either NULL or valid project IDs
ALTER TABLE "Message" 
ADD CONSTRAINT "Message_project_id_fkey" 
FOREIGN KEY ("project_id") 
REFERENCES "Project"("project_id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

