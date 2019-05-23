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
import { enable as enableNagigationPreload } from 'workbox-navigation-preload';
import { cacheName } from './constants';
import AmpDocumentCachablePlugin from './AmpDocumentCachablePlugin';
import AmpNavigationRoute from './AmpNavigationRoute';
import { AmpDocumentNetworkFirst } from './AmpDocumentNetworkFirst';
import { AmpSwModule } from '../core/AmpSwModule';

export type DocumentCachingOptions = {
  allowList?: Array<RegExp>;
  denyList?: Array<RegExp>;
  timeoutSeconds?: Number;
  maxDocumentsInCache?: Number;
  maxAgeSecondsforDocumentsInCache?: Number;
  allowedNonAMPPages?: Array<RegExp>;
};

export class DocumentCachingModule implements AmpSwModule {
  init(
    documentCachingOptions: DocumentCachingOptions = {
      maxDocumentsInCache: 10,
      maxAgeSecondsforDocumentsInCache: 5 * 24 * 60 * 60,
      timeoutSeconds: 3,
    },
    fallbackOfflinePageUrl?: string,
  ): AmpNavigationRoute {
    enableNagigationPreload();
    const navigationPreloadOptions: {
      whitelist?: Array<RegExp>;
      blacklist?: Array<RegExp>;
    } = {};

    // create regexp Array from parsing the string array
    if (documentCachingOptions.allowList) {
      navigationPreloadOptions.whitelist = documentCachingOptions.allowList;
    } else if (documentCachingOptions.denyList) {
      navigationPreloadOptions.blacklist = documentCachingOptions.denyList;
    }

    if (
      documentCachingOptions.timeoutSeconds &&
      documentCachingOptions.timeoutSeconds > 5
    ) {
      // documentCachingOptions.timeoutSeconds more than 5s will hurt the UX as it'll keep waiting on the network.
      documentCachingOptions.timeoutSeconds = 5;
    }

    if (
      documentCachingOptions.maxDocumentsInCache &&
      documentCachingOptions.maxDocumentsInCache > 10
    ) {
      // we should not allow more than 10 documents in cache as it'll quickly eat up client's cache.
      documentCachingOptions.maxDocumentsInCache = 10;
    }

    const navRoute = new AmpNavigationRoute(
      new AmpDocumentNetworkFirst(
        {
          cacheName,
          plugins: [
            new AmpDocumentCachablePlugin({
              maxEntries: documentCachingOptions.maxDocumentsInCache || 10,
              maxAgeSeconds:
                documentCachingOptions.maxAgeSecondsforDocumentsInCache ||
                5 * 24 * 60 * 60,
              allowedNonAMPPages: documentCachingOptions.allowedNonAMPPages,
            }),
          ],
          networkTimeoutSeconds: documentCachingOptions.timeoutSeconds,
        },
        fallbackOfflinePageUrl,
      ),
      navigationPreloadOptions,
    );

    router.registerRoute(navRoute);

    return navRoute;
  }

  /**
   * Given a URL, this checks if its an AMP URL and caches it.
   */
  cacheAMPDocument(clients: ReadonlyArray<Client>) {
    return clients.map(async (client: Client) => {
      if (client && client.url) {
        try {
          const request = new Request(client.url, { mode: 'same-origin' });
          const response = await fetch(request);
          const ampCachablePlugin = new AmpDocumentCachablePlugin({
            maxEntries: 10,
          });
          const responseToBeCached = await ampCachablePlugin.cacheWillUpdate({
            response,
          });
          const cache = await caches.open(cacheName);
          if (responseToBeCached) {
            cache.put(request, responseToBeCached);
          }
        } catch (e) {
          // noop cuz we dont want to stop SW activation
        }
      }
    });
  }
}
