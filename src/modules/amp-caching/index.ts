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

// @ts-ignore
import router from 'workbox-routing';
// @ts-ignore
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
// @ts-ignore
import { Plugin } from 'workbox-cache-expiration';
import { FluxStandardAction } from '../flux-standard-actions';
import { AmpSwModule } from '../core/AmpSwModule';
import { UNVERSIONED_CACHE_NAME, VERSIONED_CACHE_NAME } from './constants';

const VERSIONED_ASSETS_RE = /^https:\/\/cdn.ampproject.org\/rtv\/\d*\//;
const UNVERSIONED_RUNTIME_RE = /^https:\/\/cdn.ampproject.org\/\w*(-\w*)?.js/;
const UNVERSIONED_EXTENSIONS_RE = /^https:\/\/cdn.ampproject.org\/v0\//;

async function cachePreRequestedScripts(scripts: Array<string>) {
  const unversionedScripts: Array<Request> = [];
  const versionedScripts: Array<Request> = [];
  scripts.forEach(script => {
    if (
      UNVERSIONED_EXTENSIONS_RE.test(script) ||
      UNVERSIONED_RUNTIME_RE.test(script)
    ) {
      unversionedScripts.push(new Request(script));
    } else if (VERSIONED_ASSETS_RE.test(script)) {
      versionedScripts.push(new Request(script));
    }
  });
  const unversionedCache = await caches.open(UNVERSIONED_CACHE_NAME);
  await unversionedCache.addAll(unversionedScripts);
  const versionedCache = await caches.open(VERSIONED_CACHE_NAME);
  await versionedCache.addAll(versionedScripts);
}

export class AmpCachingModule implements AmpSwModule {
  init() {
    this.ampAssetsCaching();
    this.listenForFetchedScripts();
  }

  ampAssetsCaching() {
    // Versioned Assets
    router.registerRoute(
      VERSIONED_ASSETS_RE,
      new CacheFirst({
        cacheName: VERSIONED_CACHE_NAME,
        plugins: [
          new Plugin({
            maxAgeSeconds: 14 * 24 * 60 * 60, // 14 days
          }),
        ],
      }),
    );

    // Unversioned runtimes
    router.registerRoute(
      UNVERSIONED_RUNTIME_RE,
      new StaleWhileRevalidate({
        cacheName: UNVERSIONED_CACHE_NAME,
        plugins: [
          new Plugin({
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    );

    // Unversioned Extensions
    router.registerRoute(
      UNVERSIONED_EXTENSIONS_RE,
      new StaleWhileRevalidate({
        cacheName: UNVERSIONED_CACHE_NAME,
        plugins: [
          new Plugin({
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
      }),
    );
  }

  listenForFetchedScripts(): void {
    self.addEventListener('message', (messageEvent: ExtendableMessageEvent) => {
      const data: FluxStandardAction<[string]> = JSON.parse(messageEvent.data);
      if (data.type === 'AMP__FIRST-VISIT-CACHING' && data.payload) {
        messageEvent.waitUntil(cachePreRequestedScripts(data.payload));
      }
    });
  }
}
