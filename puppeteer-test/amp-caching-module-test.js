/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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


const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const {expect} = require('chai');

describe('AMP caching module', () => {
  it('should enable fast script response when the browser cache fails to respond', async () => {
    const browser = await puppeteer.launch();
    let page = await browser.newPage();
    await interceptAmpScripts(page);
    // load page for the first time
    await page.goto('https://nopwamp.netlify.com', {
      waitUntil: 'networkidle0'
    });
    // let cache expire
    await sleep(4000);
    // reload the page
    await page.reload({
      waitUntil: 'networkidle0'
    });
    const totalAmpScriptsLoadTimeWithoutSW = await page.evaluate(() => {
      return performance.getEntriesByType('resource').filter(resource => resource.initiatorType === "script").reduce((current, next) => current + next.duration, 0)
    });
    page = await browser.newPage();
    await interceptAmpScripts(page);
    // load tpage the first time
    await page.goto('https://pwamp.netlify.com', {
      waitUntil: 'networkidle0'
    });
    await page.setOfflineMode(true);
    page.removeAllListeners('request');
    await page.setRequestInterception(false);
    // let cache expire
    await sleep(4000);
    // reload the page
    await page.reload({
      waitUntil: 'networkidle0'
    });
    const totalAmpScriptsLoadTimeWithSW = await page.evaluate(() => {
      return performance.getEntriesByType('resource').filter(resource => resource.initiatorType === "script").reduce((current, next) => current + next.duration, 0)
    });
    expect(totalAmpScriptsLoadTimeWithSW).to.be.lessThan(0.3 * totalAmpScriptsLoadTimeWithoutSW);
  });
});

async function sleep(interval) {
  return new Promise(resolve => {
    setTimeout(resolve, interval);
  })
}

async function interceptAmpScripts(page) {
  await page.setRequestInterception(true);
  // intercept js requests to cdn.ampproject.org and change cache headers for only 15 seconds;
  page.on('request', async request => {
    if (/https:\/\/cdn.ampproject.org\/.*\.js/.test(request.url())) {
      const response = await fetch(request.url());
      const body = await response.text();
      await sleep(1000);
      request.respond({
          status: 200,
          contentType: 'application/javascript; charset=utf-8',
          headers: {
            'cache-control': 'private, max-age=1' // cache only for 1 seconds
          },
          body,
      });
    } else {
        request.continue();
    }
  });
}

function sleep(delay) {
  return new Promise(resolve=> {
    setInterval(resolve, delay);
  })
}
