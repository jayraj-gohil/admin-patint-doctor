-- DropIndex
DROP INDEX "DoctorAvailability_doctorId_dayOfWeek_key";

-- CreateTable
CREATE TABLE "DoctorBreak" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoctorBreak_doctorId_date_idx" ON "DoctorBreak"("doctorId", "date");

-- CreateIndex
CREATE INDEX "DoctorAvailability_doctorId_dayOfWeek_idx" ON "DoctorAvailability"("doctorId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "DoctorBreak" ADD CONSTRAINT "DoctorBreak_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
