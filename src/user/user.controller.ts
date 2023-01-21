import { Controller, Get } from '@nestjs/common';
import { google } from 'googleapis';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsersInfo() {
    return this.userService.readSheet();
  }
}
