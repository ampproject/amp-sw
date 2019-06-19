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

import seleniumAssistant from 'selenium-assistant';
import Mocha from 'mocha';
import { expect } from 'chai';
import { argv } from 'yargs';
import { promisify } from 'util';
import { join } from 'path';
import glob from 'glob-fs';
import * as fs from 'fs';
import { createServer, startServer } from './server';
const fetch = require('node-fetch');

const isLocalExecution = !!argv['local'];
const globfinder = glob();
const writeFile = promisify(fs.writeFile);

const server = createServer();

(async () => {
  const expiration = 24;
  if (!isLocalExecution) {
    console.log('downloading browsers...');
    await seleniumAssistant.downloadLocalBrowser(
      'chrome',
      'stable',
      expiration,
    );
  }

  global.__AMPSW = {
    server: {
      stop: () => {
        server.close();
      },
      start: () => startServer(server, 6881),
    },
  };

  await Promise.all([downloadLatestAmpMeta(), global.__AMPSW.server.start()]);

  const browsers = seleniumAssistant.getLocalBrowsers();
  browsers.forEach(async browser => {
    // Skip if the browser isn't stable.
    if (browser.getReleaseName() !== 'stable') {
      return;
    }
    // Print out the browsers name.
    if (browser.getPrettyName() !== 'Google Chrome Stable') {
      return;
    }

    console.log(`testing on ${browser.getPrettyName()}`);
    const driver = await browser.getSeleniumDriver();
    await driver.get('http://localhost:6881/test/index.html');
    runMochaForBrowser(driver);
  });
})();

async function downloadLatestAmpMeta() {
  const METADATA_URL = 'https://cdn.ampproject.org/rtv/metadata';
  const ampRuntimeMeta = await (await fetch(METADATA_URL)).json();
  await writeFile(
    join(__dirname, 'amp_metadata.json'),
    JSON.stringify(ampRuntimeMeta),
  );
}

function runMochaForBrowser(driver) {
  global.__AMPSW.driver = driver;
  global.expect = expect;
  const mocha = new Mocha();
  const testFiles = globfinder.readdirSync(
    argv['files'] || 'test/**/*-test.js',
  );
  testFiles.forEach(testFile => {
    // performance tests are not run in browser with mocha
    if (testFile.startsWith('test/performance-test/')) {
      return;
    }
    console.log(`Testing ${testFile}`);
    mocha.addFile(testFile);
  });
  // Run the tests.
  mocha
    .timeout(7000)
    .run(function(failures) {
      process.exitCode = failures ? -1 : 0; // exit with non-zero status if there were failures
    })
    .on('end', function() {
      seleniumAssistant.killWebDriver(driver);
      global.__AMPSW.server.stop();
    });
}
