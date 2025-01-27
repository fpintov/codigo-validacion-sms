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
