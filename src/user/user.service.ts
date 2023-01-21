import { HttpException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class UserService {
  async readSheet() {
    // try {

    const sheets = google.sheets({
      version: 'v4',
      auth: await google.auth.getClient({ scopes: [process.env.SCOPE] }),
    });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Unballoon!A:C',
    });

    // const [handle_cses, handle_codeforces, id] = res.data.values;

    return res.data.values;

    // const fields = res.data.values[0];

    // res.data.values.splice(0, 1);

    // const rows = res.data.values;

    //   if (rows.length) {
    //     const result = [];

    //     rows.map((row) => {
    //       const data = {};

    //       fields.map((field, index) => {
    //         data[field] = row[index];
    //       });

    //       result.push(data);
    //     });

    //     return result;
    //   } else {
    //     throw new HttpException('No data found.', 404);
    //   }
    // } catch (err) {
    //   throw new HttpException('The API returned an error: ' + err, 500);
    // }
  }
}
