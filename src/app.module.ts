import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [UserModule, ConfigModule.forRoot(), ScheduleModule.forRoot()],
})
export class AppModule {}
