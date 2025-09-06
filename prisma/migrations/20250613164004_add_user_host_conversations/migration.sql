-- CreateTable
CREATE TABLE "user_host_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_host_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_host_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_host_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_host_conversations_userId_hostId_key" ON "user_host_conversations"("userId", "hostId");

-- AddForeignKey
ALTER TABLE "user_host_conversations" ADD CONSTRAINT "user_host_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_host_conversations" ADD CONSTRAINT "user_host_conversations_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_host_messages" ADD CONSTRAINT "user_host_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_host_messages" ADD CONSTRAINT "user_host_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "user_host_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
