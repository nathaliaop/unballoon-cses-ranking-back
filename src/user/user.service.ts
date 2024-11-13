import { HttpException, Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import cheerio from 'cheerio';
import { type } from 'os';
import dayjs from 'dayjs';
import { Cron, CronExpression } from '@nestjs/schedule';

type UserData = {
  id: string;
  numberOfQuestions: number;
  username: string;
};

@Injectable()
export class UserService {
  getUserInfoCSES = (userId: string) => {
    const promise = axios.get(`${process.env.API_CSES}/user/${userId}`);

    const userInfo = promise
      .then((response) => cheerio.load(response.data))
      .then(($) => {
        let handle = $('.title-block').text().slice(1);
        handle = handle.slice(handle.indexOf('User') + 5, handle.indexOf('\n'));

        const numberOfQuestions = $(
          `a[href*=/problemset/user/${userId}]`,
        ).text();

        return {
          id: userId,
          username: handle,
          number_of_questions: Number(numberOfQuestions),
        };
      });

    return userInfo;
  };

  getUsersInfoCSESAPI = async (userIds: string[]) => {
    return await axios
      .get(`${process.env.API_SCRAPER}?user_ids=${userIds.join(',')}`)
      .then((response) => response.data);
  };

  getUserInfoCSESAPI = async (userId: string) => {
    return await axios
      .get(`${process.env.API_SCRAPER}?user_ids=${userId}`)
      .then((response) => response.data[0]);
  };

  @Cron(CronExpression.EVERY_10_MINUTES) // '*/1 * * * *'
  async updateSheet() {
    Logger.log('Running update sheet cron');

    try {
      const auth = await google.auth.getClient({
        projectId: process.env.PROJECT_ID,
        credentials: {
          client_email: process.env.CLIENT_EMAIL,
          private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
          type: process.env.TYPE,
          client_id: process.env.CLIENT_ID,
        },
        scopes: [process.env.SCOPE],
      });

      const sheets = google.sheets({
        version: 'v4',
        auth,
      });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Unballoon!C2:C',
      });

      // console.log(res.data.values);
      // console.log(res.data.values.length);

      // const rows = res.data.values.slice(1);

      // const promises = [];

      // rows.map(async (row) => {
      //   const userId = row[0];

      //   promises.push(this.getUserInfoCSES(userId));
      // });

      // return await Promise.all(promises);

      const userIds = res.data.values.map((user) => user[0]);

      const promises = [];

      userIds.forEach((userId) => {
        promises.push(this.getUserInfoCSESAPI(userId));
      });

      const usersData: UserData[] = (await Promise.all(promises))
        .map((userData) => {
          return {
            id: userData.id,
            numberOfQuestions: Number(userData.number_of_questions),
            username: userData.username,
          };
        })
        .sort((a, b) => b.numberOfQuestions - a.numberOfQuestions);

      // console.log(usersData);
      // console.log(usersData.length);

      const values = usersData.map((userData) => {
        return [userData.username, userData.id, userData.numberOfQuestions];
      });

      // console.log(values);
      // console.log(values.length);

      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Unballoon!B2:D',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            majorDimension: 'ROWS',
            values: values,
          },
        });

        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Unballoon!G1',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            majorDimension: 'ROWS',
            values: [[dayjs().toString()]],
          },
        });
      } catch (error) {
        console.error('Error updating sheet:', error);
      }

      return usersData;

      // return await this.getUsersInfoCSESAPI(userIds);
    } catch (err) {
      throw new HttpException('The API returned an error: ' + err, 500);
    }
  }

  async getMemoizedUsersInfo() {
    try {
      const auth = await google.auth.getClient({
        projectId: process.env.PROJECT_ID,
        credentials: {
          client_email: process.env.CLIENT_EMAIL,
          private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
          type: process.env.TYPE,
          client_id: process.env.CLIENT_ID,
        },
        scopes: [process.env.SCOPE],
      });

      const sheets = google.sheets({
        version: 'v4',
        auth,
      });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Unballoon!B2:D',
      });

      const userData = res.data.values.map((value) => {
        return {
          username: value[0],
          id: value[1],
          number_of_questions: value[2],
        };
      });

      const lastUpdate = (
        await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Unballoon!G1',
        })
      ).data.values[0][0];

      return {
        last_update: lastUpdate,
        data: userData,
      };
    } catch (err) {
      throw new HttpException('The API returned an error: ' + err, 500);
    }
  }
}
