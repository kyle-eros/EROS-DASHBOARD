-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'SCHEDULER', 'CHATTER', 'CREATOR');

-- CreateEnum
CREATE TYPE "TicketType" AS ENUM ('CUSTOM_VIDEO', 'VIDEO_CALL', 'CONTENT_REQUEST', 'GENERAL_INQUIRY', 'URGENT_ALERT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TICKET_CREATED', 'TICKET_ASSIGNED', 'TICKET_STATUS_CHANGED', 'TICKET_COMMENTED', 'DEADLINE_APPROACHING', 'SYSTEM_ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stage_name" TEXT NOT NULL,
    "platforms" TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "preferences" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "type" "TicketType" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ticket_data" JSONB NOT NULL,
    "response_data" JSONB,
    "rejection_reason" TEXT,
    "deadline" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "assigned_to_id" UUID,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_history" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "previous_status" "TicketStatus",
    "new_status" "TicketStatus" NOT NULL,
    "previous_data" JSONB,
    "new_data" JSONB,
    "changed_by_id" UUID NOT NULL,
    "change_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_creator_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_creator_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_availability" (
    "id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "day_of_week" SMALLINT,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "specific_date" DATE,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "user_id" TEXT,
    "user_email" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "creators_user_id_key" ON "creators"("user_id");

-- CreateIndex
CREATE INDEX "creators_stage_name_idx" ON "creators"("stage_name");

-- CreateIndex
CREATE INDEX "creators_is_active_idx" ON "creators"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_ticket_number_key" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "tickets_ticket_number_idx" ON "tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "tickets_type_idx" ON "tickets"("type");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- CreateIndex
CREATE INDEX "tickets_creator_id_idx" ON "tickets"("creator_id");

-- CreateIndex
CREATE INDEX "tickets_created_by_id_idx" ON "tickets"("created_by_id");

-- CreateIndex
CREATE INDEX "tickets_assigned_to_id_idx" ON "tickets"("assigned_to_id");

-- CreateIndex
CREATE INDEX "tickets_deadline_idx" ON "tickets"("deadline");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at" DESC);

-- CreateIndex
CREATE INDEX "tickets_submitted_at_idx" ON "tickets"("submitted_at");

-- CreateIndex
CREATE INDEX "tickets_completed_at_idx" ON "tickets"("completed_at");

-- CreateIndex
CREATE INDEX "tickets_status_creator_id_idx" ON "tickets"("status", "creator_id");

-- CreateIndex
CREATE INDEX "tickets_status_assigned_to_id_idx" ON "tickets"("status", "assigned_to_id");

-- CreateIndex
CREATE INDEX "tickets_status_priority_idx" ON "tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "tickets_type_status_idx" ON "tickets"("type", "status");

-- CreateIndex
CREATE INDEX "ticket_history_ticket_id_idx" ON "ticket_history"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_history_changed_by_id_idx" ON "ticket_history"("changed_by_id");

-- CreateIndex
CREATE INDEX "ticket_history_created_at_idx" ON "ticket_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ticket_history_new_status_idx" ON "ticket_history"("new_status");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_comments_author_id_idx" ON "ticket_comments"("author_id");

-- CreateIndex
CREATE INDEX "ticket_comments_created_at_idx" ON "ticket_comments"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ticket_comments_is_internal_idx" ON "ticket_comments"("is_internal");

-- CreateIndex
CREATE INDEX "user_creator_assignments_user_id_idx" ON "user_creator_assignments"("user_id");

-- CreateIndex
CREATE INDEX "user_creator_assignments_creator_id_idx" ON "user_creator_assignments"("creator_id");

-- CreateIndex
CREATE INDEX "user_creator_assignments_is_primary_idx" ON "user_creator_assignments"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "user_creator_assignments_user_id_creator_id_key" ON "user_creator_assignments"("user_id", "creator_id");

-- CreateIndex
CREATE INDEX "creator_availability_creator_id_idx" ON "creator_availability"("creator_id");

-- CreateIndex
CREATE INDEX "creator_availability_specific_date_idx" ON "creator_availability"("specific_date");

-- CreateIndex
CREATE INDEX "creator_availability_day_of_week_idx" ON "creator_availability"("day_of_week");

-- CreateIndex
CREATE INDEX "creator_availability_is_available_idx" ON "creator_availability"("is_available");

-- CreateIndex
CREATE INDEX "creator_availability_is_recurring_idx" ON "creator_availability"("is_recurring");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_email_idx" ON "audit_logs"("user_email");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_history" ADD CONSTRAINT "ticket_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_creator_assignments" ADD CONSTRAINT "user_creator_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_creator_assignments" ADD CONSTRAINT "user_creator_assignments_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_availability" ADD CONSTRAINT "creator_availability_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

