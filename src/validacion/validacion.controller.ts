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
