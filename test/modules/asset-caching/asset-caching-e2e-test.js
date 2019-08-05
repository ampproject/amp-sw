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
import {
  testStaleWhileRevalidate,
  testCacheFirst,
  testNetworkFirst,
} from '../../strategy-tests/strategy-tests';
import { performCleanupAndWaitForSWActivation } from '../../test-utils/sw-installer';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const serviceWorkerPath = join('test', 'asset-caching-sw.js');
const cacheName = 'AMP-ASSET-CACHE';

describe('Asset caching module', function() {
  const driver = global.__AMPSW.driver;
  const regexp = /^http:\/\/localhost:6881\/test\/fixtures\//;

  after(() => {
    unlink(serviceWorkerPath);
  });

  afterEach(async () => {
    await driver.executeAsyncScript(async cb => {
      try {
        await window.__testCleanup();
        cb();
      } catch (e) {
        cb(); // NOOP
      }
    });
  });

  it('should cache specified assets with StaleWhileRevalidate when specified', async () => {
    const image = 'http://localhost:6881/test/fixtures/sample.txt';
    await generateSWAndRegister(driver, {
      assetCachingOptions: [
        {
          regexp,
          cachingStrategy: 'STALE_WHILE_REVALIDATE',
        },
      ],
    });
    return testStaleWhileRevalidate(driver, image, cacheName);
  });
  it('should cache specified assets with CacheFirst when specified', async () => {
    const image = 'http://localhost:6881/test/fixtures/sample.txt';
    await generateSWAndRegister(driver, {
      assetCachingOptions: [
        {
          regexp,
          cachingStrategy: 'CACHE_FIRST',
        },
      ],
    });
    return testCacheFirst(driver, image, cacheName);
  });
  it('should cache specified assets with CacheFirst when specified', async () => {
    const image = 'http://localhost:6881/test/fixtures/sample.txt';
    await generateSWAndRegister(driver, {
      assetCachingOptions: [
        {
          regexp,
          cachingStrategy: 'NETWORK_FIRST',
        },
      ],
    });
    return testNetworkFirst(driver, image, cacheName);
  });
});

async function generateSWAndRegister(driver, swConfig) {
  const generatedSW = await buildSW(swConfig, '/test/dist/amp-sw.js');
  await writeFile(serviceWorkerPath, generatedSW);
  await driver.get('http://localhost:6881/test/index.html');
  await performCleanupAndWaitForSWActivation(driver, `/${serviceWorkerPath}`);
}
