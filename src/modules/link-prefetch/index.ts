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
import router, { NavigationRoute } from 'workbox-routing';
// @ts-ignore
import { CacheFirst } from 'workbox-strategies';
import { FluxStandardAction } from '../flux-standard-actions';
import AmpNavigationRoute from '../document-caching/AmpNavigationRoute';
import { AmpPrefetchPlugin } from './AmpPrefetchPlugin';
import { AmpSwModule } from '../core/AmpSwModule';
import { AMP_PREFETCHED_LINKS } from './constants';

export type LinkPrefetchOptions = {
  maxAgeSecondsInCache: Number;
};

let navigationRoute_: AmpNavigationRoute;
let linkPrefetchOptions_: LinkPrefetchOptions | undefined;

function convertUrlToRegExp(link: string): RegExp {
  const regExp = new RegExp(
    link
      .replace(/\//g, '\\/')
      .replace(/\?/g, '\\?')
      .replace(/\+/g, '\\+'),
  );
  return regExp;
}

// We dont cache any links from outside the same origin so its safe to clean the host info.
function cleanHostInfoFromUrl(url: string): string {
  // remove host as the URLs are to same domain.
  return url.replace(/https?:\/\//, '').replace(self.location.host, '');
}

export class LinkPrefetchAmpModule implements AmpSwModule {
  async init(
    linkPrefetchOptions: LinkPrefetchOptions,
    navigationRoute: AmpNavigationRoute,
  ) {
    this.listenForLinkPrefetches();
    await this.registerPrefetchLinks(navigationRoute, linkPrefetchOptions);
  }

  /**
   * Listens for post messaged links to be prefetch, in case
   * the browser doesnt support <link rel=prefetch.
   */
  listenForLinkPrefetches() {
    self.addEventListener('message', (messageEvent: ExtendableMessageEvent) => {
      const data: FluxStandardAction<[string]> = JSON.parse(messageEvent.data);
      if (data.type === 'AMP__LINK-PREFETCH' && data.payload) {
        messageEvent.waitUntil(this.cachePrefetchLinks_(data.payload));
      }
    });
  }

  /**
   * Registers already pre-fetched links to navigation-preload denyList.
   */
  async registerPrefetchLinks(
    navigationRoute: AmpNavigationRoute,
    linkPrefetchOptions?: LinkPrefetchOptions,
  ) {
    linkPrefetchOptions_ = linkPrefetchOptions;
    navigationRoute_ = navigationRoute;
    // Read all prefetched links and add it to deny list.
    const cache = await caches.open(AMP_PREFETCHED_LINKS);
    const linksRegExps: Array<RegExp> = [];
    (await cache.keys()).forEach(request => {
      let url = request.url;
      linksRegExps.push(convertUrlToRegExp(cleanHostInfoFromUrl(url)));
    });

    this.addRouteHandler_(linksRegExps);
  }

  /**
   * Adds a route handler to fetch from cache-first
   * @private
   */
  addRouteHandler_(linksRegExps: Array<RegExp>) {
    let maxAgeSecondsInCache = linkPrefetchOptions_
      ? linkPrefetchOptions_.maxAgeSecondsInCache
      : 300;
    // We have a hard upper limit to how long will the prefetcfhed documents live in the memory.
    if (maxAgeSecondsInCache > 300) {
      maxAgeSecondsInCache = 300;
    }

    linksRegExps.forEach(link => {
      navigationRoute_.addDeniedUrls(link);
      router.registerRoute(
        link,
        new CacheFirst({
          AMP_PREFETCHED_LINKS,
          plugins: [
            new AmpPrefetchPlugin({
              maxEntries: 10,
              maxAgeSeconds: maxAgeSecondsInCache,
              postDelete: (url: string) => {
                const linkRE = convertUrlToRegExp(cleanHostInfoFromUrl(url));
                navigationRoute_.removeDeniedUrls(linkRE);
              },
            }),
          ],
          networkTimeoutSeconds: 0.5,
        }),
      );
    });
  }

  async cachePrefetchLinks_(links: Array<string>) {
    // allow links to same domain only.
    const allowedLinks = links.filter(link => {
      const matches = link.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      const domain = matches && matches[1];
      // only allow null/ same domain URLs
      return domain === null || domain === self.location.host;
    });
    // TODO: add logic to only allow URLs within SW scope.
    if (allowedLinks && allowedLinks.length > 0) {
      const cache = await caches.open(AMP_PREFETCHED_LINKS);
      await cache.addAll(allowedLinks);
      const linkRegExps = allowedLinks.map(link =>
        convertUrlToRegExp(cleanHostInfoFromUrl(link)),
      );
      this.addRouteHandler_(linkRegExps);
    }
  }
}
