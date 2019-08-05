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

import { buildSW } from '../../builder/index';
import { promisify } from 'util';
import * as fs from 'fs';
import { join } from 'path';
import { performCleanupAndWaitForSWActivation } from '../../test-utils/sw-installer';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const cacheName = 'AMP-PUBLISHER-CACHE';

describe('Document caching module', function() {
  const driver = global.__AMPSW.driver;
  const serviceWorkerPath = join('test', 'document-caching-sw.js');

  after(async () => {
    await unlink(serviceWorkerPath);
  });

  afterEach(async () => {
    await driver.get('http://localhost:6881/test/index.html');
    await driver.executeAsyncScript(async cb => {
      try {
        await window.__testCleanup();
        cb();
      } catch (e) {
        cb(); // NOOP
      }
    });
  });

  it('should respect allowList config', async () => {
    const generatedSW = await buildSW(
      {
        documentCachingOptions: {
          allowList: [/alternate.amp.html/],
        },
      },
      '/test/dist/amp-sw.js',
    );
    await writeFile(serviceWorkerPath, generatedSW);
    await driver.get('http://localhost:6881/test/index.html');
    await performCleanupAndWaitForSWActivation(driver, `/${serviceWorkerPath}`);
    await driver.get('http://localhost:6881/test/alternate.amp.html');
    await driver.get('http://localhost:6881/test/accordian.amp.html');
    let cachedData = await driver.executeAsyncScript(async (cacheName, cb) => {
      const cache = await caches.open(cacheName);
      cb(
        await cache.match(
          new Request('http://localhost:6881/test/alternate.amp.html'),
        ),
      );
    }, cacheName);
    expect(cachedData).to.not.be.null;
    cachedData = await driver.executeAsyncScript(async (cacheName, cb) => {
      const cache = await caches.open(cacheName);
      cb(
        await cache.match(
          new Request('http://localhost:6881/test/accordian.amp.html'),
        ),
      );
    }, cacheName);
    expect(cachedData).to.be.null;
  });
  it('should respect denyList config', async () => {
    const generatedSW = await buildSW(
      {
        documentCachingOptions: {
          denyList: [/alternate.amp.html/],
        },
      },
      '/test/dist/amp-sw.js',
    );
    await writeFile(serviceWorkerPath, generatedSW);
    await driver.get('http://localhost:6881/test/index.html');
    await performCleanupAndWaitForSWActivation(driver, `/${serviceWorkerPath}`);
    await driver.get('http://localhost:6881/test/alternate.amp.html');
    await driver.get('http://localhost:6881/test/accordian.amp.html');
    let cachedData = await driver.executeAsyncScript(async (cacheName, cb) => {
      const cache = await caches.open(cacheName);
      cb(
        await cache.match(
          new Request('http://localhost:6881/test/alternate.amp.html'),
        ),
      );
    }, cacheName);
    expect(cachedData).to.be.null;
    cachedData = await driver.executeAsyncScript(async (cacheName, cb) => {
      const cache = await caches.open(cacheName);
      cb(
        await cache.match(
          new Request('http://localhost:6881/test/accordian.amp.html'),
        ),
      );
    }, cacheName);
    expect(cachedData).to.not.be.null;
  });
  it('should not cache non AMP pages', async () => {
    const generatedSW = await buildSW({}, '/test/dist/amp-sw.js');
    await writeFile(serviceWorkerPath, generatedSW);
    await driver.get('http://localhost:6881/test/index.html');
    await performCleanupAndWaitForSWActivation(driver, `/${serviceWorkerPath}`);
    await driver.get('http://localhost:6881/test/alternate.amp.html');
    // doing round trip because the service worker is lazy
    await driver.get('http://localhost:6881/test/index.html');
    let cachedData = await driver.executeAsyncScript(async (cacheName, cb) => {
      const cache = await caches.open(cacheName);
      cb(
        await cache.match(
          new Request('http://localhost:6881/test/alternate.amp.html'),
        ),
      );
    }, cacheName);
    expect(cachedData).to.not.be.null;
    cachedData = await driver.executeAsyncScript(async (cacheName, cb) => {
      const cache = await caches.open(cacheName);
      cb(
        await cache.match(new Request('http://localhost:6881/test/index.html')),
      );
    }, cacheName);
    expect(cachedData).to.be.null;
  });
  it('should respond from cache if server does not respond', async () => {
    this.timeout(8000);
    const generatedSW = await buildSW({}, '/test/dist/amp-sw.js');
    await writeFile(serviceWorkerPath, generatedSW);
    await driver.get('http://localhost:6881/test/index.html');
    await performCleanupAndWaitForSWActivation(driver, `/${serviceWorkerPath}`);
    await driver.get('http://localhost:6881/test/alternate.amp.html');
    await driver.get('http://localhost:6881/test/index.html');
    global.__AMPSW.server.stop();
    await driver.get('http://localhost:6881/test/alternate.amp.html');
    const element = await driver.executeAsyncScript(async cb => {
      cb(document.querySelector('amp-img'));
    });
    expect(element).to.not.be.null;
    await global.__AMPSW.server.start();
  });
  // TODO: figure out how to test navigation preloading

  describe('cacheAMPDocument', function() {
    it('should not cache the current page URL if its not AMP page', async () => {
      const generatedSW = await buildSW({}, '/test/dist/amp-sw.js');
      await writeFile(serviceWorkerPath, generatedSW);
      await driver.get('http://localhost:6881/test/index.html');
      await performCleanupAndWaitForSWActivation(
        driver,
        `/${serviceWorkerPath}`,
      );
      let cachedData = await driver.executeAsyncScript(
        async (cacheName, cb) => {
          const cache = await caches.open(cacheName);
          cb(
            await cache.match(
              new Request('http://localhost:6881/test/index.html'),
            ),
          );
        },
        cacheName,
      );
      expect(cachedData).to.be.null;
    });

    it('should cache the current page URL if its AMP page', async () => {
      const generatedSW = await buildSW({}, '/test/dist/amp-sw.js');
      await writeFile(serviceWorkerPath, generatedSW);
      await driver.get('http://localhost:6881/test/alternate.amp.html');
      await driver.executeAsyncScript(cb => {
        // install util scripts
        const cleanupScript = document.createElement('script');
        cleanupScript.src = '/test/test-utils/sw-test-cleanup.js';
        document.body.appendChild(cleanupScript);
        const waitScript = document.createElement('script');
        waitScript.src = '/test/test-utils/wait-for-sw-state.js';
        document.body.appendChild(waitScript);
        cb();
      });
      await performCleanupAndWaitForSWActivation(
        driver,
        `/${serviceWorkerPath}`,
        false,
      );
      let cachedData = await driver.executeAsyncScript(
        async (cacheName, cb) => {
          const cache = await caches.open(cacheName);
          cb(
            await cache.match(
              new Request('http://localhost:6881/test/alternate.amp.html'),
            ),
          );
        },
        cacheName,
      );
      expect(cachedData).to.not.be.null;
    });

    it('should allow non AMP pages via config', async () => {
      const generatedSW = await buildSW(
        {
          documentCachingOptions: {
            allowedNonAMPPages: [/index.html/],
          },
        },
        '/test/dist/amp-sw.js',
      );
      await writeFile(serviceWorkerPath, generatedSW);
      await driver.get('http://localhost:6881/test/alternate.amp.html');
      await driver.executeAsyncScript(cb => {
        // install util scripts
        const cleanupScript = document.createElement('script');
        cleanupScript.src = '/test/test-utils/sw-test-cleanup.js';
        document.body.appendChild(cleanupScript);
        const waitScript = document.createElement('script');
        waitScript.src = '/test/test-utils/wait-for-sw-state.js';
        document.body.appendChild(waitScript);
        cb();
      });
      await performCleanupAndWaitForSWActivation(
        driver,
        `/${serviceWorkerPath}`,
        false,
      );
      await driver.get('http://localhost:6881/test/index.html');
      let cachedData = await driver.executeAsyncScript(
        async (cacheName, cb) => {
          const cache = await caches.open(cacheName);
          cb(
            await cache.match(
              new Request('http://localhost:6881/test/index.html'),
            ),
          );
        },
        cacheName,
      );
      expect(cachedData).to.not.be.null;
    });
  });
});
