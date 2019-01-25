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

import { buildSW } from '../../../lib/builder/index';
import { promisify } from 'util';
import * as fs from 'fs';
import { join, resolve } from 'path';
import { performCleanupAndWaitForSWActivation } from '../../test-utils/sw-installer';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

describe('Link prefetch module', function() {
  const driver = global.__AMPSW.driver;
  const serviceWorkerPath = join('test', 'link-prefetch-sw.js');

  before(async () => {
    const generatedSW = await buildSW(
      {
        linkPrefetchOptions: {},
      },
      '/test/dist/amp-sw.js',
    );
    await writeFile(serviceWorkerPath, generatedSW);
  });

  beforeEach(async () => {
    await registerSW(driver);
  });

  after(async () => {
    await unlink(serviceWorkerPath);
  });

  afterEach(async () => {
    await unregisterSW(driver);
  });

  it('should listen to the postMessage and put the qualifying URLs in cache', async () => {
    const results = await driver.executeAsyncScript(async cb => {
      executeScript(async () => {
        const cacheName = window.__cacheName;
        navigator.serviceWorker.controller.postMessage(
          JSON.stringify({
            type: 'AMP__LINK-PREFETCH',
            payload: [
              'http://localhost:6881/test/accordian.amp.html',
              '/test/alternate.amp.html',
              'https://cdn.ampproject.org/rtv/011810152207300/v0.js',
            ],
          }),
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        const cache = await caches.open(cacheName);
        cb((await cache.keys()).map(request => request.url));
      }, cb);
    });
    expect(results).to.deep.equal([
      'http://localhost:6881/test/accordian.amp.html',
      'http://localhost:6881/test/alternate.amp.html',
    ]);
  });

  it('should respond with CacheFirst for the prefetched request', async () => {
    await addDummyResponseToCache(driver);
    const response = await driver.executeAsyncScript(async cb => {
      executeScript(async cb => {
        const url = '/test/alternate.amp.html';
        const fetchedResponse = await fetch(url);
        cb(await fetchedResponse.text());
      }, cb);
    });
    // Expecting the dummy response added above.
    expect(response).to.be.equal('hello world');
  });

  it('should respond for the prefetched request only for 1 request', async () => {
    await addDummyResponseToCache(driver);
    const response = await driver.executeAsyncScript(async cb => {
      executeScript(async cb => {
        const url = '/test/alternate.amp.html';
        // first request
        await fetch(url);
        // second request
        const fetchedResponse = await fetch(url);
        cb(await fetchedResponse.text());
      }, cb);
    });
    // Expecting the dummy response added above.
    expect(response).to.not.be.equal('hello world');
  });

  it('should respond for the prefetched request only within configured time', async () => {
    await addDummyResponseToCache(driver);
    const response = await driver.executeAsyncScript(async cb => {
      executeScript(async cb => {
        const url = '/test/alternate.amp.html';
        const cache = await caches.open(cacheName);
        const timeDelta = 6 * 60 * 1000;
        // Adding a dummy response.
        await cache.put(
          new Request(url),
          new Response('hello world', {
            headers: {
              date: new Date(Date.now() - timeDelta),
            },
          }),
        );
        const fetchedResponse = await fetch(url);
        cb(await fetchedResponse.text());
      }, cb);
    });
    // Expecting the dummy response added above.
    expect(response).to.not.be.equal('hello world');
  });
});

async function registerSW(driver) {
  await performCleanupAndWaitForSWActivation(
    driver,
    '/test/link-prefetch-sw.js',
  );
  await driver.executeAsyncScript(async cb => {
    window.__cacheName = 'AMP-PREFETCHED-LINKS';
    cb();
  });
}

async function unregisterSW(driver) {
  await driver.get('http://localhost:6881/test/index.html');
  await driver.executeAsyncScript(async cb => {
    try {
      await window.__testCleanup();
      window.__cacheName = null;
      cb();
    } catch (e) {
      cb(); // NOOP
    }
  });
}

async function addDummyResponseToCache(driver) {
  return await driver.executeAsyncScript(async (url, cb) => {
    executeScript(
      async cb => {
        const cacheName = window.__cacheName;
        const url = '/test/alternate.amp.html';
        // This'll add an entry to denyList of navigation preload.
        navigator.serviceWorker.controller.postMessage(
          JSON.stringify({
            type: 'AMP__LINK-PREFETCH',
            payload: [url],
          }),
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        const cache = await caches.open(cacheName);
        // Adding a dummy response.
        await cache.put(new Request(url), new Response('hello world'));
        cb(url);
      },
      url,
      cb,
    );
  });
}
