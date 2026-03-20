import { z } from 'zod';

export const deleteUserSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    workspaceId: z.string().min(1, 'Workspace ID is required')
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
