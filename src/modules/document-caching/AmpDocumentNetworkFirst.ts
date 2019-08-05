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
import { NetworkFirst } from 'workbox-strategies';
import { AMP_PUBLISHER_CACHE } from './constants';

// TODO(KB): Temporary Interface until Workbox v5. Replace when upgrading.
interface RequestOptions {
  event: ExtendableEvent;
  request: Request | string;
}

export class AmpDocumentNetworkFirst extends NetworkFirst {
  private offlineFallbackUrl?: string;

  constructor(options: any, offlineFallbackUrl?: string) {
    super(options);
    this.offlineFallbackUrl = offlineFallbackUrl;
  }

  async makeRequest({ event, request }: RequestOptions): Promise<Response> {
    const response: Response = await super.makeRequest({ event, request });
    if (!response && this.offlineFallbackUrl) {
      const cache = await caches.open(AMP_PUBLISHER_CACHE);
      const cachedOfflineFallbackResponse = await cache.match(
        this.offlineFallbackUrl,
      );
      if (cachedOfflineFallbackResponse) {
        return cachedOfflineFallbackResponse;
      }
    }
    return response;
  }
}
