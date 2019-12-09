
[![build](https://travis-ci.org/ampproject/amp-sw.svg?branch=master)](https://travis-ci.org/ampproject/amp-sw.svg?branch=master)
# AMP Service worker
AMP service worker is a service worker library for your AMP documents.

**Purpose:** Enhance network resiliency and optimize AMP asset reuse for AMP documents.

**Core use cases:**  
- Cache AMP scripts with a `stale-while-revalidate` strategy for a longer duration than the default http response headers indicate.
- Cache valid visited AMP documents, and serve only in case of flaky network conditions.
- Cache assets which are critical to a page with a given strategy.
- Cache an offline page in order to show when a user navigates to a page which was previously not visited.
- Prefetch outgoing links from an AMP page.


## Usage
To take advantage of AMP service worker, you'll need to host a resource loaded into the browser. Start by following these steps:

- Host a service worker file at the same directory level as your AMP web app/ AMP page.
- Add `amp-install-serviceworker`(https://amp.dev/documentation/components/amp-install-serviceworker) to your AMP documents and point it your service worker file.
e.g.
```html
<amp-install-serviceworker
  src="https://www.your-domain.com/serviceworker.js"
  data-iframe-src="https://www.your-domain.com/install-serviceworker.html"
  layout="nodisplay">
</amp-install-serviceworker>
```
- Add the following code to your service worker file to get the benefits of AMP service worker out of the box.
```js
importScripts('https://cdn.ampproject.org/sw/amp-sw.js');
AMP_SW.init();
```
- You can configure amp service worker to customize the behavior of the service worker to fit your needs. e.g. You can cache your static assets, control your document timeout limits or add an offline page. Read more in [modules](#modules) section.
```js
AMP_SW.init({
  assetCachingOptions: [{
    regexp: /\.(png|jpg|woff2|woff|css|js)/,
    cachingStrategy: 'CACHE_FIRST',
  }],
  offlinePageOptions: {
    url: '/offline.html',
    assets: [],
  },
});
```


## Modules

The AMP service worker is built up of the following modules:
1. [AMP caching module](https://github.com/ampproject/amp-sw/tree/master/src/modules/amp-caching) is responsible for caching the AMP binaries released as a part 
deployment cycle. It is a non-configurable module and has the defaults based on AMP's release cycle.
2. [Document caching module](https://github.com/ampproject/amp-sw/tree/master/src/modules/document-caching) is the module which is responsible for caching the AMP documents. This module serves the page from cache(if available) is the network request fails or does not serve within a configurable time limit.
3. [Asset caching module](https://github.com/ampproject/amp-sw/tree/master/src/modules/asset-caching) is a lazily loaded and optional, it can be used to cache the static assets like images/ fonts etc. You can give the reg-exp for matching assets and the caching strategy(CACHE_FIRST/NETWORK_FIRST/CACHE_ONLY) for the same.
4. [Offline page module](https://github.com/ampproject/amp-sw/tree/master/src/modules/offline-page) can be used to introduce an offline page to your web app. AMP_SW only caches the documents which the user has already visited. If in the absence of the network the user tries to navigate to a page which is not available in the cache, this offline page is shown as a backup to let the user know what happened.
5. [Link prefetch module](https://github.com/ampproject/amp-sw/tree/master/src/modules/link-prefetch) provides link prefetch capabilities to the browsers which do not support `link rel=prefetch`. You can use this to prefetch links and serve them from the service worker cache for the next time.

While `amp-sw` is divided into smaller sub modules, the core funationality of this project relies on the [Workbox](https://github.com/GoogleChrome/workbox) project. The `amp-sw` modules also extend parts of the Workbox project.
