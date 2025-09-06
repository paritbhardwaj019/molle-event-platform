-- CreateTable
CREATE TABLE "admin_push_notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image_url" TEXT,
    "link_url" TEXT,
    "target_audience" TEXT NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_push_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_push_notifications_created_at_idx" ON "admin_push_notifications"("created_at");
CREATE INDEX "admin_push_notifications_target_audience_idx" ON "admin_push_notifications"("target_audience");
