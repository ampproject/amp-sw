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
import { AmpCachingModule } from '../amp-caching/index';
import { DocumentCachingModule } from '../document-caching/index';
import { ServiceWorkerConfiguration } from '../../configuration';
import { AssetCachingOptions } from '../asset-caching';
import { LinkPrefetchOptions } from '../link-prefetch';
import { OfflinePageOptions } from '../offline-page';
declare global {
  interface WorkerGlobalScope {
    AMP_SW: {
      init: Function;
    };
  }
}

const ampCachingModule = new AmpCachingModule();
const documentCachingModule = new DocumentCachingModule();

function init(config: ServiceWorkerConfiguration = {}) {
  ampCachingModule.init();
  let fallbackOfflinePageUrl;
  if (config.offlinePageOptions) {
    fallbackOfflinePageUrl = config.offlinePageOptions.url;
  }
  const navRoute = documentCachingModule.init(
    config.documentCachingOptions,
    fallbackOfflinePageUrl,
  );
  if (config.assetCachingOptions) {
    import(/* webpackChunkName: "optional-modules" */ '../asset-caching/index').then(
      async ({ AssetCachingAmpModule }) => {
        const assetCachingModule = new AssetCachingAmpModule();
        await assetCachingModule.init(
          config.assetCachingOptions as AssetCachingOptions,
        );
      },
    );
  }

  if (config.linkPrefetchOptions) {
    import(/* webpackChunkName: "optional-modules" */ '../link-prefetch/index').then(
      async ({ LinkPrefetchAmpModule }) => {
        const linkPrefetchModule = new LinkPrefetchAmpModule();
        await linkPrefetchModule.init(
          config.linkPrefetchOptions as LinkPrefetchOptions,
          navRoute,
        );
      },
    );
  }

  if (config.offlinePageOptions) {
    import(/* webpackChunkName: "optional-modules" */ '../offline-page/index').then(
      async ({ OfflinePageAmpSwModule }) => {
        const offlinePageModule = new OfflinePageAmpSwModule();
        const offlinePageConfig: OfflinePageOptions = config.offlinePageOptions as OfflinePageOptions;
        await offlinePageModule.init(
          offlinePageConfig.url,
          offlinePageConfig.assets,
        );
      },
    );
  }

  // Taking over the document
  self.addEventListener('install', function(e: ExtendableEvent) {
    const { skipWaiting } = self as ServiceWorkerGlobalScope;
    e.waitUntil(skipWaiting());
  });

  self.addEventListener('activate', async (e: ExtendableEvent) => {
    const { clients } = self as ServiceWorkerGlobalScope;
    e.waitUntil(
      clients.claim().then(async () => {
        // Cache current document if its AMP.
        const windowClients = await clients.matchAll({ type: 'window' });
        return Promise.all(
          documentCachingModule.cacheAMPDocument(windowClients),
        );
      }),
    );
  });
}

// Initialize AMP_SW namespace
self['AMP_SW'] = {
  init,
};
