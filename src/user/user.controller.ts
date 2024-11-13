import { Controller, Get } from '@nestjs/common';
import { google } from 'googleapis';
import { UserService } from './user.service';
import dayjs from 'dayjs';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsersInfo() {
    // this.userService.updateSheet();
    return this.userService.getMemoizedUsersInfo();
  }
}
