import { z } from "zod";

// Shared Zod schemas for API input validation.

// E.164 phone format, e.g. +919876543210. Used for WhatsApp routing numbers.
const e164 = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, "Must be E.164 format, e.g. +919876543210");

export const signupSchema = z.object({
  clinicName: z.string().min(2).max(120),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  city: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createLeadSchema = z.object({
  name: z.string().max(120).optional(),
  phone: z.string().min(8).max(20),
  treatmentInterest: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export const createAppointmentSchema = z.object({
  leadId: z.string().optional(),
  patientName: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  treatment: z.string().max(120).optional(),
  scheduledAt: z
    .string()
    .datetime()
    .refine((s) => {
      const t = new Date(s).getTime();
      // Not absurdly far in the past/future. Allow a small backdate for
      // same-day bookings just entered by staff.
      return t > Date.now() - 60 * 60 * 1000 && t < Date.now() + 365 * 24 * 60 * 60 * 1000;
    }, "scheduledAt must be a near-future date/time"),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  treatment: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export const settingsSchema = z.object({
  greeting: z.string().max(500).optional(),
  aboutClinic: z.string().max(2000).optional(),
  addressText: z.string().max(500).optional(),
  treatments: z.array(z.object({ name: z.string(), priceFrom: z.number().optional() })).optional(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  businessHours: z.record(z.string(), z.union([z.tuple([z.string(), z.string()]), z.null()])).optional(),
  autoReply: z.boolean().optional(),
  followUpsEnabled: z.boolean().optional(),
  remindersEnabled: z.boolean().optional(),
  whatsappNumber: z.union([e164, z.literal("")]).optional(),
  ownerPhone: z.union([e164, z.literal("")]).optional(),
});
