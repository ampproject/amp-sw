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

import { cacheName as AMP_PUBLISHER_CACHE_NAME } from '../document-caching/constants';
import { cacheName as ASSET_CACHE } from '../asset-caching/constants';
import { AmpSwModule } from '../core/AmpSwModule';

export type OfflinePageOptions = {
  url: string;
  assets: Array<string>;
};

export class OfflinePageAmpSwModule implements AmpSwModule {
  async init(url: string, assets: Array<string>) {
    const publisherCache = await caches.open(AMP_PUBLISHER_CACHE_NAME);
    const assetsCache = await caches.open(ASSET_CACHE);
    const response = await fetch(url);
    if (response.ok) {
      await publisherCache.put(new Request(url), response);
      await assetsCache.addAll(assets);
    }
  }
}
