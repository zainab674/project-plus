-- Fix orphaned TDocuments records before adding foreign key constraint
-- This migration handles TDocuments with user_id that doesn't exist in User table

-- Step 1: Update orphaned records to use a valid user_id
-- We'll use the first available user_id, or if none exists, we'll need to handle it differently
DO $$
DECLARE
    first_user_id INTEGER;
BEGIN
    -- Get the first user_id from User table
    SELECT user_id INTO first_user_id FROM "User" ORDER BY user_id LIMIT 1;
    
    -- If no users exist, we can't fix this - but this is unlikely
    IF first_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in User table. Cannot fix orphaned TDocuments.';
    END IF;
    
    -- Update orphaned TDocuments to use the first valid user_id
    UPDATE "TDocuments"
    SET user_id = first_user_id
    WHERE user_id NOT IN (SELECT user_id FROM "User");
    
    RAISE NOTICE 'Updated orphaned TDocuments records to use user_id: %', first_user_id;
END $$;

-- Step 2: Now add the foreign key constraint
-- This will be done by Prisma when we run db push again

