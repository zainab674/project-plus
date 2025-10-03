import { z } from 'zod';


export const AddProjectRequestBodySchema = z.object({
    name: z.string().min(1,'project name is requied.'),
    description: z.string().optional(),
    opposing: z.string().optional(),
    client_name: z.string().optional(),
    client_address: z.string().optional(),
    priority: z.string().optional(),
    filingDate: z.string().optional(),
    phases: z.array(z.string()).optional(),
    status: z.string().optional(),
    selectedTeamMembers: z.array(z.number()).optional()
});