import { z } from 'zod';

// Schema for creating a new review
export const CreateReviewRequestBodySchema = z.object({
    task_id: z.string().transform(val => parseInt(val)).pipe(z.number().positive('Task ID must be a positive number')),
    submissionDesc: z.string().min(1, 'Submission description is required').max(1000, 'Description too long'),
});

// Schema for updating a review (approve/reject)
export const UpdateReviewRequestBodySchema = z.object({
    action: z.enum(['APPROVED', 'REJECTED'], {
        errorMap: () => ({ message: 'Action must be either APPROVED or REJECTED' })
    }),
    rejectedReason: z.string().optional(),
});
// Schema for filtering reviews
export const ReviewFilterSchema = z.object({
    page: z.string().optional().transform(val => parseInt(val) || 1),
    limit: z.string().optional().transform(val => parseInt(val) || 10),
    status: z.enum(['APPROVED', 'REJECTED', 'PENDING']).optional(),
    project_id: z.string().optional().transform(val => parseInt(val)),
}); 