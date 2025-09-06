-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "cashfreeOrderId" TEXT NOT NULL,
    "cashfreePaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_cashfreeOrderId_key" ON "subscription_payments"("cashfreeOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_cashfreePaymentId_key" ON "subscription_payments"("cashfreePaymentId");

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "subscription_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
