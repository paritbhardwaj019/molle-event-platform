-- CreateTable
CREATE TABLE "host_referrer_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hostId" TEXT NOT NULL,

    CONSTRAINT "host_referrer_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "host_referrer_codes_code_key" ON "host_referrer_codes"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredByHostId_referrerCode_fkey" FOREIGN KEY ("referredByHostId") REFERENCES "host_referrer_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_referrer_codes" ADD CONSTRAINT "host_referrer_codes_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
