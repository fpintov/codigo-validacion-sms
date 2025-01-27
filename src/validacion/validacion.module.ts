import { Module } from '@nestjs/common';
import { ValidacionService } from './validacion.service';
import { ValidacionController } from './validacion.controller';


@Module({
  controllers: [ValidacionController],
  providers: [ValidacionService],
})
export class ValidacionModule {}
