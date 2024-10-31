import { Controller, Get } from '@nestjs/common';
import { google } from 'googleapis';
import { UserService } from './user.service';
import { CrawlerService } from 'src/crawler/crawler.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService, private crawlerService: CrawlerService) {}

  @Get()
  getUsersInfo() {
    // this.crawlerService.getUserInfoAtcoder("Tilnoene");
    // this.crawlerService.getUserInfoAtcoder("Maxwell01");

    // console.log(this.crawlerService.crawlAtcoder(["Tilnoene", "liaoli", "Maxwell01"]));
    
    // console.log(this.crawlerService.crawlCodeforces(["Tilnoene", "liaoli", "Maxwell01"]));
    // console.log(this.crawlerService.getUserInfoCodeforces("tilnoene"));

    return {}
    //return this.userService.readSheet();
  }
}
