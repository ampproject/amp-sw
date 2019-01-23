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

export async function testStaleWhileRevalidate(driver, scriptURL, cacheName) {
  const DUMMY_RESPONSE = 'dummy response';
  const networkResponse = await driver.executeAsyncScript(
    async (scriptURL, cb) => {
      const response = await fetch(scriptURL);
      const text = await response.text();
      cb(text);
    },
    scriptURL,
  );
  // 1st response should be actual response from network
  expect(networkResponse).to.not.be.equal(DUMMY_RESPONSE);
  const cacheResponse = await driver.executeAsyncScript(
    async (cacheName, scriptURL, DUMMY_RESPONSE, cb) => {
      const cache = await caches.open(cacheName);
      await cache.put(new Request(scriptURL), new Response(DUMMY_RESPONSE));
      const response = await fetch(scriptURL);
      const text = await response.text();
      cb(text);
    },
    cacheName,
    scriptURL,
    DUMMY_RESPONSE,
  );
  // 2nd response should be the dummy response
  expect(cacheResponse).to.be.equal(DUMMY_RESPONSE);
  const storedCacheResponse = await driver.executeAsyncScript(
    async (cacheName, scriptURL, cb) => {
      const cache = await caches.open(cacheName);
      const response = await cache.match(scriptURL);
      const text = await response.text();
      cb(text);
    },
    cacheName,
    scriptURL,
  );
  // 3rd response will again be equal to network response because `stale-while-revalidate`
  expect(storedCacheResponse).to.not.be.equal(DUMMY_RESPONSE);
  expect(storedCacheResponse).to.be.equal(networkResponse);
}

export async function testCacheFirst(driver, scriptURL, cacheName) {
  const DUMMY_RESPONSE = 'dummy response';
  const networkResponse = await driver.executeAsyncScript(
    async (scriptURL, cb) => {
      const response = await fetch(scriptURL);
      const text = await response.text();
      cb(text);
    },
    scriptURL,
  );
  // 1st response should be actual response from network
  expect(networkResponse).to.not.be.equal(DUMMY_RESPONSE);
  const cacheResponse = await driver.executeAsyncScript(
    async (cacheName, scriptURL, DUMMY_RESPONSE, cb) => {
      const cache = await caches.open(cacheName);
      await cache.put(new Request(scriptURL), new Response(DUMMY_RESPONSE));
      const response = await fetch(scriptURL);
      const text = await response.text();
      cb(text);
    },
    cacheName,
    scriptURL,
    DUMMY_RESPONSE,
  );
  // 2nd response should be the dummy response
  expect(cacheResponse).to.be.equal(DUMMY_RESPONSE);
}

export async function testNetworkFirst(driver, scriptURL, cacheName) {
  const DUMMY_RESPONSE = 'dummy response';
  const networkResponse = await driver.executeAsyncScript(
    async (scriptURL, cb) => {
      const response = await fetch(scriptURL);
      const text = await response.text();
      cb(text);
    },
    scriptURL,
  );
  // 1st response should be actual response from network
  expect(networkResponse).to.not.be.equal(DUMMY_RESPONSE);
  const cacheResponse = await driver.executeAsyncScript(
    async (cacheName, scriptURL, DUMMY_RESPONSE, cb) => {
      const cache = await caches.open(cacheName);
      await cache.put(new Request(scriptURL), new Response(DUMMY_RESPONSE));
      const response = await fetch(scriptURL);
      const text = await response.text();
      cb(text);
    },
    cacheName,
    scriptURL,
    DUMMY_RESPONSE,
  );
  // 2nd response should be the dummy response
  expect(cacheResponse).to.not.be.equal(DUMMY_RESPONSE);
}
