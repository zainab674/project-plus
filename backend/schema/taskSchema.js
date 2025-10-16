import { z } from 'zod';

// project_id, name, description, assigned_to, otherMember, priority, last_date
export const CreateTaskRequestBodySchema = z.object({
    project_id: z.union([z.string(), z.number()]).transform((val) => {
        const num = typeof val === 'string' ? parseInt(val) : val;
        if (isNaN(num)) throw new Error('project_id must be a valid number');
        return num;
    }),
    name: z.string().min(1,'Name is required.'),
    description: z.string().optional(),
    assigned_to: z.union([z.string(), z.number()]).optional().transform((val) => {
        if (val === undefined || val === null || val === -1) return undefined;
        const num = typeof val === 'string' ? parseInt(val) : val;
        if (isNaN(num)) throw new Error('assigned_to must be a valid number');
        return num;
    }),
    otherMember: z.union([z.string(), z.array(z.number())]).optional().transform((val) => {
        if (!val) return [];
        if (typeof val === 'string') {
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) {
                    return parsed.map(id => {
                        const num = typeof id === 'string' ? parseInt(id) : id;
                        if (isNaN(num)) throw new Error('otherMember must contain valid numbers');
                        return num;
                    });
                }
                throw new Error('otherMember must be an array');
            } catch (e) {
                throw new Error('otherMember must be a valid JSON array');
            }
        }
        return val.map(id => {
            const num = typeof id === 'string' ? parseInt(id) : id;
            if (isNaN(num)) throw new Error('otherMember must contain valid numbers');
            return num;
        });
    }),
    priority: z.enum(['CRITICAL','HIGH','MEDIUM','LOW','NONE']),
    status: z.enum(['TO_DO','IN_PROGRESS','STUCK','DONE']),
    phase: z.string().optional()
});