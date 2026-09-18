import { PrismaClient, DayOfWeek } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@clinic.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@1234";

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Admin ready: ${adminEmail} / ${adminPassword}`);

  const doctors = [
    { name: "Dr. John Carter", specialization: "Cardiologist" },
    { name: "Dr. Sarah Lee", specialization: "Dermatologist" },
  ];

  const weekdays: DayOfWeek[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ];

  for (const doc of doctors) {
    const existing = await prisma.doctor.findFirst({ where: { name: doc.name } });
    const doctor =
      existing ??
      (await prisma.doctor.create({
        data: doc,
      }));

    for (const day of weekdays) {
      await prisma.doctorAvailability.upsert({
        where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: day } },
        update: {},
        create: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
        },
      });
    }
  }
  console.log("Seed doctors + Mon-Fri 09:00-17:00 availability ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
