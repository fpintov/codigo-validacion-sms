## Descripción del Requerimiento:

Yo como desarrollador necesito investigar cómo generar un código dinámico (solo numérico, 6 dígitos) con que expire a los 5 minutos de su generación.

Para esta prueba usaremos una base de datos sqLite en Prisma almacenada en nuestro propio ms.

La meta es implementar un código de verificación de 6 dígitos con una expiración de 5 minutos en Nest.js usando un enfoque típico:

- Generar el código de verificación.

- Guardar la información con un timestamp de expiración.

- Validar si el código sigue siendo válido dentro del tiempo permitido.

Utilizaremos un controlador para manejar la generación y validación del código de verificación, junto con un servicio para la lógica de negocio. La información de los códigos se guardará en la base de datos dev.db de tipo sqLite.

# Desarrollo de la Prueba

## I. Crear Proyecto e instalar dependencias necesarias.

Creación del proyecto y configuración del proyecto en NestJs:

nest new ms-sms-validacion
cd ms-sms-validacion

# Instalar Prisma y PostgreSQL
npm install prisma @prisma/client
npm install --save-dev @types/node

 Inicializa Prisma:

npx prisma init

Configura el puerto de la aplicación y la conexión a la base de datos en tu archivo .env:

PORT=3005
DATABASE_URL="file:./dev.db"

Crea el esquema en Prisma:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Cliente {
  id        Int                @id @default(autoincrement())
  rut       String             @unique
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  codigos   CodigoValidacion[]
  correos   Correo[]
}

model Correo {
  id        Int      @id @default(autoincrement())
  direccion String
  clienteId Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  cliente   Cliente  @relation(fields: [clienteId], references: [id])
}

model CodigoValidacion {
  id         Int      @id @default(autoincrement())
  codigo     String
  clienteId  Int
  expiracion DateTime
  createdAt  DateTime @default(now())
  cliente    Cliente  @relation(fields: [clienteId], references: [id])
}


Esto crea:

Cliente: Identificado por su RUT, con una relación 1:N hacia los correos.

Correo: Almacena las direcciones de correo asociadas a un cliente.

CodigoValidacion: Registra los códigos generados con fecha de expiración.

Genera el cliente Prisma:

npx prisma generate

Aplica las migraciones:

npx prisma migrate dev --name init

## II. Configurar Prisma en el Proyecto.

Crea el archivo prisma.module.ts en la ruta src/prisma/ y añade el siguiente código:

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
___________________________________

Crea el Archivo: src/prisma/prisma.service.ts:

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}


Registra el módulo en app.module.ts, tu archivo debería tener las siguientes importaciones:

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ValidacionModule } from './validacion/validacion.module';

@Module({
  imports: [PrismaModule, ValidacionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


## III. Creación de los archivos para ejecutar la lógica del programa.

Vamos a crear una carpeta llamada “validacion” dentro de “app/src/”.  Dentro de esta carpeta crearemos los siguientes archivos:

Controlador (validacion.controller.ts)

Servicio (validacion.service.ts)

Módulo (validacion.module.ts)

Primero añadiremos el siguiente código al Servicio:

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ValidacionService {
  constructor(private prisma: PrismaService) {}

  async generarCodigo(rut: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { rut } });

    if (!cliente) {
        return { mensaje: 'Cliente con Rut: ' + rut + ' no encontrado.' };
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

    await this.prisma.codigoValidacion.create({
      data: {
        codigo,
        clienteId: cliente.id,
        expiracion,
      },
    });

    return { codigo, expiracion };
  }

  async validarCodigo(rut: string, codigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { rut },
      include: { codigos: true }, // Aquí usamos el nombre correcto de la relación
    });
  
    if (!cliente) {
        return { mensaje: 'Cliente con Rut: ' + rut + ' no encontrado.' };
    }
  
    const validacion = cliente.codigos.find(
      (registro) => registro.codigo === codigo,
    );
  
    if (!validacion) {
      return { valido: false, mensaje: 'Código: ' + codigo + ' es incorrecto.' };
    }
  
    if (validacion.expiracion < new Date()) {
      return { valido: false, mensaje: 'Código: ' + codigo + ' ya expiró.' };
    }
  
    return { valido: true, mensaje: 'Código: ' + codigo + ' es válido y aun no ha expirado.'};
  }
  
}


