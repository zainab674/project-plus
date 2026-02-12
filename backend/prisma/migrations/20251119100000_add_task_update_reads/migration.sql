-- Create table to store read receipts for task updates
CREATE TABLE "TaskUpdateRead" (
    "id" SERIAL PRIMARY KEY,
    "update_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskUpdateRead_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "TaskUpdate" ("update_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskUpdateRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Ensure a user only has one read receipt per update
CREATE UNIQUE INDEX "TaskUpdateRead_update_id_user_id_key"
    ON "TaskUpdateRead" ("update_id", "user_id");

-- Accelerate lookups by user
CREATE INDEX "TaskUpdateRead_user_id_idx"
    ON "TaskUpdateRead" ("user_id");


