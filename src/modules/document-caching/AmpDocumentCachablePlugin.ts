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

export default class AmpDocumentCachablePlugin extends Plugin {
  private allowedPages_: Array<RegExp>;

  constructor(config: {
    maxEntries?: Number;
    maxAgeSeconds?: Number;
    allowedNonAMPPages?: Array<RegExp>;
  }) {
    const { allowedNonAMPPages, ...pluginConfig } = config;
    super(pluginConfig);
    if (allowedNonAMPPages && Array.isArray(allowedNonAMPPages)) {
      this.allowedPages_ = allowedNonAMPPages;
    } else if (allowedNonAMPPages && !Array.isArray(allowedNonAMPPages)) {
      throw new TypeError('allowedNonAMPPages should be an array of RegExp');
    }
  }
  async cacheWillUpdate({
    response,
  }: {
    response: Response;
  }): Promise<Response | null> {
    const clonedResponse = response.clone();
    const responseContentType = clonedResponse.headers.get('content-type');

    // TODO: implement header check as well as it'll be less work.
    if (responseContentType && responseContentType.includes('text/html')) {
      try {
        // Check if the url qualifies for any explicitly allowed page.
        if (this.allowedPages_) {
          for (let index = 0; index < this.allowedPages_.length; index++) {
            const currentTestUrl = this.allowedPages_[index];
            if (currentTestUrl.test(clonedResponse.url)) {
              return response;
            }
          }
        }

        const responseBody = await clonedResponse.text();
        // Check if the response is AMP HTML page, only then cache it.
        if (/<html\s[^>]*(⚡|amp)[^>]*>/.test(responseBody)) {
          return response;
        }
      } catch (e) {
        return null;
      }
      return null;
    }
    // Non HTML responses will/should have reached here in first place.
    return null;
  }
}
