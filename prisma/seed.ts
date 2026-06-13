import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Seeds one demo clinic so you can log in and click around immediately.
// Login:  demo@dentalflow.ai  /  demo12345

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo12345", 10);

  const clinic = await prisma.clinic.upsert({
    where: { whatsappNumber: "+919999900000" },
    update: {},
    create: {
      name: "Smile Dental Clinic",
      whatsappNumber: "+919999900000",
      city: "Pune",
      plan: "TRIAL",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      settings: {
        create: {
          greeting: "Hi! Welcome to Smile Dental Clinic 🦷 How can we help you today?",
          aboutClinic: "Family-friendly dental clinic in Pune. Open Mon–Sat, 10am–7pm.",
          addressText: "12 MG Road, Pune 411001",
          treatments: [
            { name: "Teeth Cleaning", priceFrom: 500 },
            { name: "Root Canal", priceFrom: 3000 },
            { name: "Braces Consultation", priceFrom: 0 },
            { name: "Teeth Whitening", priceFrom: 4000 },
          ],
          faqs: [
            { q: "What are your timings?", a: "We're open Monday to Saturday, 10am to 7pm." },
            { q: "Do you accept walk-ins?", a: "Yes, but appointments are recommended to avoid waiting." },
          ],
          businessHours: {
            mon: ["10:00", "19:00"], tue: ["10:00", "19:00"], wed: ["10:00", "19:00"],
            thu: ["10:00", "19:00"], fri: ["10:00", "19:00"], sat: ["10:00", "19:00"], sun: null,
          },
        },
      },
      users: {
        create: { email: "demo@dentalflow.ai", name: "Dr. Demo", passwordHash, role: "OWNER" },
      },
    },
  });

  // A couple of sample leads + an appointment so the dashboard isn't empty.
  const lead = await prisma.lead.upsert({
    where: { clinicId_phone: { clinicId: clinic.id, phone: "+919876543210" } },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Ravi Kumar",
      phone: "+919876543210",
      treatmentInterest: "Teeth Cleaning",
      status: "BOOKED",
      source: "WHATSAPP",
      lastContactAt: new Date(),
      conversation: {
        create: {
          clinicId: clinic.id,
          messages: {
            create: [
              { direction: "INBOUND", sender: "PATIENT", body: "Hi, do you do teeth cleaning?" },
              { direction: "OUTBOUND", sender: "AI", body: "Hi! Yes, teeth cleaning starts at ₹500. Would you like to book?" },
              { direction: "INBOUND", sender: "PATIENT", body: "Yes, tomorrow evening." },
              { direction: "OUTBOUND", sender: "AI", body: "Booked for tomorrow 6 PM. See you, Ravi! 🦷" },
            ],
          },
        },
      },
    },
  });

  await prisma.appointment.create({
    data: {
      clinicId: clinic.id,
      leadId: lead.id,
      patientName: "Ravi Kumar",
      phone: "+919876543210",
      treatment: "Teeth Cleaning",
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "CONFIRMED",
    },
  });

  await prisma.lead.upsert({
    where: { clinicId_phone: { clinicId: clinic.id, phone: "+919812345678" } },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Priya Shah",
      phone: "+919812345678",
      treatmentInterest: "Braces",
      status: "QUALIFIED",
      source: "WHATSAPP",
      lastContactAt: new Date(),
    },
  });

  console.log("✅ Seeded demo clinic. Login: demo@dentalflow.ai / demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
