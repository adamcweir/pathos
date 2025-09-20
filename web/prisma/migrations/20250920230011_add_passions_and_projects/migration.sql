-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "public"."ProjectStage" AS ENUM ('idea', 'planning', 'development', 'testing', 'launch', 'maintenance');

-- CreateTable
CREATE TABLE "public"."Passion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPassion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPassion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'active',
    "stage" "public"."ProjectStage" NOT NULL DEFAULT 'idea',
    "privacy" "public"."PrivacyLevel" NOT NULL DEFAULT 'public',
    "userId" TEXT NOT NULL,
    "passionId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Passion_slug_key" ON "public"."Passion"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserPassion_userId_passionId_key" ON "public"."UserPassion"("userId", "passionId");

-- CreateIndex
CREATE INDEX "Project_userId_status_idx" ON "public"."Project"("userId", "status");

-- CreateIndex
CREATE INDEX "Project_passionId_idx" ON "public"."Project"("passionId");

-- AddForeignKey
ALTER TABLE "public"."Passion" ADD CONSTRAINT "Passion_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Passion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPassion" ADD CONSTRAINT "UserPassion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPassion" ADD CONSTRAINT "UserPassion_passionId_fkey" FOREIGN KEY ("passionId") REFERENCES "public"."Passion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_passionId_fkey" FOREIGN KEY ("passionId") REFERENCES "public"."Passion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
