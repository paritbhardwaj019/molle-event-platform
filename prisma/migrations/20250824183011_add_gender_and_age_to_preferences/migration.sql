-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" "Gender";
