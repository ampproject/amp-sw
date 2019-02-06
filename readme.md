
[![build](https://travis-ci.org/ampproject/amp-sw.svg?branch=master)](https://travis-ci.org/ampproject/amp-sw.svg?branch=master)
# AMP Service worker
AMP service worker is a service worker library for your AMP pages.

The project aims to bring network resiliency and other network related optimizations to any AMP page which is being controlled by this service worker.
Core use cases:
- Cache AMP scripts with a `stale-while-revalidate` strategy for a longer duration that http-headers.
- Cache valid visited AMP documents, and serve only in case of flaky network conditions.
- Cache assets which are critical to a page with a given stategy.
- Prefetch outgoing linksfrom an AMP page.
- Cache an offline page in order to show when a user navigates to a page which was previously not visited.


## Usage
In order to use this library user can include the library with an importScript in their service worker

```
importScripts('https://cdn.ampproject.org/sw/amp-sw.js');
AMP_SW.init();
```

## Modules

The AMP service worker is built up of the following modules:
1. [AMP caching module](https://github.com/ampproject/amp-sw/tree/master/src/modules/amp-caching)
2. [Document caching module](https://github.com/ampproject/amp-sw/tree/master/src/modules/document-caching)
3. [Asset caching module](https://github.com/ampproject/amp-sw/tree/master/src/modules/asset-caching)
4. [Link prefetch module](https://github.com/ampproject/amp-sw/tree/master/src/modules/link-prefetch)
5. [Offline page module](https://github.com/ampproject/amp-sw/tree/master/src/modules/offline-page)

The description of each module and their configuration options can be found inside their respective folder's README.
