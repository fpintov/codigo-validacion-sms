import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear cliente
  const cliente = await prisma.cliente.create({
    data: {
      rut: '12345678-9',
      correos: {
        create: [
          { direccion: 'francisco.pinto@parquedelrecuerdo.cl' },
          { direccion: 'fpintov1@gmail.com' },
        ],
      },
      codigos: {
        create: [
          {
            codigo: '123456',
            expiracion: new Date(Date.now() + 5 * 60 * 1000), // Expira en 5 minutos
          },
        ],
      },
    },
  });

  console.log('Cliente creado:', cliente);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
