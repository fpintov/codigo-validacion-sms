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
