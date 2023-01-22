import { HttpException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import cheerio from 'cheerio';
import { type } from 'os';

@Injectable()
export class UserService {
  getUserInfoCSES = (userId: string) => {
    const promise = axios.get(`${process.env.API_CSES}/user/${userId}`);

    const userInfo = promise
      .then((response) => cheerio.load(response.data))
      .then(($) => {
        let handle = $('.title-block').text().slice(1);
        handle = handle.slice(handle.indexOf('User') + 5, handle.indexOf('\n'));

        const numberOfQuestions = $(`a[href*=/problemset/user/${userId}]`).text();

        return {
          id: userId,
          username: handle,
          numberOfQuestions: Number(numberOfQuestions),
        };
      });

    return userInfo;
  };

  async readSheet() {
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
        range: 'Unballoon!C:C',
      });

      const rows = res.data.values.slice(1);

      const promises = [];

      rows.map(async (row) => {
        const userId = row[0];

        promises.push(this.getUserInfoCSES(userId));
      });

      return await Promise.all(promises);
    } catch (err) {
      throw new HttpException('The API returned an error: ' + err, 500);
    }
  }
}
