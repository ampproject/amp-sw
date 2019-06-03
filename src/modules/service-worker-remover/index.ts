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

import {
  VERSIONED_CACHE_NAME,
  UNVERSIONED_CACHE_NAME,
} from '../amp-caching/constants';
import { AMP_ASSET_CACHE } from '../asset-caching/constants';
import { AMP_PUBLISHER_CACHE } from '../document-caching/constants';
import { AMP_PREFETCHED_LINKS } from '../link-prefetch/constants';

export class ServiceWorkerRemover {
  async installNoOpServiceWorker() {
    // Taking over the document
    self.addEventListener('install', function(e: ExtendableEvent) {
      const { skipWaiting } = self as ServiceWorkerGlobalScope;
      e.waitUntil(skipWaiting());
    });

    self.addEventListener('activate', async (e: ExtendableEvent) => {
      const { clients } = self as ServiceWorkerGlobalScope;
      e.waitUntil(
        Promise.all([
          this.cleanCacheStorage(),
          this.forceRefreshClients(clients),
        ]),
      );
    });
  }

  async cleanCacheStorage() {
    return Promise.all([
      caches.delete(VERSIONED_CACHE_NAME),
      caches.delete(UNVERSIONED_CACHE_NAME),
      caches.delete(AMP_ASSET_CACHE),
      caches.delete(AMP_PUBLISHER_CACHE),
      caches.delete(AMP_PREFETCHED_LINKS),
    ]);
  }

  forceRefreshClients(clients: Clients) {
    return clients.claim().then(async () => {
      // Cache current document if its AMP.
      const windowClients = await clients.matchAll({ type: 'window' });
      windowClients.forEach((client: WindowClient) =>
        client.navigate(client.url),
      );
    });
  }
}
