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

const fs = require('fs');
const { buildSW } = require('../../../lib/builder/index');
const { promisify } = require('util');
const { join } = require('path');

const writeFile = promisify(fs.writeFile);

describe('Offline page module', function() {
  const driver = global.__AMPSW.driver;
  const serviceWorkerPath = join('test', 'offline-page-sw.js');

  before(async () => {
    const generatedSW = await buildSW(
      {
        offlinePageOptions: {
          url: 'http://localhost:6881/test/offline.html',
        },
      },
      '/test/dist/amp-sw.js',
    );
    await writeFile(serviceWorkerPath, generatedSW);
  });

  beforeEach(async () => {
    await driver.navigate().refresh();
    await driver.executeAsyncScript(async cb => {
      await window.__testCleanup();
      const registration = await navigator.serviceWorker.register(
        '/test/offline-page-sw.js',
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

  afterEach(async () => {
    await unregisterSW(driver);
  });

  it('should install offline page in AMP document cache', async () => {
    const result = await driver.executeAsyncScript(async cb => {
      executeScript(async cb => {
        const cache = await window.caches.open('AMP-PUBLISHER-CACHE');
        cb((await cache.keys())[0]);
      }, cb);
    });
    expect(result.url).to.be.equal('http://localhost:6881/test/offline.html');
  });

  it('should install offline page assets in AMP assets cache', async () => {
    const result = await driver.executeAsyncScript(async cb => {
      executeScript(async cb => {
        const cache = await window.caches.open('AMP-ASSET-CACHE');
        cb((await cache.keys())[0]);
      }, cb);
    });
    expect(result.url).to.be.equal(
      'http://localhost:6881/test/fixtures/bar.jpg',
    );
  });
});

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
