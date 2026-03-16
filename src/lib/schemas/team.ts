import { z } from 'zod'

export const updateRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newRole: z.enum(['owner', 'manager', 'staff'] as const, {
    message: 'Role must be owner, manager, or staff',
  }),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'manager', 'staff'] as const, {
    message: 'Role must be owner, manager, or staff',
  }),
  fullName: z.string().min(1, 'Full name is required'),
})

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>
