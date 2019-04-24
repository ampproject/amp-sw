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

import { serializeObject } from './serialize';
import { ServiceWorkerConfiguration } from '../configuration';
import { fetchRequiredAssetsForUrl } from './asset-gatherer';

export async function buildSW(
  config: ServiceWorkerConfiguration = {
    documentCachingOptions: {},
  },
  importFrom: string = 'https://cdn.ampproject.org/amp-sw.js',
  eject: boolean = false,
) {
  let code = '';
  if (config.offlinePageOptions && config.offlinePageOptions.url) {
    config.offlinePageOptions.assets = config.offlinePageOptions.assets || [];
    config.offlinePageOptions.assets = config.offlinePageOptions.assets.concat(
      await fetchRequiredAssetsForUrl(config.offlinePageOptions.url),
    );
  }
  code = `importScripts('${importFrom}')\n`;
  if (eject) {
    code += 'AMP_SW.installNoOpServiceWorker()';
  } else {
    code += `AMP_SW.init(${serializeObject(config || {})})`;
  }

  return code;
}
