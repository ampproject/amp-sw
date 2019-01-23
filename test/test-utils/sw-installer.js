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

export async function performCleanupAndWaitForSWActivation(
  driver,
  swFile,
  performRefresh = true,
) {
  performRefresh && (await driver.navigate().refresh());
  await driver.executeAsyncScript(async (swFile, cb) => {
    await window.__testCleanup();
    const registration = await navigator.serviceWorker.register(swFile);
    await window.__waitForSWState(registration, 'activated');
    cb();
  }, swFile);
  const swRegCount = await driver.executeAsyncScript(async cb => {
    const regs = await navigator.serviceWorker.getRegistrations();
    cb(regs.length);
  });
  expect(swRegCount).to.be.equal(1);
}
