-- AlterTable
ALTER TABLE "events" ADD COLUMN     "inviteFormId" TEXT;

-- AlterTable
ALTER TABLE "invite_requests" ADD COLUMN     "formData" JSONB;

-- CreateTable
CREATE TABLE "invite_forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "invite_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_form_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "formId" TEXT NOT NULL,

    CONSTRAINT "invite_form_fields_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_inviteFormId_fkey" FOREIGN KEY ("inviteFormId") REFERENCES "invite_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_forms" ADD CONSTRAINT "invite_forms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_form_fields" ADD CONSTRAINT "invite_form_fields_formId_fkey" FOREIGN KEY ("formId") REFERENCES "invite_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
