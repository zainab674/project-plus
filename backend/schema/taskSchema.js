import { z } from 'zod';

// project_id, name, description, assigned_to, otherMember, priority, last_date
export const CreateTaskRequestBodySchema = z.object({
    project_id: z.number(),
    name: z.string().min(1,'Name is required.'),
    description: z.string().optional(),
    assigned_to: z.number(),
    otherMember: z.array(z.number()).optional(),
    priority: z.enum(['CRITICAL','HIGH','MEDIUM','LOW','NONE']),
    status: z.enum(['TO_DO','IN_PROGRESS','STUCK','DONE'])
});