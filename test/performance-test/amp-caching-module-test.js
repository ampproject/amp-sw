/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * you may not use this file except in compliance with the License.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
import * as fs from 'fs';
import test from 'ava';
import { buildSW } from '../builder/index';
import { join } from 'path';
import { createServer, startServer } from '../server';
import { promisify } from 'util';

const server = createServer();
const serviceWorkerPath = join('test', 'amp-caching-sw.js');
const writeFile = promisify(fs.writeFile);

async function sleep(interval) {
  return new Promise(resolve => {
    setTimeout(resolve, interval);
  });
}

async function interceptAmpScripts(page) {
  await page.setRequestInterception(true);
  // intercept js requests to cdn.ampproject.org and change cache headers for only 15 seconds;
  page.on('request', async request => {
    if (/https:\/\/cdn.ampproject.org\/.*\.js/.test(request.url())) {
      const response = await fetch(request.url());
      const body = await response.text();
      // artificial sleep to mock slow networks.
      await sleep(1000);
      request.respond({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        headers: {
          'cache-control': 'private, max-age=1', // cache only for 1 seconds
        },
        body,
      });
    } else {
      request.continue();
    }
  });
}

test.before(async () => {
  startServer(server, 6881);
  const generatedSW = await buildSW({}, '/test/dist/amp-sw.js');
  await writeFile(serviceWorkerPath, generatedSW);
});

test.after(() => {
  server.close();
});

test('should enable fast script response when the browser cache fails to respond', async t => {
  let browser = await puppeteer.launch();
  let page = await browser.newPage();
  await interceptAmpScripts(page);
  // load page for the first time
  await page.goto('http://localhost:6881/test/accordian.amp.html', {
    waitUntil: 'networkidle0',
  });
  // let cache expire
  await sleep(4000);
  // reload the page
  await page.reload({
    waitUntil: 'networkidle0',
  });
  const totalAmpScriptsLoadTimeWithoutSW = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .filter(resource => resource.initiatorType === 'script')
      .reduce((current, next) => current + next.duration, 0);
  });
  browser.close();
  browser = await puppeteer.launch();
  page = await browser.newPage();
  await interceptAmpScripts(page);
  // load tpage the first time
  await page.goto('http://localhost:6881/test/accordian.amp.html', {
    waitUntil: 'networkidle0',
  });
  await page.setOfflineMode(true);
  await page.evaluate(() =>
    navigator.serviceWorker.register('/test/amp-caching-sw.js'),
  );
  // let cache expire
  await sleep(4000);
  // reload the page
  await page.reload({
    waitUntil: 'networkidle0',
  });
  const totalAmpScriptsLoadTimeWithSW = await page.evaluate(() => {
    return performance
      .getEntriesByType('resource')
      .filter(resource => resource.initiatorType === 'script')
      .reduce((current, next) => current + next.duration, 0);
  });
  t.assert(
    totalAmpScriptsLoadTimeWithSW < 0.3 * totalAmpScriptsLoadTimeWithoutSW,
  );
});
