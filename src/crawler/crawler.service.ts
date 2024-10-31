import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

type AtcoderUserInfo = {
  rating: number;
  maxRating: number;
  rank: number;
  ratedMatches: number;
}

type CodeforcesUserInfo = {
  rating: number;
  maxRating: number;
}

@Injectable()
export class CrawlerService {
  async crawlAtcoder(handles: string[]): Promise<AtcoderUserInfo[]> {
    let result: AtcoderUserInfo[] = [];

    // maximum number of concurrent requests
    const maxConcurrency = 10;

    // process multiple requests concurrently
    for (let i = 0; i < handles.length; i += maxConcurrency) {
      const requests: Promise<AtcoderUserInfo>[] = [];
      
      for (let j = i; j < i + maxConcurrency && j < handles.length; j++) {
        requests.push(this.getUserInfoAtcoder(handles[j]));
      }
      
      // wait for all concurrent requests to complete
      const data = await Promise.all(requests);

      result = result.concat(data);
    }

    return result;
  }

  async getUserInfoAtcoder(handle: string): Promise<AtcoderUserInfo> {
    const response = await axios.get(`${process.env.ATCODER_BASE_URL}/users/${handle}`);

    const $ = cheerio.load(response.data);

    let rank = $("#main-container > div.row > div.col-md-9.col-sm-12 > table > tbody > tr:nth-child(1) > td").text();
    let rating = $('#main-container > div.row > div.col-md-9.col-sm-12 > table > tbody > tr:nth-child(2) > td > span').text();
    let maxRating = $('#main-container > div.row > div.col-md-9.col-sm-12 > table > tbody > tr:nth-child(3) > td > span:nth-child(2)').text();
    let ratedMatches = $("#main-container > div.row > div.col-md-9.col-sm-12 > table > tbody > tr:nth-child(4) > td").text();

    const userInfo: AtcoderUserInfo = {
      rank: Number(rank.slice(0, -2)),
      rating: Number(rating),
      maxRating: Number(maxRating),
      ratedMatches: Number(ratedMatches),
    };

    Logger.log("AtCoder", handle, userInfo);

    return userInfo;
  };

  async crawlCodeforces(handles: string[]): Promise<CodeforcesUserInfo[]> {
    let result: CodeforcesUserInfo[] = [];

    // maximum number of concurrent requests
    const maxConcurrency = 10;

    // process multiple requests concurrently
    for (let i = 0; i < handles.length; i += maxConcurrency) {
      const request = await this.getUsersInfoCodeforces(handles.slice(i, Math.min(i + maxConcurrency, handles.length)));
      
      result = result.concat(request);
    }

    return result;
  }

  async getUsersInfoCodeforces(handles: string[]): Promise<CodeforcesUserInfo[]> {
    const response = await axios.get(`${process.env.CODEFORCES_API_BASE_URL}/user.info?handles=${handles.join(';')}&checkHistoricHandles=false`);
    const data = response.data;

    if (data.status !== "OK") {
      throw new BadRequestException(data.comment);
    }

    const usersInfo: CodeforcesUserInfo[] = data.result.map(user => {
      return {
        rating: user.rating,
        maxRating: user.maxRating,
      }
    });

    Logger.log("Codeforces", handles, usersInfo);

    return usersInfo;
  }

  async getUserInfoCodeforces(handle: string): Promise<CodeforcesUserInfo> {
    return this.getUsersInfoCodeforces([handle])[0];
  }
}