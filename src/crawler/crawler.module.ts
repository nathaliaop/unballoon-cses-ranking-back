import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';

@Module({
  controllers: [],
  providers: [CrawlerService],
})
export class UserModule {}