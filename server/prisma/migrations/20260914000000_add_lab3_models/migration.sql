-- CreateEnum
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMIN');

-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'URGENT';

-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'OPEN';
ALTER TYPE "TicketStatus" ADD VALUE 'WAITING_FOR_REQUESTER';
ALTER TYPE "TicketStatus" ADD VALUE 'REOPENED';
ALTER TYPE "TicketStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "RequesterUser" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "isRequesterResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Case-insensitive unique index on email per Spec #61
CREATE UNIQUE INDEX "User_lower_email_key" ON "User"(LOWER("email"));

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Comment_ticketId_createdAt_idx" ON "Comment"("ticketId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "InternalNote_ticketId_createdAt_idx" ON "InternalNote"("ticketId", "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RevokedToken_jti_key" ON "RevokedToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedToken_jti_idx" ON "RevokedToken"("jti");

-- CreateIndex
CREATE INDEX "RevokedToken_expiresAt_idx" ON "RevokedToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RequesterUser_userId_key" ON "RequesterUser"("userId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_ownerId_idx" ON "Ticket"("ownerId");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- AddForeignKey
ALTER TABLE "RequesterUser" ADD CONSTRAINT "RequesterUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevokedToken" ADD CONSTRAINT "RevokedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================================
-- DATA MIGRATION: Migrate existing RequesterUser records to canonical User entities
-- =========================================================================================

-- 1. Create canonical User records from existing RequesterUser records with initial temporary password
INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isActive", "mustChangePassword", "tokenVersion", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    LOWER("email"),
    "name",
    '$2b$10$mmnjh86WKnV9oZsR2t69juJAexiFEEB2gnfTtLswlv2WaRmsb/qM6',
    'REQUESTER'::"Role",
    "isActive",
    true,
    0,
    "createdAt",
    NOW()
FROM "RequesterUser"
ON CONFLICT ("email") DO NOTHING;

-- 2. Link RequesterUser.userId to newly created User.id
UPDATE "RequesterUser"
SET "userId" = "User"."id"
FROM "User"
WHERE LOWER("RequesterUser"."email") = LOWER("User"."email");

-- 3. Link existing Ticket.userId to User.id via RequesterUser
UPDATE "Ticket"
SET "userId" = "RequesterUser"."userId"
FROM "RequesterUser"
WHERE "Ticket"."requesterId" = "RequesterUser"."id";

-- 4. Synchronize initial status from currentStatus for all existing tickets
UPDATE "Ticket" SET "status" = "currentStatus";

-- =========================================================================================
-- DATABASE TRIGGER: Guarantee Ticket.status (canonical) and Ticket.currentStatus never diverge
-- =========================================================================================
CREATE OR REPLACE FUNCTION sync_ticket_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."status" IS DISTINCT FROM OLD."status" AND NEW."currentStatus" IS NOT DISTINCT FROM OLD."currentStatus" THEN
        NEW."currentStatus" := NEW."status";
    ELSIF NEW."currentStatus" IS DISTINCT FROM OLD."currentStatus" AND NEW."status" IS NOT DISTINCT FROM OLD."status" THEN
        NEW."status" := NEW."currentStatus";
    ELSIF NEW."status" IS DISTINCT FROM NEW."currentStatus" THEN
        -- Canonical Lab 3 status takes precedence
        NEW."currentStatus" := NEW."status";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_ticket_status ON "Ticket";
CREATE TRIGGER trg_sync_ticket_status
BEFORE INSERT OR UPDATE ON "Ticket"
FOR EACH ROW
EXECUTE FUNCTION sync_ticket_status();
