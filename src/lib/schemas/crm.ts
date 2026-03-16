import { z } from "zod"

export const CustomerSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  status: z.enum(["lead", "active", "inactive"]).default("lead"),
})

export type CustomerFormValues = z.infer<typeof CustomerSchema>

export const NoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
})

export type NoteFormValues = z.infer<typeof NoteSchema>
