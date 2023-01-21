import { HttpException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import cheerio from 'cheerio';

@Injectable()
export class UserService {
  getUserInfoCSES = (userId: string) => {
    const promise = axios.get(`${process.env.API_CSES}/user/${userId}`);

    const userInfo = promise
      .then((response) => cheerio.load(response.data))
      .then(($) => {
        let handle = $('.title-block').text().slice(1);
        handle = handle.slice(handle.indexOf('User') + 5, handle.indexOf('\n'));

        const numberOfQuestions = $(`a[href*=${userId}]`).text();

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
      const sheets = google.sheets({
        version: 'v4',
        auth: await google.auth.getClient({ scopes: [process.env.SCOPE] }),
      });

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Unballoon!C:C',
      });

      console.log(res.data.values);

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
