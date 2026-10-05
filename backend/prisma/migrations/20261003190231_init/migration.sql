-- CreateEnum
CREATE TYPE "SoftwareLicenseStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "software_licenses" (
    "id" TEXT NOT NULL,
    "software_name" TEXT NOT NULL,
    "provider" TEXT,
    "license_type" TEXT,
    "license_quantity" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "cost" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "SoftwareLicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_assignments" (
    "id" TEXT NOT NULL,
    "software_license_id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "software_license_id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "software_licenses_software_name_idx" ON "software_licenses"("software_name");

-- CreateIndex
CREATE INDEX "software_licenses_provider_idx" ON "software_licenses"("provider");

-- CreateIndex
CREATE INDEX "software_licenses_status_idx" ON "software_licenses"("status");

-- CreateIndex
CREATE INDEX "software_licenses_expiry_date_idx" ON "software_licenses"("expiry_date");

-- CreateIndex
CREATE INDEX "software_licenses_deleted_at_idx" ON "software_licenses"("deleted_at");

-- CreateIndex
CREATE INDEX "license_assignments_software_license_id_idx" ON "license_assignments"("software_license_id");

-- CreateIndex
CREATE INDEX "license_assignments_core_user_id_idx" ON "license_assignments"("core_user_id");

-- CreateIndex
CREATE INDEX "license_assignments_deleted_at_idx" ON "license_assignments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "license_assignments_software_license_id_core_user_id_key" ON "license_assignments"("software_license_id", "core_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_software_license_id_idx" ON "audit_logs"("software_license_id");

-- CreateIndex
CREATE INDEX "audit_logs_core_user_id_idx" ON "audit_logs"("core_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_software_license_id_fkey" FOREIGN KEY ("software_license_id") REFERENCES "software_licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_software_license_id_fkey" FOREIGN KEY ("software_license_id") REFERENCES "software_licenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
