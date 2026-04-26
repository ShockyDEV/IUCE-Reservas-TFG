import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
