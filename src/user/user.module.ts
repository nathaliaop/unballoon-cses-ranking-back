import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CrawlerService } from 'src/crawler/crawler.service';

@Module({
  controllers: [UserController],
  providers: [UserService, CrawlerService],
})
export class UserModule {}
