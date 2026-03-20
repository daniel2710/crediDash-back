import { z } from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    lastname: z.string().min(1, 'Lastname is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    type: z.enum(['admin', 'reviewer'], {
        message: 'Type must be admin or reviewer'
    })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
