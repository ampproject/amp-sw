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
import { join } from 'path';
import { UNVERSIONED_CACHE_NAME } from '../../../lib/modules/amp-caching/constants';
import { AMP_ASSET_CACHE } from '../../../lib/modules/asset-caching/constants';
import { AMP_PUBLISHER_CACHE } from '../../../lib/modules/document-caching/constants';
import { AMP_PREFETCHED_LINKS } from '../../../lib/modules/link-prefetch/constants';

const writeFile = promisify(fs.writeFile);
const wait = promisify(setTimeout);

describe('AMP Service worker remover', function() {
  const driver = global.__AMPSW.driver;
  const serviceWorkerPath = join('test', 'amp-caching-sw.js');
  const serviceWorkerRemoverPath = join('test', 'kill-switch-sw.js');

  before(async () => {
    const generatedSW = await buildSW({}, '/test/dist/amp-sw.js');
    const generatedSwRemover = await buildSW({}, '/test/dist/amp-sw.js', true);
    await writeFile(serviceWorkerPath, generatedSW);
    await writeFile(serviceWorkerRemoverPath, generatedSwRemover);
  });

  beforeEach(async () => {
    await driver.navigate().refresh();
    await driver.executeAsyncScript(async cb => {
      await window.__testCleanup();
      const registration = await navigator.serviceWorker.register(
        '/test/amp-caching-sw.js',
      );
      await window.__waitForSWState(registration, 'activated');
      cb();
    });
    const swRegCount = await driver.executeAsyncScript(async cb => {
      const regs = await navigator.serviceWorker.getRegistrations();
      cb(regs.length);
    });
    expect(swRegCount).to.be.equal(1);
  });

  afterEach(async () => {
    await driver.executeAsyncScript(async cb => {
      await window.__testCleanup();
      cb();
    });
  });

  it('should remove currently registered service worker', async () => {
    const installedServiceWorker = await driver.executeAsyncScript(async cb => {
      executeScript(
        async cb => cb(navigator.serviceWorker.controller.scriptURL),
        cb,
      );
    });
    expect(installedServiceWorker).to.be.equal(
      'http://localhost:6881/test/amp-caching-sw.js',
    );
    await installAndTestSwRemover(driver);
  });

  it('should clean all known caches', async () => {
    const cacheNames = {
      UNVERSIONED_CACHE_NAME,
      AMP_ASSET_CACHE,
      AMP_PREFETCHED_LINKS,
      AMP_PUBLISHER_CACHE,
    };

    const cacheKeysCount = await driver.executeAsyncScript(
      async (cacheNames, cb) => {
        executeScript(
          async (
            cb,
            {
              UNVERSIONED_CACHE_NAME,
              AMP_ASSET_CACHE,
              AMP_PREFETCHED_LINKS,
              AMP_PUBLISHER_CACHE,
            },
          ) => {
            const [
              unversionedCache,
              assetCache,
              prefetchLinkCache,
              publisherCache,
            ] = await Promise.all([
              caches.open(UNVERSIONED_CACHE_NAME),
              caches.open(AMP_ASSET_CACHE),
              caches.open(AMP_PREFETCHED_LINKS),
              caches.open(AMP_PUBLISHER_CACHE),
            ]);
            // create and put dummy entries in all four cache
            await Promise.all([
              unversionedCache.put(new Request('key'), new Response('value')),
              assetCache.put(new Request('key'), new Response('value')),
              prefetchLinkCache.put(new Request('key'), new Response('value')),
              publisherCache.put(new Request('key'), new Response('value')),
            ]);

            const cacheKeys = await caches.keys();
            cb(cacheKeys.length);
          },
          cb,
          cacheNames,
        );
      },
      cacheNames,
    );
    expect(cacheKeysCount).to.be.equal(4);
    await installAndTestSwRemover(driver);
    // wait for a second for the cleanup to happen
    await wait(1000);
    const postSwDeletionCacheKeysCount = await driver.executeAsyncScript(
      async cb => {
        executeScript(async cb => {
          const cacheKeys = await caches.keys();
          cb(cacheKeys.length);
        }, cb);
      },
    );
    expect(postSwDeletionCacheKeysCount).to.be.equal(0);
  });
});

async function installAndTestSwRemover(driver) {
  const newServiceWorker = await driver.executeAsyncScript(async cb => {
    executeScript(cb => {
      return new Promise(resolve => {
        navigator.serviceWorker.oncontrollerchange = function() {
          resolve(cb(navigator.serviceWorker.controller.scriptURL));
        };
        navigator.serviceWorker.register('/test/kill-switch-sw.js');
      });
    }, cb);
  });

  expect(newServiceWorker).to.be.equal(
    'http://localhost:6881/test/kill-switch-sw.js',
  );
}
