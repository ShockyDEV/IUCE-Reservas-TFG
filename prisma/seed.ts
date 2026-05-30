import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedUser {
  email: string;
  name: string;
  role: UserRole;
}

const SEED_USERS: SeedUser[] = [
  { email: "iuce.tecnico@usal.es", name: "IUCE — Soporte Técnico", role: "SUPER_ADMIN" },
  { email: "solmos@usal.es", name: "S. Olmos", role: "USER" },
  { email: "fgarcia@usal.es", name: "F. García", role: "USER" },
  { email: "aliciagh@usal.es", name: "Alicia G. H.", role: "USER" },
  { email: "mjrconde@usal.es", name: "M. J. R. Conde", role: "USER" },
];

async function main() {
  console.log("Seeding database...");

  // Usuarios base para que el grupo IUCE pueda probar el sistema sin tener
  // que registrarse uno a uno. `upsert` mantiene la idempotencia: si el
  // usuario ya existe no se sobrescribe su nombre actual (puede haberlo
  // editado vía /perfil) ni su rol (puede haber sido promovido).
  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
      },
    });
  }
  console.log(`Asegurados ${SEED_USERS.length} usuarios @usal.es`);

  // Limpiamos los espacios previos para garantizar idempotencia
  await prisma.space.deleteMany();

  const spaces = await Promise.all([
    prisma.space.create({
      data: {
        name: "Aula 17A",
        code: "IUCE-17A",
        description:
          "Aula principal de docencia del IUCE. Espacio amplio con disposición flexible para clases, seminarios y conferencias.",
        capacity: 40,
        floor: 1,
        building: "IUCE - Paseo de Canalejas 169",
        equipment: JSON.stringify([
          "Proyector HD",
          "Pantalla motorizada",
          "Pizarra blanca",
          "Sistema de sonido",
          "Wi-Fi",
          "Enchufes en mesas",
        ]),
        accessibility: true,
        color: "#C8102E",
        imageUrl: "/images/spaces/aula-17a.jpg",
      },
    }),
    prisma.space.create({
      data: {
        name: "Aula 12A",
        code: "IUCE-12A",
        description:
          "Aula de tamaño mediano para seminarios, grupos de trabajo y reuniones académicas. Disposición flexible.",
        capacity: 25,
        floor: 1,
        building: "IUCE - Paseo de Canalejas 169",
        equipment: JSON.stringify([
          "Proyector HD",
          "Pizarra blanca",
          "Wi-Fi",
          "Mesas movibles",
        ]),
        accessibility: true,
        color: "#3B7DD8",
        imageUrl: "/images/spaces/aula-12a.jpg",
      },
    }),
    prisma.space.create({
      data: {
        name: "Laboratorio",
        code: "IUCE-LAB",
        description:
          "Laboratorio equipado para prácticas con equipamiento informático específico y software educativo.",
        capacity: 20,
        floor: 0,
        building: "IUCE - Paseo de Canalejas 169",
        equipment: JSON.stringify([
          "20 puestos informáticos",
          "Proyector",
          "Pizarra digital",
          "Software educativo",
          "Wi-Fi",
        ]),
        accessibility: true,
        color: "#1B3A5C",
        imageUrl: "/images/spaces/laboratorio.jpg",
      },
    }),
    prisma.space.create({
      data: {
        name: "Sala de Usos Múltiples",
        code: "IUCE-SUM",
        description:
          "Sala polivalente para eventos, defensas, reuniones y actos académicos. Configurable según necesidad.",
        capacity: 60,
        floor: 0,
        building: "IUCE - Paseo de Canalejas 169",
        equipment: JSON.stringify([
          "Proyector HD",
          "Sistema de sonido",
          "Micrófonos",
          "Pantalla grande",
          "Mesas y sillas configurables",
        ]),
        accessibility: true,
        color: "#333333",
        imageUrl: "/images/spaces/sala-usos-multiples.jpg",
      },
    }),
  ]);

  console.log(`Insertados ${spaces.length} espacios`);
  console.log("");
  console.log("Cuentas de prueba @usal.es:");
  SEED_USERS.forEach((u) => {
    console.log(`  · ${u.email.padEnd(28)} ${u.role}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
