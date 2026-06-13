-- ============================================================================
-- DentalFlow AI — Raw SQL Schema (PostgreSQL)
-- This is the SQL equivalent of prisma/schema.prisma, provided for reference,
-- manual provisioning, or non-Prisma tooling. In normal operation use
-- `prisma migrate deploy` / `prisma db push` instead of running this by hand.
-- ============================================================================

-- ----- Enums ----------------------------------------------------------------
CREATE TYPE "UserRole"          AS ENUM ('OWNER', 'RECEPTIONIST');
CREATE TYPE "PlanTier"          AS ENUM ('TRIAL', 'STARTER', 'PRO');
CREATE TYPE "LeadStatus"        AS ENUM ('NEW', 'ENGAGED', 'QUALIFIED', 'BOOKED', 'LOST');
CREATE TYPE "LeadSource"        AS ENUM ('WHATSAPP', 'MANUAL', 'WEBSITE');
CREATE TYPE "MessageDirection"  AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "MessageSender"     AS ENUM ('PATIENT', 'AI', 'HUMAN', 'SYSTEM');
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "AutomationStatus"  AS ENUM ('PENDING', 'SENT', 'CANCELLED', 'FAILED');
CREATE TYPE "FollowUpStage"     AS ENUM ('DAY_1', 'DAY_3', 'DAY_7');
CREATE TYPE "ReminderKind"      AS ENUM ('HOURS_24', 'HOURS_2');

-- ----- Clinic (tenant) ------------------------------------------------------
CREATE TABLE "Clinic" (
  "id"             TEXT PRIMARY KEY,
  "name"           TEXT NOT NULL,
  "whatsappNumber" TEXT UNIQUE,
  "city"           TEXT,
  "timezone"       TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "plan"           "PlanTier" NOT NULL DEFAULT 'TRIAL',
  "trialEndsAt"    TIMESTAMP(3),
  "isActive"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL
);

-- ----- ClinicSettings -------------------------------------------------------
CREATE TABLE "ClinicSettings" (
  "id"               TEXT PRIMARY KEY,
  "clinicId"         TEXT NOT NULL UNIQUE REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "greeting"         TEXT NOT NULL DEFAULT 'Hi! Thanks for messaging us. How can we help you smile today? 🦷',
  "aboutClinic"      TEXT NOT NULL DEFAULT '',
  "addressText"      TEXT NOT NULL DEFAULT '',
  "treatments"       JSONB NOT NULL DEFAULT '[]',
  "faqs"             JSONB NOT NULL DEFAULT '[]',
  "businessHours"    JSONB NOT NULL DEFAULT '{}',
  "autoReply"        BOOLEAN NOT NULL DEFAULT TRUE,
  "followUpsEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "remindersEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);

-- ----- User -----------------------------------------------------------------
CREATE TABLE "User" (
  "id"           TEXT PRIMARY KEY,
  "clinicId"     TEXT NOT NULL REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "email"        TEXT NOT NULL UNIQUE,
  "name"         TEXT,
  "passwordHash" TEXT NOT NULL,
  "role"         "UserRole" NOT NULL DEFAULT 'OWNER',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL
);
CREATE INDEX "User_clinicId_idx" ON "User"("clinicId");

-- ----- Lead -----------------------------------------------------------------
CREATE TABLE "Lead" (
  "id"                TEXT PRIMARY KEY,
  "clinicId"          TEXT NOT NULL REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "name"              TEXT,
  "phone"             TEXT NOT NULL,
  "treatmentInterest" TEXT,
  "status"            "LeadStatus" NOT NULL DEFAULT 'NEW',
  "source"            "LeadSource" NOT NULL DEFAULT 'WHATSAPP',
  "notes"             TEXT,
  "lastContactAt"     TIMESTAMP(3),
  "followUpStage"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_clinicId_phone_key" UNIQUE ("clinicId", "phone")
);
CREATE INDEX "Lead_clinicId_status_idx" ON "Lead"("clinicId", "status");

-- ----- Conversation ---------------------------------------------------------
CREATE TABLE "Conversation" (
  "id"        TEXT PRIMARY KEY,
  "clinicId"  TEXT NOT NULL REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "leadId"    TEXT NOT NULL UNIQUE REFERENCES "Lead"("id") ON DELETE CASCADE,
  "aiPaused"  BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Conversation_clinicId_idx" ON "Conversation"("clinicId");

-- ----- Message --------------------------------------------------------------
CREATE TABLE "Message" (
  "id"             TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "direction"      "MessageDirection" NOT NULL,
  "sender"         "MessageSender" NOT NULL,
  "body"           TEXT NOT NULL,
  "externalId"     TEXT UNIQUE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- ----- Appointment ----------------------------------------------------------
CREATE TABLE "Appointment" (
  "id"          TEXT PRIMARY KEY,
  "clinicId"    TEXT NOT NULL REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "leadId"      TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "patientName" TEXT NOT NULL,
  "phone"       TEXT NOT NULL,
  "treatment"   TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status"      "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Appointment_clinicId_scheduledAt_idx" ON "Appointment"("clinicId", "scheduledAt");

-- ----- FollowUp -------------------------------------------------------------
CREATE TABLE "FollowUp" (
  "id"           TEXT PRIMARY KEY,
  "clinicId"     TEXT NOT NULL REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "leadId"       TEXT NOT NULL REFERENCES "Lead"("id") ON DELETE CASCADE,
  "stage"        "FollowUpStage" NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status"       "AutomationStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowUp_leadId_stage_key" UNIQUE ("leadId", "stage")
);
CREATE INDEX "FollowUp_status_scheduledFor_idx" ON "FollowUp"("status", "scheduledFor");

-- ----- Reminder -------------------------------------------------------------
CREATE TABLE "Reminder" (
  "id"            TEXT PRIMARY KEY,
  "clinicId"      TEXT NOT NULL REFERENCES "Clinic"("id") ON DELETE CASCADE,
  "appointmentId" TEXT NOT NULL REFERENCES "Appointment"("id") ON DELETE CASCADE,
  "kind"          "ReminderKind" NOT NULL,
  "scheduledFor"  TIMESTAMP(3) NOT NULL,
  "status"        "AutomationStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt"        TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reminder_appointmentId_kind_key" UNIQUE ("appointmentId", "kind")
);
CREATE INDEX "Reminder_status_scheduledFor_idx" ON "Reminder"("status", "scheduledFor");