En segundo lugar, modificaremos el Controlador:

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ValidacionService } from './validacion.service';

@Controller('validacion')
export class ValidacionController {
  constructor(private readonly validacionService: ValidacionService) {}

  @Post('generar')
  async generarCodigo(@Body('rut') rut: string) {
    return this.validacionService.generarCodigo(rut);
  }

  @Get('validar')
  async validarCodigo(@Query('rut') rut: string, @Query('codigo') codigo: string) {
    return this.validacionService.validarCodigo(rut, codigo);
  }
}


Seguido de esto modificaremos el archivo validacion.module.ts:

import { Module } from '@nestjs/common';
import { ValidacionService } from './validacion.service';
import { ValidacionController } from './validacion.controller';


@Module({
  controllers: [ValidacionController],
  providers: [ValidacionService],
})
export class ValidacionModule {}

__________________________________

Importante. Se debe importar el archivo validacion.module.ts en app.module.ts:

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ValidacionModule } from './validacion/validacion.module';

@Module({
  imports: [PrismaModule, ValidacionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

## IV. Generando Datos para la Prueba:

Crea el siguiente script en la carpeta sr/prisma/:

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Crear cliente
  const cliente = await prisma.cliente.create({
    data: {
      rut: '12345678-9',
      correos: {
        create: [
          { direccion: 'cliente1@example.com' },
          { direccion: 'cliente1-alt@example.com' },
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


Ejecuta el script con:

ts-node prisma/seed.ts

Si no tienes ts-node instalado, instálalo con:

npm install ts-node --save-dev

Verifica los Datos

Puedes usar el cliente de Prisma llamado “Prisma Studio” para confirmar que los registros se han insertado correctamente:

npx prisma studio



## V. Pruebas con Postman

# Configura Postman.

Abre Postman y crea dos requests  para probar los endpoints principales de tu microservicio:

Generar Código (POST /validacion/generar)

     POST   http://localhost:3005/validacion/generar

     En el body del request añades esto:

{
  "rut": "13243890-0"
}

Dale a enviar, el resultado esperado es este:

{
    "codigo": "238471",
    "expiracion": "2025-01-27T15:23:18.987Z"
}

Validar Código (GET /validacion/validar)

  GET   http://localhost:3005/validacion/validar?rut=13243890-0&codigo=858919

En la sección Params, añade los siguientes datos:

El resultado esperado es el siguiente:

{
    "valido": true,
    "mensaje": "Código: 858919 es válido y aun no ha expirado."
}

Si el token es erróneo o ya expiró:

{
    "valido": false,
    "mensaje": "Código: 858919 ya expiró."
}

# Conclusiones de al Spike

El microservicio ms-sms-validacion está diseñado para gestionar la generación y validación de códigos de verificación asociados a clientes identificados por su RUT. Este sistema permite validar direcciones de correo electrónico mediante códigos de 6 dígitos que expiran en 5 minutos, proporcionando una solución ágil y segura para la autenticación.

El microservicio fue desarrollado utilizando NestJS para el backend y Prisma como ORM, con SQLite como base de datos embebida para facilitar pruebas y despliegue rápido. Está estructurado con módulos que manejan la lógica de generación de códigos, validación, y las relaciones entre clientes, correos y códigos en la base de datos. Los endpoints principales son:

POST /validacion/generar: Genera un nuevo código de validación para un cliente.

GET /validacion/validar: Valida un código generado previamente.

Este microservicio es ideal para usar de ejemplo cuando se requiere generar códigos dinámicos de autenticación con expiración determinada de manera simple, extensible y eficiente.

## Poner en marcha:

> npm run start:dev

