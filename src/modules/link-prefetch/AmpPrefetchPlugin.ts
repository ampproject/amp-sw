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
import { Plugin } from 'workbox-cache-expiration';

export class AmpPrefetchPlugin extends Plugin {
  _config: any;
  constructor(config: any) {
    super(config);
  }
  async cacheWillUpdate({
    request,
  }: {
    request: Request;
  }): Promise<Response | null> {
    /**
     * Never cache anything, since its a prefetch module,
     * the caching will actually be dome by the postMessage listener.
     */
    return null;
  }
  async cachedResponseWillBeUsed({
    cacheName,
    request,
    cachedResponse,
  }: {
    cacheName: string;
    request: Request;
    cachedResponse: Response;
  }): Promise<Response | null> {
    const response = await super.cachedResponseWillBeUsed({
      cacheName,
      cachedResponse,
    });
    const cache = await caches.open(cacheName);
    const url = request.url;
    /**
     * Delete the url from cache, as the prefetch should
     * only work for one request,
     * but dont wait on actual delete operation.
     */
    cache.delete(request).then(() => {
      if (this._config.postDelete) {
        this._config.postDelete(url);
      }
    });
    return response;
  }
}
