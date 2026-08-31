import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();
  const categories = ["Account and Access", "Hardware", "Software", "Network"];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true }
    });
  }
  console.log("Seeded 4 categories successfully!");

  const requesters = [
    { email: "alice@example.com", name: "Alice Johnson" },
    { email: "bob@example.com", name: "Bob Smith" },
    { email: "charlie@example.com", name: "Charlie Brown" },
    { email: "david@example.com", name: "David Miller", isActive: true },
    { email: "eve@example.com", name: "Eve Inactive User", isActive: false }
  ];

  for (const user of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: user.email },
      update: { name: user.name, isActive: user.isActive ?? true },
      create: { email: user.email, name: user.name, isActive: user.isActive ?? true }
    });
  }

  const relatedSystems = [
    "ERP System",
    "HR Portal",
    "Email & Calendar",
    "VPN & Remote Access",
    "Internal Wiki",
    "Finance & Accounting"
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true }
    });
  }

  console.log("Seeded categories, requesters, and related systems successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
