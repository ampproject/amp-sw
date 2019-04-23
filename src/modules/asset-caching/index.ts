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
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  // @ts-ignore
} from 'workbox-strategies';
// @ts-ignore
import { Plugin } from 'workbox-cache-expiration';
import { cacheName } from './constants';
import { AmpSwModule } from '../core/AmpSwModule';

export type AssetCachingOptions = Array<{
  regexp: RegExp;
  cachingStrategy: 'NETWORK_FIRST' | 'CACHE_FIRST' | 'STALE_WHILE_REVALIDATE';
  denyList?: Array<RegExp>;
}>;

class AssetCachingPlugin extends Plugin {
  denyList_?: Array<RegExp>;

  constructor(config: any, denyList?: Array<RegExp>) {
    super(config);
    this.denyList_ = denyList;
  }
  async cacheWillUpdate({
    request,
    response,
  }: {
    request: Request;
    response: Response;
  }): Promise<Response | null> {
    let returnedResponse: Response | null = null;
    this.denyList_ &&
      this.denyList_.forEach(deniedUrlRegExp => {
        if (deniedUrlRegExp.test(request.url)) {
          return null;
        }
      });
    if (super.cacheWillUpdate) {
      returnedResponse = await super.cacheWillUpdate({ response });
    } else {
      returnedResponse = response;
    }
    if (!returnedResponse) {
      return null;
    }
    const cachableResponse = returnedResponse.clone();
    const responseContentType = cachableResponse.headers.get('content-type');
    if (responseContentType && responseContentType.includes('text/html')) {
      return null;
    }
    return cachableResponse;
  }
}
export class AssetCachingAmpModule implements AmpSwModule {
  init(assetCachingOptions: AssetCachingOptions) {
    assetCachingOptions.forEach(assetCachingOption => {
      let cachingStrategy = null;
      const cachingConfig = {
        cacheName,
        plugins: [
          new AssetCachingPlugin({
            maxEntries: 25,
            denyList: assetCachingOption.denyList,
          }),
        ],
      };

      switch (assetCachingOption.cachingStrategy) {
        case 'NETWORK_FIRST':
          cachingStrategy = new NetworkFirst(cachingConfig);
          break;
        case 'STALE_WHILE_REVALIDATE':
          cachingStrategy = new StaleWhileRevalidate(cachingConfig);
          break;
        default:
          cachingStrategy = new CacheFirst(cachingConfig);
          break;
      }

      router.registerRoute(assetCachingOption.regexp, cachingStrategy);
    });
  }
}
